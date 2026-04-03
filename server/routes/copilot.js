const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Generate an AI-drafted message for boundaries/workload
router.post('/draft', async (req, res) => {
  try {
    const { conflictType, phase, actionType, tone } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is missing from environment variables' });
    }

    if (!conflictType || !phase || !actionType) {
        return res.status(400).json({ error: 'Missing required parameters: conflictType, phase, actionType' });
    }

    const systemPrompt = `
You are a career and communication copilot for a professional woman. She is actively using a menstrual cycle tracking app to sync her work life with her biological natural rhythms. 

Your job is to draft a short, professional, and empathetic email or Slack message that she can use to set boundaries at work.

Context:
- Current Menstrual Cycle Phase: ${phase}
- The work conflict/task: ${conflictType}
- The requested action: ${actionType}
- Tonality/Vibe requested: ${tone || 'Professional and polite'}

Instructions: 
1. The message should directly achieve the "requested action" (e.g. reschedule a meeting or decline a task).
2. DO NOT overshare medical details (do not explicitly mention "menstrual cycle", "period", "luteal phase", etc., unless the user explicitly asked you to, which they didn't). Instead, use professional workplace language like "bandwidth", "focus time", "health reasons", "energy levels", or "need to rest".
3. Provide ONLY the drafted message string. No opening remarks like "Here is your message:", just the exact text she can copy-paste.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please draft the message for me.` } // User prompt kicks off the system rule
      ],
      max_tokens: 250,
      temperature: 0.7
    });

    const draft = response.choices[0].message.content.trim();
    
    res.json({ draft });
  } catch (error) {
    console.error('Error generating copilot draft:', error);
    res.status(500).json({ error: 'Failed to generate copilot draft' });
  }
});

module.exports = router;
