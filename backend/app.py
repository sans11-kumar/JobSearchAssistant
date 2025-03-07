from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
from resume_parser import ResumeParser
from job_parser import JobParser
from ats_analyzer import ATSAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    """
    Endpoint to parse a resume file and extract relevant information
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save the file temporarily
    temp_path = str(uuid.uuid4()) + '.' + file.filename.split('.')[-1]
    file.save(temp_path)

    try:
        # Parse the resume
        parser = ResumeParser(temp_path)
        resume_data = parser.parse()

        # Clean up
        os.remove(temp_path)

        return jsonify(resume_data)
    except Exception as e:
        # Clean up in case of error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': str(e)}), 500

@app.route('/api/parse-job', methods=['POST'])
def parse_job():
    """
    Endpoint to parse a job description and extract relevant information
    """
    data = request.json
    if not data or 'jobDescription' not in data:
        return jsonify({'error': 'No job description provided'}), 400
    
    try:
        # Parse the job description
        parser = JobParser(data['jobDescription'])
        job_data = parser.parse()
        
        return jsonify(job_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-match', methods=['POST'])
def analyze_match():
    """
    Endpoint to analyze the match between a resume and job description
    """
    data = request.json
    if not data or 'resumeData' not in data or 'jobData' not in data:
        return jsonify({'error': 'Missing resume or job data'}), 400
    
    try:
        # Analyze the match
        analyzer = ATSAnalyzer()
        analysis = analyzer.analyze(data['resumeData'], data['jobData'])
        
        return jsonify(analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
