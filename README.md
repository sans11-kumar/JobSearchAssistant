# Job Search Assistant

A Chrome extension that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS) by comparing them against job postings using the DeepSeek API.

## Features

- Upload and parse resumes in PDF or DOCX format
- Automatically detect job postings on websites
- Manually enter job descriptions
- Analyze the match between your resume and job requirements using DeepSeek AI
- Get detailed feedback and suggestions to improve your resume for specific job postings
- Privacy-focused: personal information is redacted before sending to DeepSeek

## Setup Instructions

1. Clone this repository or download the ZIP file
2. Get a DeepSeek API key from [DeepSeek's website](https://platform.deepseek.com/)
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top-right corner
5. Click "Load unpacked" and select the `extension` folder
6. Click on the extension icon, enter your DeepSeek API key, and save it

## Usage

1. Click on the extension icon to open the popup
2. Upload your resume (PDF or DOCX format)
3. Navigate to a job posting page
   - The extension will try to automatically detect the job posting
   - If detection fails, you can manually paste the job description
4. Click "Analyze Match" to see how well your resume matches the job requirements
5. Review the detailed analysis:
   - Overall match percentage
   - Breakdown of scores by category
   - Required and preferred skills analysis
   - Key findings
   - Specific suggestions to improve your resume

## Privacy

This extension is designed with privacy in mind:
- Your resume is processed locally within the extension
- Personal information (email, phone, address) is automatically redacted before sending to DeepSeek
- Your data is not stored on any server
- API key is stored locally in your browser

## Tools & Technology

- **Frontend**: HTML, CSS, JavaScript
- **Document Parsing**: PDF.js, Mammoth.js for local file parsing
- **AI Analysis**: DeepSeek API for resume-job matching
- **Chrome Extension API**: For browser integration

## Notes

This extension operates entirely within your browser and does not require a backend server. All processing is done locally except for the AI analysis which uses the DeepSeek API.

