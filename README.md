# Job Search Assistant

A Chrome extension that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) by comparing them against job postings.

## Features

- Upload and parse resumes in PDF or DOCX format
- Automatically detect job postings on websites
- Manually enter job URLs or paste job descriptions
- Analyze the match between your resume and job requirements
- Get suggestions to improve your resume for specific job postings

## Project Structure

```
JobSearchAssistant/
├── backend/
│   ├── app.py                # Flask server
│   ├── resume_parser.py      # Resume parsing logic
│   ├── job_parser.py         # Job description parsing logic
│   └── ats_analyzer.py       # Resume-job matching logic
├── extension/
│   ├── manifest.json         # Chrome extension manifest
│   ├── popup/
│   │   ├── popup.html        # Extension popup UI
│   │   ├── popup.css         # Popup styling
│   │   └── popup.js          # Popup functionality
│   └── scripts/
│       ├── content.js        # Content script for job detection
│       └── background.js     # Background script for extension
└── README.md                 # This file
```

## Setup Instructions

### Backend Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install flask flask-cors PyPDF2 python-docx nltk spacy scikit-learn
   python -m spacy download en_core_web_sm
   ```

3. Start the backend server:
   ```
   cd backend
   python app.py
   ```

### Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `extension` folder
4. The extension should now appear in your browser toolbar

## Usage

1. Click on the extension icon to open the popup
2. Upload your resume (PDF or DOCX format)
3. Navigate to a job posting page
   - The extension will try to automatically detect the job posting
   - If detection fails, you can manually paste the job description
4. Click "Analyze Match" to see how well your resume matches the job requirements
5. Review the match score, missing keywords, and suggestions to improve your resume

## Tools Used

- **Backend**: Flask, NLTK, spaCy, scikit-learn
- **Frontend**: HTML, CSS, JavaScript
- **Chrome Extension**: Chrome Extension API

## License

MIT 