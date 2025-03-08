// Wait until DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup DOM fully loaded');
  
  // Get DOM elements
  const uploadResumeBtn = document.getElementById('upload-resume-btn');
  const resumeFileInput = document.getElementById('resume-file');
  const resumeMessage = document.getElementById('resume-message');
  const jobMessage = document.getElementById('job-message');
  const analysisSection = document.getElementById('analysis-section');
  const analyzeBtn = document.getElementById('analyze-btn');
  const analysisResults = document.getElementById('analysis-results');
  const matchPercentage = document.getElementById('match-percentage');
  const requiredSkillsScore = document.getElementById('required-skills-score');
  const preferredSkillsScore = document.getElementById('preferred-skills-score');
  const experienceScore = document.getElementById('experience-score');
  const educationScore = document.getElementById('education-score');
  const requiredSkills = document.getElementById('required-skills');
  const preferredSkills = document.getElementById('preferred-skills');
  const bonusSkills = document.getElementById('bonus-skills');
  const keyFindingsList = document.getElementById('key-findings-list');
  const suggestionsList = document.getElementById('suggestions-list');
  const manualInputSection = document.getElementById('manual-input-section');
  const jobUrlInput = document.getElementById('job-url-input');
  const fetchJobBtn = document.getElementById('fetch-job-btn');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyBtn = document.getElementById('save-api-key-btn');
  
  // Log which elements were found
  console.log('DOM Elements loaded');
  
  // Load API key from storage
  chrome.storage.local.get(['apiKey'], function(result) {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
  });
  
  // Check if resume is already uploaded
  chrome.storage.local.get(['resumeData'], function(result) {
    if (result.resumeData && resumeMessage) {
      resumeMessage.textContent = 'Resume uploaded successfully!';
    }
  });
  
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

  // Modified resume file input handler
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
      
      resumeMessage.textContent = 'Processing resume...';
      
      // Simplified approach - store just the file name for testing
      const resumeData = {
        text: "This is a simplified resume text for " + file.name,
        skills: {
          "programming": ["javascript", "python"],
          "web": ["html", "css"],
          "tools": ["git"]
        },
        originalFileName: file.name,
        fileType: file.type
      };
      
      // Store parsed resume data
      chrome.storage.local.set({resumeData: resumeData}, function() {
        resumeMessage.textContent = 'Resume uploaded successfully!';
        
        // Check if job posting is detected to enable analysis
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'checkJobPosting'}, function(response) {
              if (response && response.isJobPosting && analysisSection) {
                analysisSection.style.display = 'block';
              }
            });
          }
        });
      });
    });
  }
  
  // Save API key button click handler
  if (saveApiKeyBtn && apiKeyInput) {
    saveApiKeyBtn.addEventListener('click', function() {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        alert('Please enter a valid DeepSeek API key.');
        return;
      }
      
      chrome.storage.local.set({apiKey: apiKey}, function() {
        alert('API key saved successfully!');
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
      
      // Check for API key
      chrome.storage.local.get(['apiKey'], function(result) {
        if (!result.apiKey) {
          alert('Please enter your DeepSeek API key first.');
          return;
        }
        
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
                      analyzeResume(result.resumeData, result.currentJobData.description);
                    } else {
                      alert('Could not extract job description. Please enter it manually.');
                      if (manualInputSection) manualInputSection.style.display = 'block';
                    }
                  });
                  return;
                }
                
                analyzeResume(result.resumeData, response.jobDescription);
              });
            } else {
              alert('Error accessing current tab.');
            }
          });
        });
      });
    });
  }
  
  // Function to analyze resume against job description
  function analyzeResume(resumeData, jobDescription) {
    // Show loading state
    if (analyzeBtn) {
      analyzeBtn.textContent = 'Analyzing...';
      analyzeBtn.disabled = true;
    }
    
    chrome.storage.local.get(['apiKey'], function(result) {
      chrome.runtime.sendMessage({
        action: 'analyzeMatch',
        resumeText: resumeData.text || JSON.stringify(resumeData),
        jobDescription: jobDescription,
        apiKey: result.apiKey
      }, function(response) {
        // Reset button state
        if (analyzeBtn) {
          analyzeBtn.textContent = 'Analyze Match';
          analyzeBtn.disabled = false;
        }
        
        if (response.error) {
          alert('Error analyzing match: ' + response.error);
          return;
        }
        
        displayAnalysisResults(response);
      });
    });
  }
  
  // Function to display analysis results
  function displayAnalysisResults(analysis) {
    console.log('Displaying analysis results:', analysis);
    
    // Show results section
    if (analysisResults) {
      analysisResults.style.display = 'block';
    }
    
    // Update match percentage
    if (matchPercentage) {
      matchPercentage.textContent = `${analysis.matchPercentage || analysis.match_percentage}%`;
    }
    
    // Update score circle color based on match percentage
    const scoreCircle = document.querySelector('.score-circle');
    if (scoreCircle) {
      const score = analysis.matchPercentage || analysis.match_percentage || 0;
      if (score >= 80) {
        scoreCircle.style.borderColor = '#34a853'; // Green for good match
      } else if (score >= 60) {
        scoreCircle.style.borderColor = '#fbbc05'; // Yellow for moderate match
      } else {
        scoreCircle.style.borderColor = '#ea4335'; // Red for poor match
      }
    }
    
    // Update score breakdown if available
    if (analysis.scoreBreakdown) {
      if (requiredSkillsScore) requiredSkillsScore.textContent = `${analysis.scoreBreakdown.requiredSkills}%`;
      if (preferredSkillsScore) preferredSkillsScore.textContent = `${analysis.scoreBreakdown.preferredSkills}%`;
      if (experienceScore) experienceScore.textContent = `${analysis.scoreBreakdown.experience}%`;
      if (educationScore) educationScore.textContent = `${analysis.scoreBreakdown.education}%`;
    }
    
    // Update keyword analysis if available
    if (analysis.keywordAnalysis) {
      if (requiredSkills) {
        requiredSkills.innerHTML = analysis.keywordAnalysis.requiredSkills
          .map(k => createKeywordChip(k, 'present'))
          .join('');
      }
      
      if (preferredSkills) {
        preferredSkills.innerHTML = analysis.keywordAnalysis.preferredSkills
          .map(k => createKeywordChip(k, k.present ? 'present' : 'missing'))
          .join('');
      }
      
      if (bonusSkills) {
        bonusSkills.innerHTML = analysis.keywordAnalysis.bonusSkills
          .map(k => createKeywordChip(k, 'bonus'))
          .join('');
      }
    }
    
    // Clear and update key findings
    if (keyFindingsList) {
      keyFindingsList.innerHTML = '';
      const findings = analysis.keyFindings || analysis.key_findings || [];
      findings.forEach(finding => {
        const li = document.createElement('li');
        li.textContent = finding;
        keyFindingsList.appendChild(li);
      });
    }
    
    // Clear and update suggestions
    if (suggestionsList) {
      suggestionsList.innerHTML = '';
      const suggestions = analysis.suggestions || [];
      suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.textContent = suggestion;
        suggestionsList.appendChild(li);
      });
    }
  }
  
  // Helper function to create keyword chips
  function createKeywordChip(keyword, status) {
    if (typeof keyword === 'string') {
      return `
        <div class="keyword-chip ${status}">
          ${keyword}
        </div>
      `;
    }
    
    return `
      <div class="keyword-chip ${status}">
        ${keyword.text}
        ${status === 'missing' ? `
          <span class="importance">${keyword.importance || 'Important'}</span>
          <span class="suggestion">${keyword.suggestion || 'Consider adding'}</span>
        ` : ''}
        ${keyword.score ? `<span class="keyword-score">${keyword.score}%</span>` : ''}
      </div>
    `;
  }
});
