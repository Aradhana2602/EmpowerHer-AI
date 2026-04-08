const OpenAI = require('openai');
const fs = require('fs');
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;
const mammoth = require('mammoth');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'fake-key', // Prevent crash on startup if missing
});

class ResumeService {

  // ✅ Extract text from PDF / DOCX
  async extractText(filePath, mimeType) {
    let text = '';

    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } 
      else if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
      } 
      else {
        throw new Error('Unsupported file type');
      }

      return text;
    } catch (error) {
      console.error('Error extracting text:', error);
      throw new Error('Failed to extract resume text');
    }
  }

  // ✅ Main Resume Analysis
  async analyzeResume(resumeText, jobRole) {
    const prompt = `
Analyze the following resume for the job role of "${jobRole}". Provide a comprehensive evaluation in the following JSON format:

{
  "overallScore": number (0-100),
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "jobFitScore": number (0-100),
  "atsIssues": ["issue1", "issue2"]
}

Resume text:
${resumeText}

Ensure the response is valid JSON only.
`;

    try {
      // 🔥 TRY AI FIRST
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      const analysisText = response.choices[0].message.content.trim();

      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('JSON parse failed, using fallback');
        return this.analyzeResumeLocally(resumeText, jobRole);
      }

    } catch (error) {
      console.error('AI Error:', error.message);

      // 🔥 FALLBACK (NO API REQUIRED)
      return this.analyzeResumeLocally(resumeText, jobRole);
    }
  }

  // ✅ Local fallback (NO API)
  analyzeResumeLocally(text, role) {
    const keywords = {
      "Frontend Developer": ["react", "javascript", "css", "html", "redux"],
      "Backend Developer": ["node", "express", "mongodb", "api"],
      "Full Stack Developer": ["react", "node", "mongodb", "express"],
      "Data Scientist": ["python", "machine learning", "pandas", "numpy"],
      "Software Engineer": ["c++", "java", "dsa", "algorithms"]
    };

    const roleKeywords = keywords[role] || [];
    let matchCount = 0;

    const lowerText = text.toLowerCase();

    roleKeywords.forEach(word => {
      if (lowerText.includes(word)) {
        matchCount++;
      }
    });

    const score = roleKeywords.length
      ? Math.round((matchCount / roleKeywords.length) * 100)
      : 50;

    return {
      overallScore: score,
      strengths: ["Relevant skills detected in resume"],
      weaknesses: ["Some important keywords are missing"],
      suggestions: [
        "Add more role-specific keywords",
        "Include measurable achievements",
        "Improve project descriptions"
      ],
      missingKeywords: roleKeywords.filter(k => !lowerText.includes(k)),
      jobFitScore: score,
      atsIssues: [
        "Resume may not be fully ATS optimized",
        "Missing important industry keywords"
      ]
    };
  }
}

module.exports = new ResumeService();