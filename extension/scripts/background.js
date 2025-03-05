// Background script for Job Search Assistant

console.log('Background script loaded');

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.action === 'jobDetected') {
    console.log('Job detected:', message.jobData);
    
    // Set badge to indicate job posting detected
    chrome.action.setBadgeText({ text: 'JOB' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    // Store job data temporarily
    chrome.storage.local.set({ currentJobData: message.jobData }, function() {
      console.log('Job data stored in local storage');
    });
  } else if (message.action === 'getCurrentJob') {
    // Return current job data if requested
    chrome.storage.local.get(['currentJobData'], function(result) {
      console.log('Returning job data:', result.currentJobData);
      sendResponse(result.currentJobData);
    });
    return true; // Required for async sendResponse
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
  
  console.log('Job Search Assistant extension installed');
}); 