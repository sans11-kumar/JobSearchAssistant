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
    # Validate file presence
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']
    
    # Validate file name and extension
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    allowed_extensions = ['pdf', 'doc', 'docx']
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in allowed_extensions:
        return jsonify({
            'error': 'Invalid file type',
            'allowed_types': allowed_extensions
        }), 400

    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > max_size:
        return jsonify({
            'error': 'File too large',
            'max_size': f'{max_size} bytes'
        }), 400

    # Save the file temporarily
    temp_path = f'temp_{uuid.uuid4()}.{file_extension}'
    try:
        file.save(temp_path)
        
        # Parse the resume
        parser = ResumeParser(temp_path)
        resume_data = parser.parse()
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return jsonify({
            'status': 'success',
            'data': resume_data
        })
        
    except Exception as e:
        # Clean up in case of error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({
            'error': 'Failed to process resume',
            'details': str(e)
        }), 500

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
