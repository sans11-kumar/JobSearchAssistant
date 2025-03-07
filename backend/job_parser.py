import re
import nltk
from nltk.corpus import stopwords
import spacy
from nltk.tokenize import word_tokenize

# Load spaCy model
nlp = spacy.load('en_core_web_sm')

class JobParser:
    def __init__(self, job_description):
        self.job_description = job_description
        self.stop_words = set(stopwords.words('english'))
    
    def _extract_requirements(self):
        """Extract job requirements from the job description"""
        requirements = []
        
        # Look for sections that might contain requirements
        requirement_sections = [
            "requirements", "qualifications", "what you'll need", 
            "what we're looking for", "skills", "experience"
        ]
        
        lines = self.job_description.split('\n')
        in_requirements_section = False
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Check if this line starts a requirements section
            if any(section in line_lower for section in requirement_sections):
                in_requirements_section = True
                requirements.append(line.strip())
                continue
            
            # Check if we're in a requirements section
            if in_requirements_section:
                # Check if this line might end the requirements section
                if line.strip() == "" and i < len(lines) - 1 and lines[i+1].strip() != "":
                    # Empty line followed by non-empty line might indicate section change
                    if any(section in lines[i+1].lower() for section in ["benefits", "about us", "what we offer"]):
                        in_requirements_section = False
                        continue
                
                # Add the line if it's not empty
                if line.strip():
                    requirements.append(line.strip())
        
        # If we couldn't find a clear requirements section, extract bullet points
        if not requirements:
            bullet_pattern = r'[•\-\*]\s*(.*)'
            bullets = re.findall(bullet_pattern, self.job_description)
            requirements = [bullet.strip() for bullet in bullets]
        
        return requirements
    
    def _extract_skills(self):
        """Extract required skills from the job description"""
        # Common skill keywords
        skill_keywords = [
            "python", "java", "javascript", "html", "css", "react", "angular", "vue", 
            "node.js", "express", "django", "flask", "sql", "nosql", "mongodb", 
            "postgresql", "mysql", "aws", "azure", "gcp", "docker", "kubernetes", 
            "git", "agile", "scrum", "jira", "confluence", "jenkins", "ci/cd",
            "machine learning", "data science", "artificial intelligence", "nlp",
            "project management", "leadership", "communication", "teamwork",
            "problem solving", "critical thinking", "time management"
        ]
        
        # Extract skills based on common keywords
        skills = []
        doc = nlp(self.job_description.lower())
        
        # Check for skill keywords
        for skill in skill_keywords:
            if skill in self.job_description.lower():
                skills.append(skill)
        
        # Extract skills based on NER
        for ent in doc.ents:
            if ent.label_ == "ORG" or ent.label_ == "PRODUCT":
                if ent.text.lower() not in [s.lower() for s in skills]:
                    skills.append(ent.text)
        
        return list(set(skills))
    
    def _extract_job_title(self):
        """Extract the job title from the job description"""
        # Look for common patterns for job titles
        title_patterns = [
            r'job title:?\s*(.*)',
            r'position:?\s*(.*)',
            r'role:?\s*(.*)'
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, self.job_description, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # If no pattern matches, try to extract from the first few lines
        lines = self.job_description.split('\n')
        for line in lines[:3]:  # Check first 3 lines
            if line.strip() and len(line.strip().split()) <= 6:  # Job titles are usually short
                return line.strip()
        
        return "Unknown Job Title"
    
    def _extract_company(self):
        """Extract the company name from the job description"""
        # Look for common patterns for company names
        company_patterns = [
            r'company:?\s*(.*)',
            r'about\s+(.*?):',
            r'at\s+(.*?),',
            r'join\s+(.*?)\s+team'
        ]
        
        for pattern in company_patterns:
            match = re.search(pattern, self.job_description, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # If no pattern matches, try to extract using NER
        doc = nlp(self.job_description)
        for ent in doc.ents:
            if ent.label_ == "ORG":
                return ent.text
        
        return "Unknown Company"
    
    def parse(self):
        """Parse the job description and extract relevant information"""
        requirements = self._extract_requirements()
        skills = self._extract_skills()
        job_title = self._extract_job_title()
        company = self._extract_company()
        
        # Create a word frequency dictionary (excluding stop words)
        words = word_tokenize(self.job_description.lower())
        word_freq = {}
        for word in words:
            if word.isalnum() and word not in self.stop_words:
                if word in word_freq:
                    word_freq[word] += 1
                else:
                    word_freq[word] = 1
        
        return {
            "job_title": job_title,
            "company": company,
            "requirements": requirements,
            "skills": skills,
            "word_frequency": word_freq,
            "full_text": self.job_description
        }
