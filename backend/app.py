from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import uuid
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from resume_parser import ResumeParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("Health check request received")
    return jsonify({
        'status': 'healthy'
    }), 200

@app.route('/api/parse-resume', methods=['POST'])
def parse_resume():
    """
    Endpoint to parse a resume file and extract relevant information
    """
    logger.info("Resume parse request received")
    
    # Validate file presence
    if 'file' not in request.files:
        logger.warning("No file part in request")
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


if __name__ == '__main__':
    app.run(debug=True)
