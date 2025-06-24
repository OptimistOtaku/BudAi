from flask import Flask, request, jsonify
from omnidimension import Client
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load OmniDimension credentials from environment variables or config
OMNIDIM_API_KEY = os.getenv('OMNIDIM_API_KEY')

if not OMNIDIM_API_KEY:
    logger.error("OMNIDIM_API_KEY not found in environment variables")
    raise ValueError("OMNIDIM_API_KEY is required")

# Initialize the OmniDimension client
try:
    client = Client(OMNIDIM_API_KEY)
    logger.info("OmniDimension client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize OmniDimension client: {e}")
    raise

@app.route('/agents', methods=['POST'])
def create_agent():
    data = request.json
    logger.info(f"Creating agent with data: {data}")
    try:
        agent = client.agent.create(**data)
        logger.info(f"Agent created successfully: {agent}")
        return jsonify({'success': True, 'agent': agent}), 201
    except Exception as e:
        logger.error(f"Failed to create agent: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/agents/create-concierge', methods=['POST'])
def create_concierge_agent():
    """Create a full-featured AI concierge agent with web search and post-call actions"""
    try:
        webhook_url = request.json.get('webhook_url', 'http://localhost:5000/omnidim-webhook')
        
        agent_data = {
            "name": "AI Concierge",
            "welcome_message": "Hello! I'm your AI concierge. I can help you find services, make appointments, and handle various tasks. What would you like me to help you with today?",
            "context_breakdown": [
                {
                    "title": "Purpose", 
                    "body": "I am an AI concierge that can help users find services, make appointments, call businesses, and handle various tasks. I can search the web, make phone calls, and perform post-call actions like adding appointments to calendars."
                },
                {
                    "title": "Capabilities",
                    "body": "I can search for businesses, call them, book appointments, extract information from conversations, and trigger post-call actions like calendar integration."
                },
                {
                    "title": "Instructions",
                    "body": "When given a task, I will: 1) Search for relevant information if needed, 2) Call the appropriate business, 3) Handle the conversation professionally, 4) Extract key information, 5) Trigger post-call actions."
                }
            ],
            "transcriber": {
                "provider": "deepgram_stream",
                "model": "nova-3",
                "silence_timeout_ms": 400,
                "punctuate": True,
                "smart_format": True
            },
            "model": {
                "model": "gpt-4o-mini",
                "temperature": 0.3
            },
            "voice": {
                "provider": "eleven_labs",
                "voice_id": "JBFqnCBsd6RMkjVDRZzb"
            },
            "web_search": {
                "enabled": True,
                "provider": "DuckDuckGo"
            },
            "post_call_actions": {
                "webhook": {
                    "enabled": True,
                    "url": webhook_url
                },
                "extracted_variables": [
                    {
                        "key": "appointment_date",
                        "prompt": "Extract the confirmed appointment date and time from the conversation."
                    },
                    {
                        "key": "business_name",
                        "prompt": "Extract the name of the business or service provider from the conversation."
                    },
                    {
                        "key": "business_phone",
                        "prompt": "Extract the phone number of the business from the conversation."
                    },
                    {
                        "key": "business_address",
                        "prompt": "Extract the address of the business from the conversation."
                    },
                    {
                        "key": "appointment_type",
                        "prompt": "Extract the type of appointment or service requested."
                    },
                    {
                        "key": "special_instructions",
                        "prompt": "Extract any special instructions or requirements mentioned."
                    }
                ]
            },
            "filler": {
                "enabled": True,
                "after_sec": 0,
                "fillers": ['let me check that for you', 'one moment please', 'I\'m looking that up now']
            }
        }
        
        logger.info(f"Creating concierge agent with webhook URL: {webhook_url}")
        agent = client.agent.create(**agent_data)
        logger.info(f"Concierge agent created successfully: {agent}")
        
        return jsonify({
            'success': True, 
            'agent': agent,
            'message': 'AI Concierge agent created with full capabilities'
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create concierge agent: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/agents', methods=['GET'])
def list_agents():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    logger.info(f"Listing agents: page={page}, page_size={page_size}")
    try:
        agents = client.agent.list(page=page, page_size=page_size)
        logger.info(f"Found {len(agents)} agents")
        return jsonify({'success': True, 'agents': agents}), 200
    except Exception as e:
        logger.error(f"Failed to list agents: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    logger.info(f"Getting agent details for ID: {agent_id}")
    try:
        agent = client.agent.get(agent_id)
        logger.info(f"Agent retrieved successfully: {agent}")
        return jsonify({'success': True, 'agent': agent}), 200
    except Exception as e:
        logger.error(f"Failed to get agent: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/calls', methods=['POST'])
def dispatch_call():
    data = request.json
    logger.info(f"Dispatching call with data: {data}")
    
    agent_id = data.get('agent_id')
    to_number = data.get('to_number')
    call_context = data.get('call_context', {})
    
    logger.info(f"Types: agent_id={type(agent_id)}, to_number={type(to_number)}, call_context={type(call_context)}")
    logger.info(f"call_context value: {call_context}")

    # Validate required fields
    if not agent_id:
        error_msg = "agent_id is required"
        logger.error(error_msg)
        return jsonify({'success': False, 'error': error_msg}), 400
    
    if not to_number:
        error_msg = "to_number is required"
        logger.error(error_msg)
        return jsonify({'success': False, 'error': error_msg}), 400
    
    # Ensure agent_id is an integer
    try:
        agent_id = int(agent_id)
    except (ValueError, TypeError):
        error_msg = f"agent_id must be an integer, got: {agent_id}"
        logger.error(error_msg)
        return jsonify({'success': False, 'error': error_msg}), 400
    
    try:
        # Minimal context for debugging
        if not isinstance(call_context, dict):
            call_context = {"context": str(call_context)}
        logger.info(f"Dispatching call: agent_id={agent_id}, to_number={to_number}, call_context={call_context}")
        call = client.call.dispatch_call(agent_id, to_number, call_context)
        logger.info(f"Call dispatched successfully: {call}")
        return jsonify({'success': True, 'call': call}), 201
    except Exception as e:
        logger.error(f"Failed to dispatch call: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/calls', methods=['GET'])
def get_call_logs():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    agent_id = request.args.get('agent_id')
    logger.info(f"Getting call logs: page={page}, page_size={page_size}, agent_id={agent_id}")
    try:
        if agent_id:
            logs = client.call.get_call_logs(page=page, page_size=page_size, agent_id=agent_id)
        else:
            logs = client.call.get_call_logs(page=page, page_size=page_size)
        logger.info(f"Retrieved {len(logs)} call logs")
        return jsonify({'success': True, 'call_logs': logs}), 200
    except Exception as e:
        logger.error(f"Failed to get call logs: {e}")
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'OmniDimension Python Service'}), 200

if __name__ == '__main__':
    logger.info("Starting OmniDimension Python Service on port 5001")
    app.run(host='0.0.0.0', port=5001, debug=True) 