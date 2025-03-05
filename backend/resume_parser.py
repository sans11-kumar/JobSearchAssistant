import logging
import os
import PyPDF2
import docx
import re
import nltk
from nltk.corpus import stopwords
import spacy
from pathlib import Path
from typing import List, Dict, Optional
from nltk.tokenize import word_tokenize

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK data
try:
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')
except Exception as e:
    logger.error(f"Failed to download NLTK data: {e}")
    raise

# Load spaCy model with caching
try:
    nlp = spacy.load('en_core_web_sm')
    logger.info("Loaded spaCy model successfully")
except Exception as e:
    logger.error(f"Failed to load spaCy model: {e}")
    raise

class ResumeParser:
    def __init__(self, resume_path):
        self.resume_path = resume_path
        self.nlp = spacy.load('en_core_web_sm')
        self.stop_words = set(stopwords.words('english'))
        self.text = self._extract_text()
        
    def _extract_text(self):
        """Extract text from resume file (PDF or DOCX)"""
        file_extension = self.resume_path.split('.')[-1].lower()
        
        if file_extension == 'pdf':
            return self._extract_text_from_pdf()
        elif file_extension in ['docx', 'doc']:
            return self._extract_text_from_docx()
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")
    
    def _extract_text_from_pdf(self):
        """Extract text from PDF file"""
        text = ""
        try:
            with open(self.resume_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text()
            return text
        except IOError as e:
            logger.error(f"Error reading PDF file: {e}")
            return ""
    
    def _extract_text_from_docx(self):
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(self.resume_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except IOError as e:
            logger.error(f"Error reading DOCX file: {e}")
            return ""
    
    def parse(self):
        """Parse resume and extract relevant information"""
        # Extract basic information
        skills = extract_skills(self.text)
        
        # Return structured data
        return {
            'text': self.text,
            'skills': skills
        }

def extract_skills(text):
    """Extract skills from resume text using NLP"""
    # Common technical skills and keywords
    common_skills = {
        "programming": ["python", "java", "javascript", "c++", "ruby", "php", "swift", "kotlin", "go", "rust", "typescript"],
        "web": ["html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "bootstrap"],
        "database": ["sql", "mysql", "postgresql", "mongodb", "firebase", "oracle", "nosql", "redis"],
        "cloud": ["aws", "azure", "gcp", "cloud", "docker", "kubernetes", "serverless"],
        "data": ["machine learning", "data science", "ai", "artificial intelligence", "data analysis", "big data", "tableau", "power bi"],
        "tools": ["git", "github", "jira", "agile", "scrum", "ci/cd", "jenkins", "terraform"]
    }
    
    # Flatten the skills list
    all_skills = [skill for category in common_skills.values() for skill in category]
    
    # Process the text with spaCy
    doc = nlp(text.lower())
    
    # Find skills using regex patterns and spaCy entities
    found_skills = set()
    
    # Check for common skills using regex
    for skill in all_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text.lower()):
            found_skills.add(skill)
    
    # Extract skills from noun phrases
    for chunk in doc.noun_chunks:
        if chunk.text.lower() in all_skills:
            found_skills.add(chunk.text.lower())
    
    # Add named entities that might be technologies
    for ent in doc.ents:
        if ent.label_ in ["PRODUCT", "ORG"] and ent.text.lower() in all_skills:
            found_skills.add(ent.text.lower())
    
    return list(found_skills)
