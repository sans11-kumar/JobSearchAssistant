// Wait until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM fully loaded');
  
  // Get DOM elements with proper null checks
  const uploadResumeBtn = document.getElementById('upload-resume-btn');
  const resumeFileInput = document.getElementById('resume-file');
  const resumeMessage = document.getElementById('resume-message');
  const jobMessage = document.getElementById('job-message');
  const analysisSection = document.getElementById('analysis-section');
  const analyzeBtn = document.getElementById('analyze-btn');
  const analysisResults = document.getElementById('analysis-results');
  const matchPercentage = document.getElementById('match-percentage');
  const keyFindingsList = document.getElementById('key-findings-list');
  const keywordsContainer = document.getElementById('keywords-container');
  const suggestionsList = document.getElementById('suggestions-list');
  const manualInputSection = document.getElementById('manual-input-section');
  const jobUrlInput = document.getElementById('job-url-input');
  const fetchJobBtn = document.getElementById('fetch-job-btn');
  
  // Log which elements were found
  console.log('DOM Elements found:');
  console.log('- uploadResumeBtn:', !!uploadResumeBtn);
  console.log('- resumeFileInput:', !!resumeFileInput);
  console.log('- resumeMessage:', !!resumeMessage);
  console.log('- jobMessage:', !!jobMessage);
  console.log('- analysisSection:', !!analysisSection);
  console.log('- analyzeBtn:', !!analyzeBtn);
  console.log('- matchPercentage:', !!matchPercentage);
  console.log('- manualInputSection:', !!manualInputSection);
  console.log('- jobUrlInput:', !!jobUrlInput);
  console.log('- fetchJobBtn:', !!fetchJobBtn);
  
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
              console.log('Error checking job posting:', chrome.runtime.lastError);
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
          console.error('Error communicating with content script:', error);
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
      console.log('Upload button clicked');
      resumeFileInput.click();
    });
  }

  // Resume file input change handler
  if (resumeFileInput && resumeMessage) {
    resumeFileInput.addEventListener('change', function(event) {
      console.log('File input changed');
      const file = event.target.files[0];
      if (!file) return;
      
      console.log('File selected:', file.name);
      
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
      console.log('Fetch job button clicked');
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
          chrome.storage.local.get(['resumeData'], function(result) {
            if (result.resumeData && analysisSection) {
              analysisSection.style.display = 'block';
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
        chrome.storage.local.get(['resumeData'], function(result) {
          if (result.resumeData && analysisSection) {
            analysisSection.style.display = 'block';
          }
        });
      });
    });
  }

  // Add event listener for analyze button
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function() {
      console.log('Analyze button clicked');
      
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
    console.log('Processing job description of length:', jobDescription.length);
    
    // Parse job description
    fetch('http://localhost:5000/api/parse-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({jobDescription: jobDescription})
    })
    .then(response => response.json())
    .then(jobData => {
      console.log('Job data parsed successfully');
      
      // Analyze match
      fetch('http://localhost:5000/api/analyze-match', {
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
        console.log('Analysis completed successfully');
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
  }
  
  // Display analysis results with null checks
  function displayAnalysisResults(analysis) {
    console.log('Displaying analysis results:', analysis);
    
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