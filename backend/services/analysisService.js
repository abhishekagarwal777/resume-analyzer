const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../middleware/errorHandler');
require('dotenv').config();

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original file name for logging
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromPDF = async (pdfBuffer, fileName) => {
  try {
    console.log(`📄 Extracting text from PDF: ${fileName}`);
    
    const data = await pdf(pdfBuffer, {
      // PDF parsing options
      max: 0, // Maximum number of pages to parse (0 = all pages)
      version: 'v1.10.88', // PDF.js version
      normalizeWhitespace: true, // Normalize whitespace
      disableCombineTextItems: false // Combine text items
    });

    const extractedText = data.text;

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      throw new AppError('PDF appears to be empty or contains only images. Please upload a PDF with text content.', 400);
    }

    if (extractedText.trim().length < 50) {
      throw new AppError('PDF contains very little text content. Please ensure the PDF is a proper resume document.', 400);
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters from PDF`);
    console.log(`📊 PDF Info: ${data.numpages} pages, ${data.info?.Title || 'No title'}`);

    return extractedText;

  } catch (error) {
    console.error('❌ PDF extraction failed:', error.message);
    
    if (error instanceof AppError) {
      throw error;
    }

    // Handle specific PDF parsing errors
    if (error.message.includes('Invalid PDF')) {
      throw new AppError('Invalid PDF file format. Please upload a valid PDF document.', 400);
    }

    if (error.message.includes('password') || error.message.includes('encrypted')) {
      throw new AppError('PDF is password protected or encrypted. Please upload an unprotected PDF.', 400);
    }

    if (error.message.includes('damaged') || error.message.includes('corrupted')) {
      throw new AppError('PDF file appears to be corrupted. Please try uploading a different file.', 400);
    }

    throw new AppError('PDF parsing failed. Please ensure the file is a valid PDF document.', 400);
  }
};

/**
 * Create detailed prompt for Gemini AI
 * @param {string} resumeText - Extracted resume text
 * @returns {string} - Formatted prompt for AI analysis
 */
const createAnalysisPrompt = (resumeText) => {
  return `
You are an expert technical recruiter and career coach with 10+ years of experience. Analyze the following resume text and extract information into a valid JSON object.

IMPORTANT INSTRUCTIONS:
1. Return ONLY a valid JSON object - no markdown, no explanations, no additional text
2. If information is not available, use null for strings/objects and empty arrays [] for arrays
3. Be thorough but concise in your analysis
4. For rating, consider: formatting, content quality, skills relevance, experience clarity, achievements quantification
5. Provide actionable improvement suggestions

Resume Text:
"""
${resumeText}
"""

Return a JSON object with this EXACT structure:

{
  "name": "Full name from resume or null",
  "email": "Email address or null", 
  "phone": "Phone number or null",
  "linkedin_url": "LinkedIn profile URL or null",
  "portfolio_url": "Portfolio/website URL or null",
  "summary": "Professional summary/objective or null",
  "work_experience": [
    {
      "role": "Job title",
      "company": "Company name", 
      "duration": "Employment duration (e.g., 'Jan 2020 - Present')",
      "description": ["Key responsibility 1", "Achievement 2", "Task 3"]
    }
  ],
  "education": [
    {
      "degree": "Degree name and field",
      "institution": "University/College name",
      "graduation_year": "Year or expected year"
    }
  ],
  "technical_skills": ["skill1", "skill2", "skill3"],
  "soft_skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief project description",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year obtained"
    }
  ],
  "resume_rating": 7,
  "improvement_areas": "Specific areas for improvement with actionable advice. Include suggestions for better formatting, missing sections, weak descriptions, lack of quantified achievements, etc.",
  "upskill_suggestions": ["skill1 to learn", "technology2 to master", "certification3 to pursue"]
}

Remember: Return ONLY the JSON object, nothing else.
`;
};

/**
 * Analyze resume using Gemini AI
 * @param {string} resumeText - Extracted resume text
 * @param {string} fileName - Original file name for logging
 * @returns {Promise<Object>} - Structured resume data
 */
const analyzeWithAI = async (resumeText, fileName) => {
  try {
    console.log(`🤖 Starting AI analysis for: ${fileName}`);
    
    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      throw new AppError('Google AI API key not configured. Please contact support.', 500);
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent results
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });

    const prompt = createAnalysisPrompt(resumeText);
    
    console.log(`📝 Sending prompt to AI (${prompt.length} characters)`);
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    console.log(`📨 Received AI response (${aiResponse.length} characters)`);

    // Clean up the response - remove any markdown formatting
    let cleanResponse = aiResponse.trim();
    
    // Remove code blocks if present
    cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any text before the first { or after the last }
    const firstBrace = cleanResponse.indexOf('{');
    const lastBrace = cleanResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new AppError('AI did not return a valid JSON response.', 500);
    }
    
    cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);

    // Parse JSON response
    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      console.error('Response:', cleanResponse.substring(0, 500));
      throw new AppError('AI returned invalid JSON format. Please try again.', 500);
    }

    // Validate and sanitize the response
    analysisResult = validateAndSanitizeAnalysis(analysisResult, fileName);

    console.log(`✅ AI analysis completed for: ${fileName}`);
    console.log(`📊 Rating: ${analysisResult.resume_rating}/10`);

    return analysisResult;

  } catch (error) {
    console.error('❌ AI analysis failed:', error.message);
    
    if (error instanceof AppError) {
      throw error;
    }

    // Handle specific AI service errors
    if (error.message.includes('API key')) {
      throw new AppError('AI service configuration error. Please contact support.', 500);
    }

    if (error.message.includes('quota') || error.message.includes('QUOTA_EXCEEDED')) {
      throw new AppError('AI service temporarily unavailable due to usage limits. Please try again later.', 503);
    }

    if (error.message.includes('RATE_LIMIT')) {
      throw new AppError('Too many requests. Please wait a moment and try again.', 429);
    }

    if (error.message.includes('timeout') || error.code === 'ECONNRESET') {
      throw new AppError('AI analysis is taking longer than expected. Please try again.', 408);
    }

    throw new AppError('AI analysis service is temporarily unavailable. Please try again later.', 503);
  }
};

/**
 * Validate and sanitize AI analysis response
 * @param {Object} analysis - Raw analysis from AI
 * @param {string} fileName - File name for logging
 * @returns {Object} - Validated and sanitized analysis
 */
const validateAndSanitizeAnalysis = (analysis, fileName) => {
  console.log(`🔍 Validating analysis for: ${fileName}`);

  // Ensure all required fields exist with proper defaults
  const sanitized = {
    name: analysis.name || null,
    email: analysis.email || null,
    phone: analysis.phone || null,
    linkedin_url: analysis.linkedin_url || null,
    portfolio_url: analysis.portfolio_url || null,
    summary: analysis.summary || null,
    work_experience: Array.isArray(analysis.work_experience) ? analysis.work_experience : [],
    education: Array.isArray(analysis.education) ? analysis.education : [],
    technical_skills: Array.isArray(analysis.technical_skills) ? analysis.technical_skills : [],
    soft_skills: Array.isArray(analysis.soft_skills) ? analysis.soft_skills : [],
    projects: Array.isArray(analysis.projects) ? analysis.projects : [],
    certifications: Array.isArray(analysis.certifications) ? analysis.certifications : [],
    resume_rating: validateRating(analysis.resume_rating),
    improvement_areas: analysis.improvement_areas || 'No specific improvement areas identified.',
    upskill_suggestions: Array.isArray(analysis.upskill_suggestions) ? analysis.upskill_suggestions : []
  };

  // Validate work experience format
  sanitized.work_experience = sanitized.work_experience.map(exp => ({
    role: exp.role || 'Not specified',
    company: exp.company || 'Not specified',
    duration: exp.duration || 'Not specified',
    description: Array.isArray(exp.description) ? exp.description : 
                 (exp.description ? [exp.description] : ['No description provided'])
  }));

  // Validate education format
  sanitized.education = sanitized.education.map(edu => ({
    degree: edu.degree || 'Not specified',
    institution: edu.institution || 'Not specified',
    graduation_year: edu.graduation_year || 'Not specified'
  }));

  // Validate projects format
  sanitized.projects = sanitized.projects.map(project => ({
    name: project.name || 'Unnamed Project',
    description: project.description || 'No description provided',
    technologies: Array.isArray(project.technologies) ? project.technologies : []
  }));

  // Validate certifications format
  sanitized.certifications = sanitized.certifications.map(cert => ({
    name: cert.name || 'Not specified',
    issuer: cert.issuer || 'Not specified',
    year: cert.year || 'Not specified'
  }));

  // Ensure strings are not too long
  if (sanitized.summary && sanitized.summary.length > 1000) {
    sanitized.summary = sanitized.summary.substring(0, 997) + '...';
  }

  if (sanitized.improvement_areas && sanitized.improvement_areas.length > 2000) {
    sanitized.improvement_areas = sanitized.improvement_areas.substring(0, 1997) + '...';
  }

  console.log(`✅ Analysis validation completed for: ${fileName}`);
  
  return sanitized;
};

/**
 * Validate and sanitize rating value
 * @param {*} rating - Rating value from AI
 * @returns {number} - Valid rating between 1-10
 */
const validateRating = (rating) => {
  const numRating = parseInt(rating);
  
  if (isNaN(numRating) || numRating < 1) {
    return 1;
  }
  
  if (numRating > 10) {
    return 10;
  }
  
  return numRating;
};

/**
 * Main function to analyze resume
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} fileName - Original file name
 * @returns {Promise<Object>} - Complete analysis result
 */
const analyzeResume = async (pdfBuffer, fileName) => {
  try {
    console.log(`🚀 Starting resume analysis for: ${fileName}`);
    
    // Step 1: Extract text from PDF
    const extractedText = await extractTextFromPDF(pdfBuffer, fileName);
    
    // Step 2: Analyze with AI
    const analysisResult = await analyzeWithAI(extractedText, fileName);
    
    // Step 3: Add metadata
    analysisResult.processed_at = new Date().toISOString();
    analysisResult.file_name = fileName;
    analysisResult.text_length = extractedText.length;
    
    console.log(`🎉 Resume analysis completed successfully for: ${fileName}`);
    
    return analysisResult;

  } catch (error) {
    console.error(`💥 Resume analysis failed for ${fileName}:`, error.message);
    throw error;
  }
};

/**
 * Health check for the analysis service
 * @returns {Promise<Object>} - Service health status
 */
const healthCheck = async () => {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_API_KEY) {
      return {
        status: 'unhealthy',
        message: 'Google AI API key not configured',
        timestamp: new Date().toISOString()
      };
    }

    // Test AI service with a simple request
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const testPrompt = "Respond with just the word 'healthy' if you can process this request.";
    
    const result = await model.generateContent(testPrompt);
    const response = result.response.text();
    
    if (response.toLowerCase().includes('healthy')) {
      return {
        status: 'healthy',
        message: 'Analysis service is operational',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        status: 'degraded',
        message: 'AI service responding but may be unstable',
        timestamp: new Date().toISOString()
      };
    }
    
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Service error: ${error.message}`,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  analyzeResume,
  extractTextFromPDF,
  analyzeWithAI,
  healthCheck
};