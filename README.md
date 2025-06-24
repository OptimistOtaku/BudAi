# AI Workflow Orchestrator - Demo

A platform that transforms natural language instructions into automated workflows through coordinated AI agents.

## 🚀 Demo Features

- **Natural Language Processing**: Parse complex instructions into actionable steps
- **Dentist Search**: Mock API integration for finding dental providers
- **AI Agent Calls**: OmniDimension SDK integration for voice calls
- **Calendar Integration**: Google Calendar API for appointment scheduling
- **Real-time Workflow**: Live orchestration and status tracking

## 📋 Prerequisites

1. **Node.js** (v16+)
2. **Python** (v3.8+)
3. **API Keys**:
   - Gemini API Key (Google AI Studio)
   - OmniDimension API Key
   - Google Calendar API (optional for demo)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install

# Install Python microservice dependencies
cd ../python_service
pip install flask python-dotenv omnidimension
```

### 2. Configure Environment Variables

Create `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CALENDAR_ID=your_calendar_id_here
GOOGLE_APPLICATION_CREDENTIALS=./credentials/calendar-service-account.json
PORT=5000
```

Create `python_service/.env`:
```env
OMNIDIM_API_KEY=your_omnidimension_api_key_here
```

### 3. Start All Services

**Terminal 1 - Python Microservice:**
```bash
cd python_service
python app.py
```

**Terminal 2 - Node.js Backend:**
```bash
cd server
node index.js
```

**Terminal 3 - React Frontend:**
```bash
cd client
npm start
```

### 4. Test the Demo

1. Open http://localhost:3000
2. Enter: "Find a dentist, call for appointments, book the earliest slot, and add to my calendar"
3. Click Submit
4. Watch the workflow execute!

## 🔧 Demo Workflow

1. **Parse Instruction**: Gemini breaks down the natural language into 4-5 simple steps
2. **Search Dentists**: Mock API returns sample dentist data
3. **Create AI Agent**: OmniDimension SDK creates/manages voice agents
4. **Make Phone Call**: Agent calls the selected dentist
5. **Add to Calendar**: Google Calendar integration creates appointment event

## 📁 Project Structure

```
BudAi/
├── client/                 # React frontend
├── server/                 # Node.js backend
├── python_service/         # OmniDimension microservice
└── README.md
```

## 🎯 Demo Ready Features

- ✅ Natural language instruction parsing
- ✅ Mock dentist search API
- ✅ OmniDimension agent management
- ✅ Voice call orchestration
- ✅ Google Calendar integration
- ✅ Real-time workflow status
- ✅ Error handling and logging
- ✅ Clean UI for user interaction

## 🚨 Troubleshooting

**Python Microservice Not Running:**
- Check if OmniDimension SDK is installed
- Verify OMNIDIM_API_KEY in python_service/.env

**Calendar Integration Failing:**
- Ensure Google Calendar API is enabled
- Check service account credentials
- Verify calendar permissions

**Frontend Not Loading:**
- Ensure all services are running on correct ports
- Check browser console for CORS errors

## 🔮 Future Enhancements

- Real dentist search APIs (Google Places, Yelp)
- Advanced conversation flows
- Multi-language support
- User authentication
- Persistent workflow history
- Advanced error recovery

## 📞 Support

For demo issues or questions, check the console logs for detailed error messages. 