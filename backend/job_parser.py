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
        self.nlp = spacy.load('en_core_web_sm')
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
        doc = self.nlp(self.job_description.lower())
        
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
        doc = self.nlp(self.job_description)
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

def parse_job_posting(job_text):
    """Parse job posting text to extract title, requirements, and skills"""
    # Extract job title
    title = extract_job_title(job_text)
    
    # Extract requirements
    requirements = extract_requirements(job_text)
    
    # Extract skills
    skills = extract_skills_from_job(job_text)
    
    return title, requirements, skills

def extract_job_title(text):
    """Extract job title from the job posting"""
    # Look for common job title patterns
    title_patterns = [
        r'(?i)job title:?\s*([^\n]+)',
        r'(?i)position:?\s*([^\n]+)',
        r'(?i)role:?\s*([^\n]+)'
    ]
    
    for pattern in title_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    # Default to first line or "Unknown Title"
    first_line = text.split('\n')[0].strip()
    return first_line if first_line else "Unknown Title"

def extract_requirements(text):
    """Extract job requirements from the posting"""
    # Look for common requirement section patterns
    requirement_patterns = [
        r'(?i)requirements?:?\s*([^#]+?)(?=\n\s*\n|\n\s*[A-Z]|\Z)',
        r'(?i)qualifications?:?\s*([^#]+?)(?=\n\s*\n|\n\s*[A-Z]|\Z)',
        r'(?i)what you\'ll need:?\s*([^#]+?)(?=\n\s*\n|\n\s*[A-Z]|\Z)',
        r'(?i)skills( required)?:?\s*([^#]+?)(?=\n\s*\n|\n\s*[A-Z]|\Z)'
    ]
    
    requirements = []
    
    for pattern in requirement_patterns:
        matches = re.search(pattern, text)
        if matches:
            req_text = matches.group(1).strip()
            # Split into bullet points if available
            bullet_items = re.split(r'\n\s*[•\-*]\s*', req_text)
            for item in bullet_items:
                if item.strip():
                    requirements.append(item.strip())
    
    # If no structured requirements found, attempt to extract based on keywords
    if not requirements:
        sentences = nltk.sent_tokenize(text)
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in ['experience', 'skill', 'proficiency', 'knowledge', 'degree', 'qualification']):
                requirements.append(sentence.strip())
    
    return requirements

def extract_skills_from_job(text):
    """Extract skills from job posting text using NLP"""
    # Common skills and technologies
    common_skills = {
        "programming": ["python", "java", "javascript", "c++", "ruby", "php", "swift", "kotlin", "go", "rust", "typescript"],
        "web": ["html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "bootstrap"],
        "database": ["sql", "mysql", "postgresql", "mongodb", "firebase", "oracle", "nosql", "redis"],
        "cloud": ["aws", "azure", "gcp", "cloud", "docker", "kubernetes", "serverless"],
        "data": ["machine learning", "data science", "ai", "artificial intelligence", "data analysis", "big data", "tableau", "power bi"],
        "tools": ["git", "github", "jira", "agile", "scrum", "ci/cd", "jenkins", "terraform"]
    }
    
    # Soft skills
    soft_skills = [
        "communication", "teamwork", "problem solving", "creativity", "adaptability", 
        "leadership", "time management", "critical thinking", "collaboration", "attention to detail"
    ]
    
    # Combine all skills
    all_skills = [skill for category in common_skills.values() for skill in category] + soft_skills
    
    # Process the text with spaCy
    doc = nlp(text.lower())
    
    # Find skills using regex patterns
    found_skills = set()
    
    for skill in all_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text.lower()):
            found_skills.add(skill)
    
    # Look for years of experience
    experience_patterns = [
        r'(\d+)\+?\s*(?:years|yrs)(?:\s*of)?\s*experience',
        r'experience(?:\s*of)?\s*(\d+)\+?\s*(?:years|yrs)'
    ]
    
    for pattern in experience_patterns:
        matches = re.findall(pattern, text.lower())
        if matches:
            for match in matches:
                found_skills.add(f"{match}+ years experience")
    
    # Look for education requirements
    education_patterns = [
        r"(?:bachelor'?s|master'?s|phd|doctorate|bs|ms|ba|ma)\s+(?:degree)?",
        r"degree\s+in\s+([^.,;:]+)"
    ]
    
    for pattern in education_patterns:
        matches = re.findall(pattern, text.lower())
        if matches:
            for match in matches:
                if isinstance(match, tuple):
                    found_skills.add(f"education: {match[0]}")
                else:
                    found_skills.add(f"education: {match}")
    
    return list(found_skills) 