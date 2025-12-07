const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage for simplicity (in production, use PromptWorkbench API)
let conversationHistory = [];

// Mock prompt storage (would connect to PromptWorkbench in production)
const prompts = {
  'chatbot-main': {
    id: 'chatbot-main',
    name: 'Main Chatbot',
    template: 'You are a helpful and friendly assistant. Respond to the user\'s message in a conversational way.\n\nUser: {{user_message}}\n\nAssistant:',
    variables: ['user_message'],
    model: 'gemini-2.5-flash',
    temperature: 0.7
  }
};

// Simple variable substitution
function renderPrompt(template, variables) {
  let rendered = template;
  Object.entries(variables).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });
  return rendered;
}

// API endpoint to get chatbot response
app.post('/api/chat', async (req, res) => {
  const { message, promptId = 'chatbot-main' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const prompt = prompts[promptId];
  if (!prompt) {
    return res.status(404).json({ error: 'Prompt not found' });
  }

  // Render prompt with user message
  const renderedPrompt = renderPrompt(prompt.template, {
    user_message: message
  });

  // In production, this would call PromptWorkbench API or LLM directly
  // For now, we'll simulate a response
  const response = {
    text: `[This is a test response. In production, this would call your LLM via PromptWorkbench.]\n\nYou said: "${message}"\n\nI would respond with a helpful answer based on the prompt template.`,
    promptId: prompt.id,
    timestamp: new Date().toISOString()
  };

  // Log the interaction
  conversationHistory.push({
    timestamp: new Date().toISOString(),
    userMessage: message,
    assistantResponse: response.text,
    promptId: prompt.id,
    promptVersion: 'v1'
  });

  res.json(response);
});

// Get conversation history
app.get('/api/history', (req, res) => {
  res.json(conversationHistory);
});

// Get available prompts
app.get('/api/prompts', (req, res) => {
  res.json(Object.values(prompts));
});

// Serve the HTML interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Test Chatbot running on http://localhost:${PORT}`);
  console.log('This is a simple test chatbot for PromptWorkbench.');
  console.log('In production, this would connect to PromptWorkbench API.');
});

