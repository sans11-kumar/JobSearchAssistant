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

def analyze_match(resume_text, resume_skills, job_title, job_requirements, job_skills):
    """Analyze how well the resume matches the job posting"""
    # Calculate overall match score
    match_percentage = calculate_match_percentage(resume_text, resume_skills, job_title, job_requirements, job_skills)
    
    # Find missing keywords
    missing_keywords = identify_missing_keywords(resume_skills, job_skills)
    
    # Generate key findings
    key_findings = generate_key_findings(resume_text, resume_skills, job_requirements, job_skills, match_percentage)
    
    # Generate suggestions
    suggestions = generate_suggestions(resume_text, resume_skills, job_requirements, job_skills, missing_keywords)
    
    return {
        'match_percentage': match_percentage,
        'missing_keywords': missing_keywords,
        'key_findings': key_findings,
        'suggestions': suggestions
    }

def calculate_match_percentage(resume_text, resume_skills, job_title, job_requirements, job_skills):
    """Calculate the match percentage between resume and job"""
    # Combine job requirements into a single string
    job_req_text = ' '.join(job_requirements)
    
    # Calculate TF-IDF similarity
    tfidf_vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = tfidf_vectorizer.fit_transform([resume_text, job_req_text])
        content_similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0] * 100
    except:
        content_similarity = 0
    
    # Calculate skills match
    total_job_skills = len(job_skills)
    if total_job_skills == 0:
        skills_match_percentage = 0
    else:
        matching_skills = sum(1 for skill in job_skills if any(skill.lower() in rs.lower() for rs in resume_skills))
        skills_match_percentage = (matching_skills / total_job_skills) * 100
    
    # Weighted average (skills are more important)
    match_percentage = (content_similarity * 0.4) + (skills_match_percentage * 0.6)
    
    return round(match_percentage)

def identify_missing_keywords(resume_skills, job_skills):
    """Identify keywords from job that are missing in the resume"""
    resume_skills_lower = [skill.lower() for skill in resume_skills]
    missing = []
    
    for skill in job_skills:
        skill_lower = skill.lower()
        if not any(skill_lower in rs for rs in resume_skills_lower):
            missing.append(skill)
    
    return missing

def generate_key_findings(resume_text, resume_skills, job_requirements, job_skills, match_percentage):
    """Generate key findings based on the analysis"""
    findings = []
    
    # Overall match assessment
    if match_percentage >= 80:
        findings.append(f"Your resume is a strong match ({match_percentage}%) for this position.")
    elif match_percentage >= 60:
        findings.append(f"Your resume is a good match ({match_percentage}%) but could be improved.")
    else:
        findings.append(f"Your resume needs significant improvements to match this job ({match_percentage}%).")
    
    # Skills assessment
    matching_skills = [skill for skill in resume_skills if any(skill.lower() in js.lower() for js in job_skills)]
    if matching_skills:
        findings.append(f"Your resume highlights {len(matching_skills)} relevant skills for this position.")
    
    # Experience assessment
    experience_pattern = r'(?:(\d+)\+?\s*years?\s*(?:of)?\s*experience)'
    job_exp_matches = []
    
    for req in job_requirements:
        matches = re.findall(experience_pattern, req.lower())
        job_exp_matches.extend(matches)
    
    resume_exp_matches = re.findall(experience_pattern, resume_text.lower())
    
    if job_exp_matches and resume_exp_matches:
        job_years = max([int(y) for y in job_exp_matches])
        resume_years = max([int(y) for y in resume_exp_matches])
        
        if resume_years >= job_years:
            findings.append(f"Your experience level ({resume_years}+ years) meets or exceeds the job requirement ({job_years}+ years).")
        else:
            findings.append(f"The job requires {job_years}+ years of experience, but your resume only indicates {resume_years}+ years.")
    
    return findings

def generate_suggestions(resume_text, resume_skills, job_requirements, job_skills, missing_keywords):
    """Generate suggestions for improving the resume"""
    suggestions = []
    
    # Suggest adding missing keywords
    if missing_keywords:
        if len(missing_keywords) <= 3:
            suggestions.append(f"Add these missing keywords to your resume: {', '.join(missing_keywords)}")
        else:
            top_keywords = missing_keywords[:3]
            suggestions.append(f"Add these important missing keywords: {', '.join(top_keywords)} and {len(missing_keywords) - 3} others")
    
    # Check if resume has quantifiable achievements
    if not re.search(r'\d+%|\d+x|\$\d+|\d+\s*million|\d+\s*customers', resume_text, re.IGNORECASE):
        suggestions.append("Add quantifiable achievements (e.g., 'increased sales by 20%', 'reduced costs by $50K')")
    
    # Check for action verbs
    action_verbs = ['achieved', 'improved', 'led', 'managed', 'developed', 'created', 'implemented']
    used_action_verbs = [verb for verb in action_verbs if re.search(r'\b' + verb + r'\b', resume_text.lower())]
    
    if len(used_action_verbs) < 3:
        suggestions.append("Use more action verbs (e.g., 'achieved', 'improved', 'developed') to describe your experiences")
    
    # Check for ATS-friendly formatting
    if re.search(r'[\u2022\u2023\u25E6\u2043\u2219]', resume_text):  # Checks for bullet symbols
        suggestions.append("Replace special characters and bullet points with plain text for better ATS compatibility")
    
    # Suggest customization for specific job
    suggestions.append("Tailor your resume summary/objective specifically for this role")
    
    # Check resume length (approximate)
    word_count = len(word_tokenize(resume_text))
    if word_count > 600:  # Roughly 1 page
        suggestions.append("Consider shortening your resume to focus on the most relevant experiences")
    
    return suggestions 