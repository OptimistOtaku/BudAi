const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Helper: Parse OpenAI steps into structured actions
function parseSteps(stepsText) {
  // Simple parser: split by lines, remove numbers/bullets, trim
  return stepsText
    .split('\n')
    .map(line => line.replace(/^\s*\d+\.|^-\s*/, '').trim())
    .filter(line => line.length > 0);
}

// Helper: Extract phone number from instruction (very basic, for prototype)
function extractPhoneNumber(instruction) {
  const match = instruction.match(/\+?\d{10,15}/);
  return match ? match[0] : '+15551234567'; // Default fallback
}

// Helper: Get or create an agent
async function getOrCreateAgent() {
  try {
    // List agents
    const res = await axios.get('http://localhost:5001/agents');
    const agents = res.data.agents || [];
    if (agents.length > 0) {
      return agents[0].id || agents[0]._id || agents[0]; // Use first agent
    }
    // Create agent if none exists
    const createRes = await axios.post('http://localhost:5001/agents', {
      name: 'Default Agent',
      welcome_message: 'Hello! I am your assistant.',
      context_breakdown: [{ title: 'Purpose', body: 'General assistant' }]
    });
    const agent = createRes.data.agent;
    return agent.id || agent._id || agent;
  } catch (err) {
    throw new Error('Failed to get or create agent: ' + (err.response?.data || err.message));
  }
}

// Helper: Orchestrate actions
async function orchestrateActions(actions, instruction) {
  const log = [];
  let agentId = null;
  let phoneNumber = extractPhoneNumber(instruction);
  for (const action of actions) {
    // Example: very basic intent detection
    if (/find.*dentist|search.*dentist/i.test(action)) {
      log.push({ action, result: 'Dentist search would be performed here (external API or DB).' });
    } else if (/call|appointment|phone/i.test(action)) {
      // Get or create agent if not already
      if (!agentId) {
        try {
          agentId = await getOrCreateAgent();
        } catch (err) {
          log.push({ action, error: err.message });
          continue;
        }
      }
      // Call the Python microservice to dispatch a call
      try {
        const response = await axios.post('http://localhost:5001/calls', {
          agent_id: agentId,
          to_number: phoneNumber,
          call_params: { subject: action }
        });
        log.push({ action, result: response.data });
      } catch (err) {
        log.push({ action, error: err.response?.data || err.message });
      }
    } else if (/calendar|add.*calendar|schedule|book/i.test(action)) {
      // Placeholder for Google Calendar integration
      log.push({ action, result: 'Google Calendar event would be created here.' });
    } else {
      log.push({ action, result: 'No handler for this action.' });
    }
  }
  return log;
}

// Health check
app.get('/', (req, res) => {
  res.send('Node.js backend is running');
});

// POST /workflow: Accepts user instructions and will orchestrate the workflow
app.post('/workflow', async (req, res) => {
  const { instruction } = req.body;
  if (!instruction) {
    return res.status(400).json({ success: false, error: 'Instruction is required.' });
  }

  try {
    // Use OpenAI to parse the instruction into steps
    const prompt = `Break down the following user instruction into a sequence of actionable steps for AI agents to execute.\nInstruction: "${instruction}"\nSteps:`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert workflow planner for AI agents.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.2,
    });
    const stepsText = completion.data.choices[0].message.content.trim();
    const actions = parseSteps(stepsText);
    const workflowLog = await orchestrateActions(actions, instruction);
    res.json({ success: true, steps: actions, workflowLog });
  } catch (error) {
    console.error('Workflow error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Failed to process workflow.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
}); 