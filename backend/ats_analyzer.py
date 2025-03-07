from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import numpy as np

nltk.download('punkt')
nltk.download('stopwords')

class ATSAnalyzer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
    
    def _calculate_match_percentage(self, resume_text, job_text):
        """Calculate the match percentage between resume and job description"""
        # Create TF-IDF vectors
        tfidf_matrix = self.vectorizer.fit_transform([resume_text, job_text])
        
        # Calculate cosine similarity
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        
        # Convert to percentage
        match_percentage = round(cosine_sim * 100, 2)
        
        return match_percentage
    
    def _identify_missing_keywords(self, resume_data, job_data):
        """Identify keywords from the job description missing in the resume"""
        # Extract skills from both
        job_skills = set([skill.lower() for skill in job_data.get('skills', [])])
        resume_skills = set([skill.lower() for skill in resume_data.get('skills', [])])
        
        # Find missing skills
        missing_skills = job_skills - resume_skills
        
        # Extract word frequencies
        job_words = job_data.get('word_frequency', {})
        resume_words = resume_data.get('word_frequency', {})
        
        # Find important words in job description that are missing in resume
        missing_keywords = []
        for word, freq in job_words.items():
            if word not in resume_words and freq > 1:  # Only consider words that appear more than once
                missing_keywords.append(word)
        
        return list(missing_skills), missing_keywords
    
    def _generate_suggestions(self, resume_data, job_data, missing_skills, missing_keywords):
        """Generate suggestions to improve the resume based on the analysis"""
        suggestions = []
        
        # Suggestions based on missing skills
        if missing_skills:
            suggestions.append(f"Add these skills to your resume: {', '.join(missing_skills)}")
        
        # Suggestions based on missing keywords
        if missing_keywords:
            suggestions.append(f"Consider incorporating these keywords: {', '.join(missing_keywords[:10])}")
        
        # Suggestions based on job requirements
        job_requirements = job_data.get('requirements', [])
        if job_requirements:
            for req in job_requirements[:3]:  # Consider first few requirements
                if not any(word in resume_data.get('full_text', '').lower() for word in req.lower().split()):
                    suggestions.append(f"Address this requirement: '{req}'")
        
        # General suggestions
        suggestions.append("Tailor your resume summary to match the job description")
        suggestions.append("Quantify your achievements with numbers and metrics")
        suggestions.append("Use action verbs to describe your experience")
        
        return suggestions
    
    def analyze(self, resume_data, job_data):
        """Analyze the match between a resume and job description"""
        # Calculate match percentage
        match_percentage = self._calculate_match_percentage(
            resume_data.get('full_text', ''),
            job_data.get('full_text', '')
        )
        
        # Identify missing keywords and skills
        missing_skills, missing_keywords = self._identify_missing_keywords(resume_data, job_data)
        
        # Generate suggestions
        suggestions = self._generate_suggestions(resume_data, job_data, missing_skills, missing_keywords)
        
        # Create key findings
        key_findings = []
        if match_percentage < 50:
            key_findings.append("Your resume has a low match rate with this job posting")
        if missing_skills:
            key_findings.append(f"You're missing {len(missing_skills)} key skills mentioned in the job posting")
        if missing_keywords:
            key_findings.append(f"There are {len(missing_keywords)} important keywords missing from your resume")
        
        return {
            "match_percentage": match_percentage,
            "key_findings": key_findings,
            "missing_skills": list(missing_skills),
            "missing_keywords": missing_keywords[:20],  # Limit to top 20
            "suggestions": suggestions
        }
