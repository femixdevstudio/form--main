const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabaseUrl = 'https://nkweofvwxtaoshjwarwg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rd2VvZnZ3eHRhb3NoandhcndnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzA2NjEsImV4cCI6MjA5NDk0NjY2MX0.RUrzW-l8y5Il03zLYxlv4LtJmwETi4e0ZtYGKuW88D8';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialize the Google GenAI client with API key
const ai = new GoogleGenAI({ apiKey: 'AIzaSyDNYe6ep_1O4_FLYj0TD_YEJ-ACyuEHbck' });

app.use(cors());
app.use(express.json());

// Serve your static questionnaire HTML file automatically 
app.use(express.static(__dirname));

app.post('/api/generate', async (req, res) => {
  try {
    const d = req.body;

    // 1. Compile the comprehensive design strategy prompt
    const prompt = `You are a senior business strategist. Based on the answers below, write a complete, concrete, and professional business plan. Use the following section headers exactly (in uppercase): EXECUTIVE SUMMARY, BUSINESS DESCRIPTION, MARKET ANALYSIS, COMPETITIVE ADVANTAGE, REVENUE MODEL & PRICING, GO-TO-MARKET STRATEGY, FINANCIAL OVERVIEW, 12-MONTH MILESTONES. Each section should be detailed, direct, and actionable — no filler. Write in confident declarative prose. No bullet point lists.

Business Idea: ${d.idea || '—'}
Problem Being Solved: ${d.problem || '—'}
Proposed Solution: ${d.solution || '—'}
Ideal Customer: ${d.customer || '—'}
Market Size: ${d.market_size || '—'}
Market Type: ${d.segments || '—'}
Revenue Model: ${d.revenue_model || '—'}
Pricing Strategy: ${d.pricing || '—'}
Year 1 Revenue Target: ${d.revenue_goal || '—'}
Top Competitors: ${d.competitors || '—'}
Unfair Advantage: ${d.advantage || '—'}
Positioning Statement: Unlike our competitors, we ${d.positioning || '—'}
Acquisition Channels: ${d.channels || '—'}
Path to First 10 Customers: ${d.first_customers || '—'}
Retention Strategy: ${d.retention || '—'}
Startup Cost: ${d.startup_cost || '—'}
Top Operating Costs: ${d.key_costs || '—'}
12-Month Milestones: ${d.milestones || '—'}`;

    // 2. Call Google Gemini to compile text output loops
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const rawPlan = response.text;

    // AUTOMATIC SUBMISSION TO SUPABASE
    // Sanitizes incoming arrays into safe, flat comma-separated text lines
    const { error } = await supabase
      .from('submissions')
      .insert([
        {
          idea: d.idea || '',
          problem: d.problem || '',
          solution: d.solution || '',
          customer: d.customer || '',
          market_size: d.market_size || '',
          segments: Array.isArray(d.segments) ? d.segments.join(', ') : String(d.segments || ''),
          revenue_model: Array.isArray(d.revenue_model) ? d.revenue_model.join(', ') : String(d.revenue_model || ''),
          pricing: d.pricing || '',
          revenue_goal: d.revenue_goal || '',
          competitors: d.competitors || '',
          advantage: d.advantage || '',
          positioning: d.positioning || '',
          channels: Array.isArray(d.channels) ? d.channels.join(', ') : String(d.channels || ''),
          first_customers: d.first_customers || '',
          retention: d.retention || '',
          startup_cost: d.startup_cost || '',
          key_costs: d.key_costs || '',
          milestones: d.milestones || '',
          generated_plan: rawPlan // Saves the complete resulting document for admin access
        }
      ]);

    if (error) {
      console.error("Automatic submission to database dropped:", error);
    }

    // Return plan safely back to browser
    res.json({ businessPlan: rawPlan });
  } catch (error) {
    console.error("Master Processing Exception:", error);
    res.status(500).json({ error: "Failed to compile response blocks cleanly." });
  }
});

// Serve the index file for any root access
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'business-plan-questionnaire_1.html'));
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running securely on http://localhost:${PORT}`);
  });
}

module.exports = app;
