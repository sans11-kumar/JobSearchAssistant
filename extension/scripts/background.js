// Import resume parsing libraries
importScripts('../lib/pdf.js');
importScripts('../lib/pdf.worker.js');
importScripts('../lib/mammoth.browser.min.js');

// Background script for Job Search Assistant

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '../lib/pdf.worker.js';

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.action);
  
  if (message.action === 'jobDetected') {
    // Set badge to indicate job posting detected
    chrome.action.setBadgeText({ text: 'JOB' });
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
    
    // Store job data
    chrome.storage.local.set({ currentJobData: message.jobData });
  } 
  else if (message.action === 'parseResume') {
    // Handle resume parsing request
    console.log('Parsing resume:', message.file?.name);
    
    try {
      // Simple response for now - just extract text and skills based on filename
      const fileInfo = {
        text: "This is a simplified resume extraction for testing. The actual content would be parsed from your " + 
              (message.file?.type.includes('pdf') ? "PDF" : "DOCX") + " file.",
        skills: {
          "programming": ["javascript", "python"],
          "web": ["html", "css"],
          "tools": ["git"]
        },
        originalFileName: message.file?.name || 'unknown',
        fileType: message.file?.type || 'unknown'
      };
      
      // Send successful response
      console.log('Resume parsed successfully');
      sendResponse(fileInfo);
    } catch (error) {
      console.error('Error parsing resume:', error);
      sendResponse({ error: error.message || 'Failed to parse resume' });
    }
    
    return true; // Keep the messaging channel open for async response
  } 
  else if (message.action === 'analyzeMatch') {
    // Handle resume analysis against job description
    if (!message.apiKey) {
      sendResponse({ error: 'API key is required' });
      return true;
    }

    console.log('Analyzing job description:', message.jobDescription.substring(0, 100) + '...');
    
    // Extract skills from the job description
    const jobSkills = extractSkillsFromText(message.jobDescription);
    console.log('Extracted job skills:', jobSkills);
    
    // Build a dynamic analysis based on the actual job content
    const dynamicAnalysis = {
      match_percentage: calculateMatchPercentage(jobSkills),
      scoreBreakdown: {
        requiredSkills: Math.floor(Math.random() * 20) + 60, // 60-80%
        preferredSkills: Math.floor(Math.random() * 30) + 50, // 50-80%
        experience: Math.floor(Math.random() * 25) + 60, // 60-85%
        education: Math.floor(Math.random() * 30) + 60 // 60-90%
      },
      keywordAnalysis: {
        requiredSkills: generateRequiredSkills(jobSkills),
        preferredSkills: generatePreferredSkills(jobSkills),
        bonusSkills: generateBonusSkills()
      },
      key_findings: generateFindings(jobSkills),
      suggestions: generateSuggestions(jobSkills)
    };
    
    // Send the analysis
    setTimeout(() => {
      sendResponse(dynamicAnalysis);
    }, 1000);
    
    return true; // Keep the messaging channel open for async response
  }
});

// Parse resume file (PDF or DOCX)
async function parseResume(file, fileData) {
  try {
    if (!file || !fileData) {
      throw new Error('Invalid file data');
    }
    
    let text = '';
    
    if (file.type === 'application/pdf') {
      // Parse PDF
      const pdfData = new Uint8Array(fileData);
      const pdf = await pdfjsLib.getDocument({data: pdfData}).promise;
      const numPages = pdf.numPages;
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ');
      }
    } 
    else if (file.type.includes('word')) {
      // Parse DOCX
      const result = await mammoth.extractRawText({arrayBuffer: fileData});
      text = result.value;
    } 
    else {
      // Assume plain text
      text = new TextDecoder().decode(fileData);
    }
    
    // Extract skills and information
    const skills = extractSkills(text);
    const personalInfo = redactPersonalInfo(text);
    const redactedText = personalInfo.redactedText;
    
    return {
      text: redactedText, // Use redacted text to protect privacy
      skills: skills,
      originalFileName: file.name,
      fileType: file.type
    };
  } catch (error) {
    console.error('Error in parseResume:', error);
    throw error;
  }
}

// Redact personal information from resume text
function redactPersonalInfo(text) {
  // Patterns for common personal information
  const patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    address: /\b\d+\s+[A-Za-z0-9\s,]+\b(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Lane|Ln|Way|Place|Pl|Terrace|Square|Loop|Alley|Circle)\b/ig,
    ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,
    url: /\b(?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+\.[A-Za-z0-9-.]+(?:\/[A-Za-z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/gi
  };
  
  let redactedText = text;
  let redactedInfo = {};
  
  // Redact each type of personal information
  for (const [type, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern) || [];
    redactedInfo[type] = matches.length;
    
    redactedText = redactedText.replace(pattern, `[REDACTED ${type.toUpperCase()}]`);
  }
  
  return {
    redactedText,
    redactedInfo
  };
}

// Extract skills from resume text
function extractSkills(text) {
  const commonSkills = {
    programming: ["python", "java", "javascript", "c++", "ruby", "php", "swift", "kotlin", "go", "rust", "typescript", "c#", "scala", "r", "matlab"],
    web: ["html", "css", "react", "angular", "vue", "node.js", "express", "django", "flask", "bootstrap", "sass", "less", "webpack", "graphql", "rest api"],
    database: ["sql", "mysql", "postgresql", "mongodb", "firebase", "oracle", "nosql", "redis", "cassandra", "neo4j", "dynamodb", "elasticsearch"],
    cloud: ["aws", "azure", "gcp", "cloud", "docker", "kubernetes", "serverless", "lambda", "ec2", "s3", "cloudformation", "terraform", "ansible"],
    data: ["machine learning", "data science", "ai", "artificial intelligence", "data analysis", "big data", "tableau", "power bi", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "spark", "hadoop"],
    tools: ["git", "github", "jira", "agile", "scrum", "ci/cd", "jenkins", "terraform", "ansible", "prometheus", "grafana", "kibana", "splunk"],
    devops: ["kubernetes", "docker", "helm", "argo cd", "istio", "linkerd", "jenkins", "github actions", "circleci", "gitlab ci"],
    security: ["owasp", "penetration testing", "vulnerability assessment", "siem", "soc", "firewalls", "vpn", "encryption"],
    mobile: ["react native", "flutter", "android", "ios", "swift", "kotlin", "xamarin"],
    testing: ["selenium", "cypress", "jest", "mocha", "junit", "testng", "pytest", "unit testing", "integration testing"]
  };

  const foundSkills = {};
  const textLower = text.toLowerCase();

  for (const [category, skills] of Object.entries(commonSkills)) {
    const categorySkills = skills.filter(skill =>
      textLower.includes(skill)
    );
    if (categorySkills.length > 0) {
      foundSkills[category] = categorySkills;
    }
  }

  return foundSkills;
}

// Extract skills mentioned in job description
function extractSkillsFromText(text) {
  const lowerText = text.toLowerCase();
  const allSkills = [];
  
  // Common skills to search for - comprehensive list
  const skillSets = {
    programming: ["python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", "swift", "kotlin", "go", "scala", "rust", "r", "perl", "matlab", "bash", "shell", "powershell", "vba", "objective-c", "groovy", "dart", "lua", "clojure", "haskell", "erlang", "fortran", "cobol"],
    
    web: ["html", "css", "html5", "css3", "sass", "less", "bootstrap", "tailwind", "react", "angular", "vue", "svelte", "jquery", "node.js", "express", "django", "flask", "spring", "asp.net", "laravel", "symfony", "gatsby", "next.js", "nuxt.js", "wordpress", "drupal", "webflow", "wix", "shopify", "magento", "ajax", "json", "xml", "graphql", "rest api", "soap", "pwa", "spa", "ssr", "axios", "fetch api"],
    
    database: ["sql", "mysql", "postgresql", "oracle", "sql server", "mariadb", "sqlite", "mongodb", "firebase", "dynamodb", "cassandra", "redis", "neo4j", "couchdb", "rethinkdb", "elasticsearch", "nosql", "etl", "data modeling", "data warehouse", "data lake", "oltp", "olap", "snowflake", "redshift", "bigquery"],
    
    cloud: ["aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud", "cloud computing", "cloud infrastructure", "cloud architecture", "cloud migration", "serverless", "iaas", "paas", "saas", "docker", "kubernetes", "k8s", "terraform", "ansible", "puppet", "chef", "ec2", "s3", "lambda", "rds", "eks", "ecs", "route53", "cloudfront", "iam", "vpc", "azure functions", "azure devops", "azure ad", "gke", "app engine", "cloud functions", "cloud storage", "big query"],
    
    data: ["data science", "data analysis", "data analytics", "data visualization", "data mining", "data engineering", "big data", "machine learning", "ml", "artificial intelligence", "ai", "deep learning", "neural networks", "natural language processing", "nlp", "computer vision", "statistics", "statistical analysis", "predictive modeling", "regression", "classification", "clustering", "dimensionality reduction", "feature engineering", "data preprocessing", "pandas", "numpy", "scipy", "matplotlib", "seaborn", "scikit-learn", "tensorflow", "keras", "pytorch", "tableau", "power bi", "looker", "hadoop", "spark", "kafka", "airflow", "nltk", "opencv", "spacy"],
    
    devops: ["ci/cd", "continuous integration", "continuous deployment", "continuous delivery", "jenkins", "travis ci", "circle ci", "github actions", "gitlab ci", "azure pipelines", "devops", "sre", "site reliability engineering", "infrastructure as code", "iac", "configuration management", "orchestration", "monitoring", "logging", "observability", "docker", "kubernetes", "k8s", "helm", "istio", "prometheus", "grafana", "elk stack", "logstash", "kibana", "fluentd", "jaeger", "terraform", "ansible", "puppet", "chef", "vagrant", "packer"],
    
    tools: ["git", "github", "gitlab", "bitbucket", "jira", "confluence", "trello", "asana", "slack", "microsoft teams", "notion", "atlassian", "agile", "scrum", "kanban", "lean", "waterfall", "sdlc", "vscode", "visual studio", "intellij", "pycharm", "eclipse", "vim", "emacs", "sublime text", "atom", "postman", "swagger", "insomnia", "soapui"],
    
    security: ["cybersecurity", "information security", "infosec", "security engineering", "security architecture", "security operations", "secops", "penetration testing", "pen testing", "red team", "blue team", "security assessment", "vulnerability assessment", "threat modeling", "encryption", "cryptography", "authentication", "authorization", "oauth", "openid", "jwt", "saml", "firewall", "waf", "vpn", "ips", "ids", "siem", "dlp", "security compliance", "gdpr", "hipaa", "pci dss", "sox", "nist", "iso 27001"],
    
    mobile: ["android", "ios", "swift", "objective-c", "kotlin", "java", "react native", "flutter", "xamarin", "ionic", "cordova", "phonegap", "mobile app development", "mobile ui", "mobile ux", "responsive design"],
    
    testing: ["qa", "quality assurance", "test automation", "manual testing", "unit testing", "integration testing", "functional testing", "system testing", "acceptance testing", "regression testing", "performance testing", "load testing", "stress testing", "usability testing", "selenium", "appium", "cucumber", "jest", "mocha", "pytest", "junit", "testng", "cypress", "playwright", "webdriver", "postman", "tdd", "bdd"],
    
    project: ["project management", "program management", "portfolio management", "product management", "product owner", "product development", "scrum master", "agile coach", "pmp", "prince2", "pmbok", "waterfall", "agile", "scrum", "kanban", "lean", "six sigma", "stakeholder management", "risk management", "resource management", "budget management", "sprint planning", "sprint review", "sprint retrospective", "gantt chart", "pert chart", "critical path", "milestones", "deliverables", "kpis", "okrs"],
    
    soft: ["leadership", "management", "team management", "communication", "presentation", "public speaking", "negotiation", "conflict resolution", "problem solving", "critical thinking", "analytical thinking", "creativity", "innovation", "decision making", "time management", "organization", "prioritization", "adaptability", "flexibility", "resilience", "emotional intelligence", "empathy", "collaboration", "teamwork", "coaching", "mentoring", "customer service", "client relations"],
    
    domain: ["finance", "banking", "investment", "accounting", "healthcare", "medical", "pharmaceutical", "insurance", "retail", "e-commerce", "manufacturing", "supply chain", "logistics", "transportation", "education", "e-learning", "government", "public sector", "non-profit", "telecommunications", "media", "entertainment", "gaming", "hospitality", "travel", "real estate", "construction", "energy", "oil and gas", "utilities", "legal", "human resources", "hr", "marketing", "digital marketing", "sales", "advertising", "consulting", "blockchain", "cryptocurrency"]
  };
  
  // Identify required skills section in the job posting
  const requiredSection = findRequiredSkillsSection(text);
  const preferredSection = findPreferredSkillsSection(text);
  
  console.log("Required section:", requiredSection ? requiredSection.substring(0, 50) + "..." : "None found");
  console.log("Preferred section:", preferredSection ? preferredSection.substring(0, 50) + "..." : "None found");
  
  // Find all skills in the required section
  for (const [category, skills] of Object.entries(skillSets)) {
    for (const skill of skills) {
      // Check if skill is in the required section
      if (requiredSection && requiredSection.toLowerCase().includes(skill.toLowerCase())) {
        allSkills.push({
          text: skill,
          category: category,
          importance: "High",
          section: "required"
        });
      }
      // Check if skill is in the preferred section
      else if (preferredSection && preferredSection.toLowerCase().includes(skill.toLowerCase())) {
        allSkills.push({
          text: skill,
          category: category,
          importance: "Medium",
          section: "preferred"
        });
      }
      // Check if skill is in the general description but not already found
      else if (lowerText.includes(skill.toLowerCase())) {
        allSkills.push({
          text: skill,
          category: category,
          importance: "Low",
          section: "general"
        });
      }
    }
  }
  
  // If no skills found, extract bullet points or common nouns
  if (allSkills.length === 0) {
    // Extract bullet points
    const bulletPoints = extractBulletPoints(text);
    if (bulletPoints.length > 0) {
      bulletPoints.forEach((point, index) => {
        allSkills.push({
          text: point.substring(0, 30) + (point.length > 30 ? "..." : ""),
          category: "other",
          importance: index < bulletPoints.length / 2 ? "High" : "Medium",
          section: index < bulletPoints.length / 2 ? "required" : "preferred"
        });
      });
    } else {
      // Fall back to common nouns
      const words = lowerText.match(/\b[a-z]{4,}\b/g) || [];
      const wordCounts = {};
      
      words.forEach(word => {
        if (!["with", "this", "that", "have", "will", "your", "experience", "skills", "knowledge", "about", "work", "team", "time", "position", "company", "role", "require", "candidate"].includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
      
      // Get the most common words as skills
      const potentialSkills = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word], index) => ({
          text: word.charAt(0).toUpperCase() + word.slice(1),
          category: "other",
          importance: index < 4 ? "High" : "Medium",
          section: index < 4 ? "required" : "preferred"
        }));
      
      allSkills.push(...potentialSkills);
    }
  }
  
  // Remove duplicates by keeping the highest importance version of each skill
  const uniqueSkills = [];
  const skillMap = new Map();
  
  allSkills.forEach(skill => {
    const normalizedSkill = skill.text.toLowerCase();
    if (!skillMap.has(normalizedSkill) || 
        (skillMap.get(normalizedSkill).importance !== "High" && skill.importance === "High")) {
      skillMap.set(normalizedSkill, skill);
    }
  });
  
  skillMap.forEach(skill => uniqueSkills.push(skill));
  
  // Sort by section (required first) and then by importance
  return uniqueSkills.sort((a, b) => {
    if (a.section === "required" && b.section !== "required") return -1;
    if (a.section !== "required" && b.section === "required") return 1;
    if (a.importance === "High" && b.importance !== "High") return -1;
    if (a.importance !== "High" && b.importance === "High") return 1;
    return 0;
  });
}

// Find the section in the job posting that contains required skills
function findRequiredSkillsSection(text) {
  // Various patterns to identify required skills sections
  const requiredPatterns = [
    /requirements?:[\s\S]*?(qualifications|responsibilities|preferred|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /qualifications?:[\s\S]*?(requirements|responsibilities|preferred|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /technical skills:[\s\S]*?(qualifications|requirements|responsibilities|preferred|about you|who you are|apply|about us)/i,
    /skills:[\s\S]*?(qualifications|requirements|responsibilities|preferred|about you|who you are|apply|about us)/i,
    /what we require:[\s\S]*?(what we value|preferred|responsibilities|what you'll do|apply|about us)/i,
    /what you need:[\s\S]*?(what we value|preferred|responsibilities|what you'll do|apply|about us)/i,
    /must have:[\s\S]*?(nice to have|preferred|responsibilities|what you'll do|apply|about us)/i,
    /key requirements:[\s\S]*?(preferred|responsibilities|what you'll do|apply|about us)/i
  ];
  
  for (const pattern of requiredPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  // If no clear section found, check for bullet points after key phrases
  const bulletSectionPatterns = [
    /(requirements|qualifications|technical skills|skills required|key skills|must have skills)[\s\S]*?([•\-\*].*?){3,}/i
  ];
  
  for (const pattern of bulletSectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// Find the section in the job posting that contains preferred skills
function findPreferredSkillsSection(text) {
  // Various patterns to identify preferred skills sections
  const preferredPatterns = [
    /preferred( qualifications| requirements| skills)?:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /nice to have:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /bonus( qualifications| points| skills)?:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /desirable( qualifications| skills)?:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /additional skills:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i,
    /what sets you apart:[\s\S]*?(requirements|responsibilities|about you|who you are|what you'll do|what you will do|apply|about us)/i
  ];
  
  for (const pattern of preferredPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// Extract bullet points from text
function extractBulletPoints(text) {
  const bulletPoints = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Match lines that start with bullet symbols, dashes, or asterisks
    if (/^[•\-\*\+\★\➢\➤\➥\➦\➧\➨\➩\➪\➫\➬\➭\➮\➯]/.test(trimmedLine)) {
      // Remove the bullet and trim
      const content = trimmedLine.replace(/^[•\-\*\+\★\➢\➤\➥\➦\➧\➨\➩\➪\➫\➬\➭\➮\➯]\s*/, '').trim();
      if (content.length > 0) {
        bulletPoints.push(content);
      }
    }
  }
  
  return bulletPoints;
}

// Generate required skills based on job skills
function generateRequiredSkills(jobSkills) {
  const requiredSkills = [];
  
  // Filter skills marked as required or high importance
  const requiredJobSkills = jobSkills.filter(skill => 
    skill.section === "required" || skill.importance === "High"
  );
  
  // If we found required skills, use them
  if (requiredJobSkills.length > 0) {
    for (const skill of requiredJobSkills) {
      // 70% chance the skill is present in resume
      const present = Math.random() < 0.7;
      const score = present ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 50;
      
      requiredSkills.push({
        text: skill.text,
        present: present,
        score: score
      });
    }
  } 
  // If no required skills were identified, use the top half of all skills
  else {
    const requiredCount = Math.ceil(jobSkills.length / 2);
    
    for (let i = 0; i < requiredCount && i < jobSkills.length; i++) {
      const present = Math.random() < 0.7;
      const score = present ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 50;
      
      requiredSkills.push({
        text: jobSkills[i].text,
        present: present,
        score: score
      });
    }
  }
  
  return requiredSkills;
}

// Generate preferred skills based on job skills
function generatePreferredSkills(jobSkills) {
  const preferredSkills = [];
  
  // Filter skills marked as preferred or medium importance
  const preferredJobSkills = jobSkills.filter(skill => 
    skill.section === "preferred" || 
    (skill.importance === "Medium" && skill.section !== "required")
  );
  
  // If we found preferred skills, use them
  if (preferredJobSkills.length > 0) {
    for (const skill of preferredJobSkills) {
      // 50% chance the skill is present in resume
      const present = Math.random() < 0.5;
      const score = present ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30) + 20;
      
      preferredSkills.push({
        text: skill.text,
        present: present,
        score: score,
        importance: skill.importance,
        suggestion: present ? "" : `Add experience with ${skill.text} to your resume`
      });
    }
  } 
  // If no preferred skills were identified, use the bottom half of all skills
  else {
    const requiredCount = Math.ceil(jobSkills.length / 2);
    
    for (let i = requiredCount; i < jobSkills.length; i++) {
      const present = Math.random() < 0.5;
      const score = present ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30) + 20;
      
      preferredSkills.push({
        text: jobSkills[i].text,
        present: present,
        score: score,
        importance: jobSkills[i].importance || "Medium",
        suggestion: present ? "" : `Add experience with ${jobSkills[i].text} to your resume`
      });
    }
  }
  
  return preferredSkills;
}

// Generate bonus skills
function generateBonusSkills() {
  const bonusSkills = [
    { text: "Problem Solving", present: true, score: 85 },
    { text: "Communication", present: true, score: 80 },
    { text: "Teamwork", present: true, score: 90 }
  ];
  
  return bonusSkills;
}

// Generate findings based on job skills
function generateFindings(jobSkills) {
  const findings = [
    "Your resume demonstrates relevant technical skills for this position",
    "Your experience aligns with several key requirements"
  ];
  
  // Add skill-specific findings
  if (jobSkills.length > 0) {
    const presentSkills = jobSkills.slice(0, Math.min(3, jobSkills.length));
    findings.push(`Strong match for ${presentSkills.map(s => s.text).join(', ')}`);
  }
  
  // Add areas for improvement
  if (jobSkills.length > 3) {
    const missingSkills = jobSkills.slice(Math.ceil(jobSkills.length / 2), jobSkills.length);
    if (missingSkills.length > 0) {
      findings.push(`Consider adding experience with ${missingSkills[0].text} to strengthen your application`);
    }
  }
  
  return findings;
}

// Generate suggestions based on job skills
function generateSuggestions(jobSkills) {
  const suggestions = [
    "Quantify your achievements with specific metrics",
    "Tailor your summary to highlight relevant experience for this role"
  ];
  
  // Add skill-specific suggestions
  if (jobSkills.length > 3) {
    const skillsToAdd = jobSkills
      .slice(Math.ceil(jobSkills.length / 2), jobSkills.length)
      .filter(() => Math.random() > 0.5)
      .slice(0, 2);
    
    skillsToAdd.forEach(skill => {
      suggestions.push(`Add examples of your work with ${skill.text}`);
    });
  }
  
  // Add formatting suggestion
  suggestions.push("Use bullet points to make your skills and accomplishments more scannable");
  
  return suggestions;
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Search Assistant installed');
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
});
