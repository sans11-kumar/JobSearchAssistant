// Background script for Job Search Assistant



// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  
  if (message.action === 'jobDetected') {

    
    // Set badge to indicate job posting detected
    chrome.action.setBadgeText({ text: 'JOB' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    // Store job data temporarily
    chrome.storage.local.set({ currentJobData: message.jobData }, function() {
    });
  } else if (message.action === 'getCurrentJob') {
    // Return current job data if requested
    chrome.storage.local.get(['currentJobData'], function(result) {
      sendResponse(result.currentJobData);
    });
    return true; // Required for async sendResponse
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
  
});
