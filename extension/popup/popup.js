// State variables
let userResume = null;
let currentJob = null;
let API_URL = 'http://localhost:5000'; // Default value

// DOM elements
const resumeStatus = document.getElementById('resumeStatus');
const resumeUpload = document.getElementById('resumeUpload');
const uploadBtn = document.getElementById('uploadBtn');
const jobStatus = document.getElementById('jobStatus');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsSection = document.getElementById('resultsSection');
const matchScore = document.getElementById('matchScore');
const keyFindings = document.getElementById('keyFindings');
const missingKeywords = document.getElementById('missingKeywords');
const suggestions = document.getElementById('suggestions');

let jobDataReceived = false;

// Enable analyze button if both resume and job are available
function checkAnalyzeButtonState() {
  if (analyzeBtn) analyzeBtn.disabled = !(userResume && currentJob && jobDataReceived);
}

// Load API URL from storage
chrome.storage.local.get(['apiUrl'], function(result) {
  if (result.apiUrl) {
    API_URL = result.apiUrl;
  }

  // Function to update job status in popup
  function updateJobStatus(job) {
    if (jobStatus) {
      jobStatus.textContent = 'Job detected: ' + job.title;
    }
    currentJob = job;
    jobDataReceived = true;
    checkAnalyzeButtonState();
  }
});

// Load saved resume from storage
chrome.storage.local.get(['resume'], function(result) {
  if (result.resume) {
    userResume = result.resume;
    if (resumeStatus) resumeStatus.textContent = 'Resume loaded: ' + userResume.name;
    checkAnalyzeButtonState();
  }
});

// Listen for job data from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'jobData') {
    updateJobStatus(message.job);
  }
});

// Check if we're on a job posting page
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'getJobDetails'}, function(response) {
    if (response) {
      updateJobStatus(response);
    }
  });
});

// Handle resume upload
uploadBtn.addEventListener('click', function() {
  if (resumeUpload.files.length > 0) {
    const file = resumeUpload.files[0];
    
    // Validate file type
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      alert('Please upload a PDF or DOCX file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      userResume = {
        name: file.name,
        type: file.type,
        data: e.target.result
      };
      
      // Store resume in extension storage
      chrome.storage.local.set({resume: userResume}, function() {
        if (resumeStatus) resumeStatus.textContent = 'Resume loaded: ' + file.name;
        checkAnalyzeButtonState();
      });
    };
    
    reader.readAsDataURL(file);
  }
});

// Handle analyze button click
analyzeBtn.addEventListener('click', function() {
  if (userResume && currentJob) {
    if (analyzeBtn) {
      analyzeBtn.textContent = 'Analyzing...';
      analyzeBtn.disabled = true;
    }

    // Load API URL from storage
    chrome.storage.local.get(['apiUrl'], function(result) {
      if (result.apiUrl) {
        API_URL = result.apiUrl;
      }

      // Send data to backend for analysis
      fetch(`${API_URL}/analyze-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resumeData: userResume,
          job: currentJob
        })
      })
      .then(response => response.json())
      .then(data => {
        // Display results
        if (matchScore) matchScore.textContent = `${data.matchPercentage}%`;
        
        // Clear previous results
        if (keyFindings) keyFindings.innerHTML = '';
        if (missingKeywords) missingKeywords.innerHTML = '';
        if (suggestions) suggestions.innerHTML = '';
        
        // Add key findings
        data.keyFindings.forEach(finding => {
          const li = document.createElement('li');
          li.textContent = finding;
          if (keyFindings) keyFindings.appendChild(li);
        });
        
        // Add missing keywords
        data.missingKeywords.forEach(keyword => {
          const li = document.createElement('li');
          li.textContent = keyword;
          if (missingKeywords) missingKeywords.appendChild(li);
        });
        
        // Add suggestions
        data.suggestions.forEach(suggestion => {
          const li = document.createElement('li');
          li.textContent = suggestion;
          if (suggestions) suggestions.appendChild(li);
        });
        
        // Show results section
        if (resultsSection) resultsSection.classList.remove('hidden');
        if (analyzeBtn) {
          analyzeBtn.textContent = 'Analyze Match';
          analyzeBtn.disabled = false;
        }
      })
      .catch(error => {
        console.error('Error analyzing resume:', error);
        alert('Error analyzing resume. Please make sure the backend server is running.');
        if (analyzeBtn) {
          analyzeBtn.textContent = 'Analyze Match';
          analyzeBtn.disabled = false;
        }
      });
    });
  }
});

// Wait until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // Get DOM elements with proper null checks
  const uploadResumeBtn = document.getElementById('upload-resume-btn');
  const resumeFileInput = document.getElementById('resume-file');
  const resumeMessage = document.getElementById('resumeMessage');
  const jobMessage = document.getElementById('jobMessage');
  const analysisSection = document.getElementById('analysisSection');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const analysisResults = document.getElementById('analysisResults');
  const matchPercentage = document.getElementById('matchPercentage');
  const keyFindingsList = document.getElementById('keyFindingsList');
  const keywordsContainer = document.getElementById('keywordsContainer');
  const suggestionsList = document.getElementById('suggestionsList');
  const manualInputSection = document.getElementById('manualInputSection');
  const jobUrlInput = document.getElementById('jobUrlInput');
  const fetchJobBtn = document.getElementById('fetchJobBtn');
  
  // Check if resume is already uploaded
  if (resumeMessage) {
    chrome.storage.local.get(['resumeData'], function(result) {
      if (result.resumeData) {
        resumeMessage.textContent = 'Resume uploaded successfully!';
      }
    });
  }
  
  // Check if job posting is detected
  if (jobMessage) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'checkJobPosting'}, function(response) {
            if (chrome.runtime.lastError) {
              jobMessage.textContent = 'No job posting detected. Try entering a URL manually.';
              if (manualInputSection) manualInputSection.style.display = 'block';
              return;
            }
            
            if (response && response.isJobPosting) {
              jobMessage.textContent = 'Job posting detected!';
              
              // Check if resume is uploaded to enable analysis
              chrome.storage.local.get(['resumeData'], function(result) {
                if (result.resumeData && analysisSection) {
                  analysisSection.style.display = 'block';
                }
              });
            } else {
              jobMessage.textContent = 'No job posting detected. Try entering a URL manually.';
              if (manualInputSection) manualInputSection.style.display = 'block';
            }
          });
        } catch (error) {
          jobMessage.textContent = 'No job posting detected. Try entering a URL manually.';
          if (manualInputSection) manualInputSection.style.display = 'block';
        }
      } else {
        jobMessage.textContent = 'No job posting detected. Try entering a URL manually.';
        if (manualInputSection) manualInputSection.style.display = 'block';
      }
    });
  }

  // Upload resume button click handler
  if (uploadResumeBtn && resumeFileInput) {
    uploadResumeBtn.addEventListener('click', function() {
      resumeFileInput.click();
    });
  }

  // Resume file input change handler
  if (resumeFileInput && resumeMessage) {
    resumeFileInput.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF or DOCX file.');
        return;
      }
      
      // Create FormData and send to backend
      const formData = new FormData();
      formData.append('file', file);
      
      resumeMessage.textContent = 'Uploading resume...';
      
      fetch('http://localhost:5000/api/parse-resume', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        // Store resume data
        chrome.storage.local.set({resumeData: data}, function() {
          resumeMessage.textContent = 'Resume uploaded successfully!';
          
          // Check if job posting is detected to enable analysis
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {action: 'checkJobPosting'}, function(response) {
                if (response && response.isJobPosting && analysisSection) {
                  analysisSection.style.display = 'block';
                } else if (manualInputSection) {
                  manualInputSection.style.display = 'block';
                }
              });
            }
          });
        });
      })
      .catch(error => {
        console.error('Error uploading resume:', error);
        resumeMessage.textContent = 'Error uploading resume. Please try again.';
        alert('Error uploading resume. Make sure the backend server is running.');
      });
    });
  }
  
  // Fetch job button click handler
  if (fetchJobBtn && jobUrlInput && jobMessage) {
    fetchJobBtn.addEventListener('click', function() {
      const url = jobUrlInput.value.trim();
      
      if (!url) {
        // If no URL provided, prompt for job description text
        const jobText = prompt('Please paste the job description text:');
        if (!jobText || jobText.trim().length < 50) {
          alert('Please provide a valid job description (at least 50 characters).');
          return;
        }
        
        // Create job data object directly
        const jobData = {
          title: 'Manual Job Input',
          description: jobText.trim(),
          url: 'manual-input'
        };
        
        chrome.storage.local.set({currentJobData: jobData}, function() {
          jobMessage.textContent = 'Job description loaded manually!';
          
          // Check if resume is uploaded to enable analysis
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {action: 'checkJobPosting'}, function(response) {
                if (response && response.isJobPosting && analysisSection) {
                  analysisSection.style.display = 'block';
                } else if (manualInputSection) {
                  manualInputSection.style.display = 'block';
                }
              });
            }
          });
        });
        return;
      }
      
      // Create job data object directly
      const jobData = {
        title: 'Job from URL: ' + url,
        description: 'Fetched from: ' + url,
        url: url
      };
      
      chrome.storage.local.set({currentJobData: jobData}, function() {
        jobMessage.textContent = 'Job posting loaded manually!';
        
        // Check if resume is uploaded to enable analysis
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'checkJobPosting'}, function(response) {
              if (response && response.isJobPosting && analysisSection) {
                analysisSection.style.display = 'block';
              } else if (manualInputSection) {
                manualInputSection.style.display = 'block';
              }
            });
          }
        });
      });
    });
  }

  // Add event listener for analyze button
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function() {
      // Get resume data from storage
      chrome.storage.local.get(['resumeData'], function(result) {
        if (!result.resumeData) {
          alert('Please upload your resume first.');
          return;
        }
        
        // Get job description
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'getJobDescription'}, function(response) {
              if (chrome.runtime.lastError || !response || !response.jobDescription) {
                // Try to get job data from storage (manual input)
                chrome.storage.local.get(['currentJobData'], function(result) {
                  if (result.currentJobData && result.currentJobData.description) {
                    processJobDescription(result.currentJobData.description, result.resumeData);
                  } else {
                    alert('Could not extract job description. Please enter it manually.');
                    if (manualInputSection) manualInputSection.style.display = 'block';
                  }
                });
                return;
              }
              
              processJobDescription(response.jobDescription, result.resumeData);
            });
          } else {
            alert('Error accessing current tab.');
          }
        });
      });
    });
  }
  
  // Function to process job description and analyze match
  function processJobDescription(jobDescription, resumeData) {
    // Load API URL from storage
    chrome.storage.local.get(['apiUrl'], function(result) {
      if (result.apiUrl) {
        API_URL = result.apiUrl;
      }

      // Parse job description
      fetch(`${API_URL}/api/parse-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({jobDescription: jobDescription})
      })
      .then(response => response.json())
      .then(jobData => {
        // Analyze match
        fetch(`${API_URL}/api/analyze-match`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resumeData: resumeData,
            jobData: jobData
          })
        })
        .then(response => response.json())
        .then(analysis => {
          // Display analysis results
          displayAnalysisResults(analysis);
        })
        .catch(error => {
          console.error('Error analyzing match:', error);
          alert('Error analyzing match. Please try again.');
        });
      })
      .catch(error => {
        console.error('Error parsing job description:', error);
        alert('Error parsing job description. Please try again.');
      });
    });
  }
  
  // Display analysis results with null checks
  function displayAnalysisResults(analysis) {
    // Show results section
    if (analysisResults) {
      analysisResults.style.display = 'block';
    }
    
    // Update match percentage
    if (matchPercentage) {
      matchPercentage.textContent = `${analysis.match_percentage}%`;
    }
    
    // Update score circle color based on match percentage
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
      if (analysis.match_percentage >= 80) {
        scoreCircle.style.borderColor = '#34a853'; // Green for good match
      } else if (analysis.match_percentage >= 60) {
        scoreCircle.style.borderColor = '#fbbc05'; // Yellow for moderate match
      } else {
        scoreCircle.style.borderColor = '#ea4335'; // Red for poor match
      }
    }
    
    // Clear previous results
    if (keyFindingsList) keyFindingsList.innerHTML = '';
    if (keywordsContainer) keywordsContainer.innerHTML = '';
    if (suggestionsList) suggestionsList.innerHTML = '';
    
    // Add key findings
    if (keyFindingsList && analysis.key_findings) {
      analysis.key_findings.forEach(finding => {
        const li = document.createElement('li');
        li.textContent = finding;
        keyFindingsList.appendChild(li);
      });
    }
    
    // Add missing keywords
    if (keywordsContainer && analysis.missing_keywords) {
      analysis.missing_keywords.forEach(keyword => {
        const span = document.createElement('span');
        span.className = 'keyword';
        span.textContent = keyword;
        keywordsContainer.appendChild(span);
      });
    }
    
    // Add suggestions
    if (suggestionsList && analysis.suggestions) {
      analysis.suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
      });
    }
  }
});
