// Content script for Job Search Assistant

// Keywords that indicate a job posting
const JOB_KEYWORDS = [
  'job description',
  'responsibilities',
  'requirements',
  'qualifications',
  'experience',
  'skills',
  'apply now',
  'job summary',
  'position summary',
  'we are looking for',
  'about the role',
  'job title',
  'full time',
  'part time',
  'remote',
  'hybrid',
  'salary',
  'benefits',
  'location',
  'education',
  'degree',
  'certification'
];

// Job posting sites
const JOB_SITES = [
  'linkedin.com/jobs',
  'indeed.com',
  'glassdoor.com',
  'monster.com',
  'ziprecruiter.com',
  'dice.com',
  'careerbuilder.com',
  'simplyhired.com',
  'lever.co',
  'greenhouse.io',
  'workday.com',
  'jobs.',
  'career',
  'careers',
  'job-'
];

// Check if current page is a job posting
function checkIfJobPosting() {
  console.log('Checking if page is a job posting...');
  
  const pageText = document.body.innerText.toLowerCase();
  const url = window.location.href.toLowerCase();
  
  // Check if URL contains job site domains
  const isJobSite = JOB_SITES.some(site => url.includes(site));
  console.log('Is job site:', isJobSite);
  
  // Check if page contains job keywords
  const matchedKeywords = JOB_KEYWORDS.filter(keyword => 
    pageText.includes(keyword.toLowerCase())
  );
  const keywordCount = matchedKeywords.length;
  console.log('Matched keywords:', matchedKeywords);
  console.log('Keyword count:', keywordCount);
  
  // Consider it a job posting if it's on a job site and has at least 2 keywords
  // or if it's not on a known job site but has at least 4 keywords
  const isJobPosting = (isJobSite && keywordCount >= 2) || keywordCount >= 4;
  console.log('Is job posting:', isJobPosting);
  
  return isJobPosting;
}

// Extract job description from the page
function extractJobDescription() {
  console.log('Extracting job description...');
  
  // Get all text from the main content area
  // This is a simple implementation - real-world would need more sophisticated parsing
  let mainContent = '';
  
  // Try to find job description in common containers
  const possibleContainers = [
    document.querySelector('div[class*="description"]'),
    document.querySelector('div[class*="job-description"]'),
    document.querySelector('div[class*="details"]'),
    document.querySelector('section[class*="description"]'),
    document.querySelector('article'),
    document.querySelector('main'),
    document.querySelector('.job-description'),
    document.querySelector('#job-description'),
    document.querySelector('[data-testid="job-description"]')
  ];
  
  // Use the first valid container found
  for (const container of possibleContainers) {
    if (container) {
      mainContent = container.innerText;
      console.log('Found container:', container);
      break;
    }
  }
  
  // If no specific container found, use the body text
  if (!mainContent) {
    console.log('No specific container found, using body text');
    mainContent = document.body.innerText;
  }
  
  return mainContent;
}

// Extract job title from the page
function extractJobTitle() {
  console.log('Extracting job title...');
  
  // Try to find job title in common elements
  const possibleTitleElements = [
    document.querySelector('h1'),
    document.querySelector('h2'),
    document.querySelector('title'),
    document.querySelector('div[class*="title"]'),
    document.querySelector('span[class*="title"]'),
    document.querySelector('.job-title'),
    document.querySelector('#job-title')
  ];
  
  // Use the first valid title found
  for (const element of possibleTitleElements) {
    if (element && element.innerText.trim()) {
      console.log('Found title element:', element);
      return element.innerText.trim();
    }
  }
  
  return 'Unknown Job Title';
}

// Check if the page is a job posting and notify background script
function detectJobPosting() {
  console.log('Running job posting detection...');
  
  if (checkIfJobPosting()) {
    const jobData = {
      title: extractJobTitle(),
      description: extractJobDescription(),
      url: window.location.href
    };
    
    console.log('Job detected:', jobData);
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'jobDetected',
      jobData: jobData
    });
    
    return true;
  }
  
  return false;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  try {
    if (message.action === 'checkJobPosting') {
      const isJobPosting = checkIfJobPosting();
      console.log('Responding to checkJobPosting:', isJobPosting);
      sendResponse({ isJobPosting: isJobPosting });
    } else if (message.action === 'getJobDescription') {
      const jobDescription = extractJobDescription();
      console.log('Responding to getJobDescription with length:', jobDescription.length);
      sendResponse({ jobDescription: jobDescription });
    }
  } catch (error) {
    console.error('Error in content script:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Required for async sendResponse
});

// Run detection when page loads
console.log('Content script loaded');
window.addEventListener('load', () => {
  // Wait a bit for dynamic content to load
  console.log('Page loaded, waiting for content...');
  setTimeout(detectJobPosting, 1000);
});

// Also run detection now in case the page is already loaded
detectJobPosting(); 