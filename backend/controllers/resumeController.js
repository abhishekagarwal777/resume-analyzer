const pool = require('../db/index');
const analysisService = require('../services/analysisService');

/**
 * Upload and analyze a resume
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a PDF file.'
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Only PDF files are allowed.'
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size allowed is 5MB.'
      });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // Extract and analyze resume using the analysis service
    const analysisResult = await analysisService.analyzeResume(req.file.buffer, req.file.originalname);

    // Save to database
    const query = `
      INSERT INTO resumes (
        file_name, name, email, phone, linkedin_url, portfolio_url, summary,
        work_experience, education, technical_skills, soft_skills, projects,
        certifications, resume_rating, improvement_areas, upskill_suggestions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      req.file.originalname,
      analysisResult.name,
      analysisResult.email,
      analysisResult.phone,
      analysisResult.linkedin_url,
      analysisResult.portfolio_url,
      analysisResult.summary,
      JSON.stringify(analysisResult.work_experience),
      JSON.stringify(analysisResult.education),
      JSON.stringify(analysisResult.technical_skills),
      JSON.stringify(analysisResult.soft_skills),
      JSON.stringify(analysisResult.projects || []),
      JSON.stringify(analysisResult.certifications || []),
      analysisResult.resume_rating,
      analysisResult.improvement_areas,
      JSON.stringify(analysisResult.upskill_suggestions)
    ];

    const result = await pool.query(query, values);
    const savedResume = result.rows[0];

    // Parse JSON fields back for response
    savedResume.work_experience = JSON.parse(savedResume.work_experience || '[]');
    savedResume.education = JSON.parse(savedResume.education || '[]');
    savedResume.technical_skills = JSON.parse(savedResume.technical_skills || '[]');
    savedResume.soft_skills = JSON.parse(savedResume.soft_skills || '[]');
    savedResume.projects = JSON.parse(savedResume.projects || '[]');
    savedResume.certifications = JSON.parse(savedResume.certifications || '[]');
    savedResume.upskill_suggestions = JSON.parse(savedResume.upskill_suggestions || '[]');

    console.log(`Resume analyzed and saved with ID: ${savedResume.id}`);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully!',
      data: savedResume
    });

  } catch (error) {
    console.error('Error in uploadResume:', error);

    // Handle specific error types
    if (error.message.includes('PDF parsing failed')) {
      return res.status(400).json({
        success: false,
        message: 'Unable to process PDF file. Please ensure it\'s a valid, non-encrypted PDF.'
      });
    }

    if (error.message.includes('AI analysis failed')) {
      return res.status(500).json({
        success: false,
        message: 'AI analysis service is temporarily unavailable. Please try again later.'
      });
    }

    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(400).json({
        success: false,
        message: 'A resume with this name already exists.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your resume. Please try again.'
    });
  }
};

/**
 * Get all resumes from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllResumes = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, file_name, uploaded_at, name, email, resume_rating,
        CASE 
          WHEN LENGTH(improvement_areas) > 100 
          THEN SUBSTRING(improvement_areas FROM 1 FOR 100) || '...'
          ELSE improvement_areas
        END as improvement_summary
      FROM resumes 
      ORDER BY uploaded_at DESC
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      message: 'Resumes retrieved successfully',
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Error in getAllResumes:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching resumes.'
    });
  }
};

/**
 * Get a specific resume by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getResumeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID provided.'
      });
    }

    const query = `SELECT * FROM resumes WHERE id = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    const resume = result.rows[0];

    // Parse JSON fields
    resume.work_experience = JSON.parse(resume.work_experience || '[]');
    resume.education = JSON.parse(resume.education || '[]');
    resume.technical_skills = JSON.parse(resume.technical_skills || '[]');
    resume.soft_skills = JSON.parse(resume.soft_skills || '[]');
    resume.projects = JSON.parse(resume.projects || '[]');
    resume.certifications = JSON.parse(resume.certifications || '[]');
    resume.upskill_suggestions = JSON.parse(resume.upskill_suggestions || '[]');

    res.status(200).json({
      success: true,
      message: 'Resume retrieved successfully',
      data: resume
    });

  } catch (error) {
    console.error('Error in getResumeById:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the resume.'
    });
  }
};

/**
 * Delete a resume by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume ID provided.'
      });
    }

    const query = `DELETE FROM resumes WHERE id = $1 RETURNING id, file_name`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.'
      });
    }

    const deletedResume = result.rows[0];

    res.status(200).json({
      success: true,
      message: `Resume "${deletedResume.file_name}" deleted successfully`,
      data: { id: deletedResume.id, file_name: deletedResume.file_name }
    });

  } catch (error) {
    console.error('Error in deleteResume:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the resume.'
    });
  }
};

/**
 * Get resume statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getResumeStats = async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_resumes,
        AVG(resume_rating) as avg_rating,
        MAX(resume_rating) as max_rating,
        MIN(resume_rating) as min_rating,
        COUNT(CASE WHEN resume_rating >= 8 THEN 1 END) as high_rated_count,
        COUNT(CASE WHEN resume_rating BETWEEN 5 AND 7 THEN 1 END) as medium_rated_count,
        COUNT(CASE WHEN resume_rating < 5 THEN 1 END) as low_rated_count
      FROM resumes
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    // Convert string counts to numbers and round average
    stats.total_resumes = parseInt(stats.total_resumes);
    stats.avg_rating = parseFloat(parseFloat(stats.avg_rating).toFixed(2));
    stats.max_rating = parseInt(stats.max_rating);
    stats.min_rating = parseInt(stats.min_rating);
    stats.high_rated_count = parseInt(stats.high_rated_count);
    stats.medium_rated_count = parseInt(stats.medium_rated_count);
    stats.low_rated_count = parseInt(stats.low_rated_count);

    res.status(200).json({
      success: true,
      message: 'Resume statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('Error in getResumeStats:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching resume statistics.'
    });
  }
};

module.exports = {
  uploadResume,
  getAllResumes,
  getResumeById,
  deleteResume,
  getResumeStats
};