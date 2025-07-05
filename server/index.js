const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const { google } = require('googleapis');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Google Calendar setup
const calendarId = process.env.GOOGLE_CALENDAR_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials/calendar-service-account.json';
let calendarClient;

// Validate Google Calendar setup
if (!calendarId) {
  console.warn('Warning: GOOGLE_CALENDAR_ID not set. Calendar events will not be created.');
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn('Warning: GOOGLE_APPLICATION_CREDENTIALS not set. Calendar events will not be created.');
}

const DEMO_MODE = false; // Re-enable demo mode while fixing OmniDimension integration

async function getCalendarClient() {
  if (calendarClient) return calendarClient;
  const auth = new google.auth.GoogleAuth({
    keyFile: path.resolve(__dirname, credentialsPath),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const authClient = await auth.getClient();
  calendarClient = google.calendar({ version: 'v3', auth: authClient });
  return calendarClient;
}

async function createCalendarEvent({ summary, description, startTime, endTime }) {
  try {
    const calendar = await getCalendarClient();
    const event = {
      summary,
      description,
      start: { dateTime: startTime, timeZone: 'UTC' },
      end: { dateTime: endTime, timeZone: 'UTC' },
    };
    console.log('Creating calendar event:', { calendarId, event });
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
    });
    console.log('Calendar event created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Calendar error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
    throw error;
  }
}

// Helper: Get or create the concierge agent
async function getOrCreateConciergeAgent() {
  try {
    const res = await axios.get('http://localhost:5001/agents');
    console.log('GET /agents response:', res.data);

    let agents = [];
    if (Array.isArray(res.data.agents)) {
      agents = res.data.agents;
    } else if (res.data.agents && Array.isArray(res.data.agents.data)) {
      agents = res.data.agents.data;
    } else if (res.data.agents && typeof res.data.agents === 'object') {
      agents = res.data.agents.results || res.data.agents.items || [];
    }

    if (!Array.isArray(agents)) {
      throw new Error('Agents is not an array. Full response: ' + JSON.stringify(res.data));
    }

    const conciergeAgent = agents.find(agent =>
      agent.name && agent.name.toLowerCase().includes('concierge')
    );

    if (conciergeAgent) {
      console.log('Found existing concierge agent:', conciergeAgent.id || conciergeAgent._id);
      return conciergeAgent.id || conciergeAgent._id;
    }

    console.log('Creating new concierge agent...');
    const createRes = await axios.post('http://localhost:5001/agents/create-concierge', {
      webhook_url: 'http://localhost:5000/omnidim-webhook'
    });
    console.log('POST /agents/create-concierge response:', createRes.data);

    const agent = createRes.data.agent;
    const agentId =
      agent?.id ||
      agent?._id ||
      agent?.data?.id ||
      agent?.data?._id ||
      agent?.json?.id; // Support agent.json.id structure

    if (!agentId) {
      throw new Error('Agent ID not found. Full response: ' + JSON.stringify(createRes.data));
    }

    console.log('Concierge agent created:', agentId);
    return agentId;

  } catch (err) {
    console.error('Failed to get or create concierge agent:', err.response?.data || err.message);
    throw new Error('Failed to get or create concierge agent: ' +
      (err.response?.data ? JSON.stringify(err.response.data) : err.message));
  }
}

// Helper: Extract phone number from instruction (very basic, for prototype)
function extractPhoneNumber(instruction) {
  const match = instruction.match(/\+?\d{10,15}/);
  return match ? match[0] : '+15551234567'; // Default fallback
}

// Health check
app.get('/', (req, res) => {
  res.send('Node.js backend is running');
});

// POST /workflow: Accepts user instructions and dispatches to OmniDimension agent
app.post('/workflow', async (req, res) => {
  const { instruction } = req.body;
  if (!instruction) {
    return res.status(400).json({ success: false, error: 'Instruction is required.' });
  }

  if (DEMO_MODE) {
    // Simulate a successful call dispatch
    const fakeCallId = 'demo-call-123';
    const agentId = 9999;
    const workflowResponse = {
      success: true,
      message: 'Workflow dispatched to AI agent',
      agent_id: agentId,
      call_id: fakeCallId,
      status: 'completed',
      instruction,
      steps: [
        "Initializing AI Concierge Agent...",
        "Searching for nearby dental services...",
        "Found several options, selecting best rated...",
        "Preparing to make call to dental office...",
        "Connecting to Dr. Parul's Dental Clinic...",
        "Checking appointment availability...",
        "Confirming appointment details...",
        "Adding appointment to calendar...",
        "Finalizing booking and notifications..."
      ]
    };

    // Simulate webhook call after a short delay
    setTimeout(async () => {
      try {
        await axios.post('http://localhost:5000/omnidim-webhook', {
          call_id: fakeCallId,
          agent_id: agentId,
          extracted_variables: {
            appointment_date: new Date(Date.now() + 3600 * 1000).toISOString(),
            business_name: 'Dr. Parul',
            business_phone: '+91 9319063787',
            business_address: 'Rohini Sector 10',
            appointment_type: 'Dental Checkup',
            special_instructions: 'Arrive 10 minutes early'
          },
          summary: 'Appointment booked successfully',
          transcript: 'This is a simulated transcript.'
        });
      } catch (err) {
        console.error('Demo mode: Failed to simulate webhook:', err.message);
      }
    }, 2000); // Webhook after 2 seconds

    // Add a realistic delay before responding to the frontend
    setTimeout(() => {
      res.json(workflowResponse);
    }, 3000); // 3 seconds delay for realism
    return;
  }

  try {
    console.log('Processing workflow instruction:', instruction);
    
    // Get or create the concierge agent
    const agentId = await getOrCreateConciergeAgent();
    
    // Always use the Indian phone number for demo
    const phoneNumber = '+919319063787';
    
    // Use minimal call context for compatibility
    const callContext = {
      user_instruction: instruction
    };
    
    // Dispatch the call to the OmniDimension agent
    console.log('Dispatching call to agent:', { agentId, phoneNumber, callContext });
    const response = await axios.post('http://localhost:5001/calls', {
      agent_id: parseInt(agentId),
      to_number: phoneNumber,
      call_context: callContext
    });
    
    const call = response.data.call;
    console.log('Call dispatched successfully:', call);
    
    const workflowResponse = {
      success: true,
      message: 'Workflow dispatched to AI agent',
      agent_id: agentId,
      call_id: call.id,
      status: call.status,
      instruction: instruction,
      note: 'The AI agent will handle the entire workflow including web search, calling, and post-call actions.'
    };
    
    console.log('Workflow response:', workflowResponse);
    res.json(workflowResponse);
    
  } catch (error) {
    console.error('Workflow error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process workflow.',
      details: error.response?.data || error.message
    });
  }
});

// Webhook endpoint for post-call actions from OmniDimension
app.post('/omnidim-webhook', async (req, res) => {
  console.log('Received webhook from OmniDimension:', req.body);
  
  try {
    const { 
      call_id, 
      agent_id, 
      extracted_variables,
      summary,
      transcript 
    } = req.body;
    
    // Extract appointment details from the conversation
    const appointmentDate = extracted_variables?.appointment_date;
    const businessName = extracted_variables?.business_name;
    const businessPhone = extracted_variables?.business_phone;
    const businessAddress = extracted_variables?.business_address;
    const appointmentType = extracted_variables?.appointment_type;
    const specialInstructions = extracted_variables?.special_instructions;
    
    console.log('Extracted appointment details:', {
      appointmentDate,
      businessName,
      businessPhone,
      businessAddress,
      appointmentType,
      specialInstructions
    });
    
    // Add to Google Calendar if we have appointment details
    if (appointmentDate && businessName && calendarId && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        // Parse the appointment date (this is a simplified example)
        const startTime = new Date(appointmentDate).toISOString();
        const endTime = new Date(new Date(appointmentDate).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour duration
        
        const summary = `Appointment with ${businessName}`;
        const description = `Appointment Type: ${appointmentType || 'General'}\n` +
          `Business: ${businessName}\n` +
          `Phone: ${businessPhone || 'N/A'}\n` +
          `Address: ${businessAddress || 'N/A'}\n` +
          `Special Instructions: ${specialInstructions || 'None'}\n\n` +
          `Booked via AI Concierge Agent`;
        
        const event = await createCalendarEvent({ summary, description, startTime, endTime });
        
        console.log('Calendar event created from webhook:', event);
        
        res.json({
          success: true,
          message: 'Webhook processed successfully',
          calendar_event_created: true,
          event_id: event.id
        });
        
      } catch (calendarError) {
        console.error('Failed to create calendar event from webhook:', calendarError);
        res.json({
          success: true,
          message: 'Webhook processed but calendar event creation failed',
          calendar_event_created: false,
          error: calendarError.message
        });
      }
    } else {
      console.log('No appointment details found or calendar not configured');
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        calendar_event_created: false,
        reason: 'No appointment details or calendar not configured'
      });
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log('OmniDimension AI Concierge workflow system ready!');
}); 