const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const resumeService = require('../services/ResumeService');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/resume/analyze
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const { jobRole } = req.body;
    if (!jobRole) {
      return res.status(400).json({ error: 'Job role is required' });
    }

    // Extract text from resume
    const resumeText = await resumeService.extractText(req.file.path, req.file.mimetype);

    // Analyze resume
    const analysis = await resumeService.analyzeResume(resumeText, jobRole);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(analysis);
  } catch (error) {
    console.error('Resume analysis error:', error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ error: 'Failed to analyze resume' });
  }
});

module.exports = router;