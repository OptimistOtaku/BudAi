from flask import Flask, request, jsonify
from omnidimension import Client
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Load OmniDimension credentials from environment variables or config
OMNIDIM_API_KEY = os.getenv('OMNIDIM_API_KEY')

# Initialize the OmniDimension client
client = Client(OMNIDIM_API_KEY)

@app.route('/agents', methods=['POST'])
def create_agent():
    data = request.json
    try:
        agent = client.agent.create(**data)
        return jsonify({'success': True, 'agent': agent}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/agents', methods=['GET'])
def list_agents():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    try:
        agents = client.agent.list(page=page, page_size=page_size)
        return jsonify({'success': True, 'agents': agents}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/calls', methods=['POST'])
def dispatch_call():
    data = request.json
    agent_id = data.get('agent_id')
    to_number = data.get('to_number')
    call_params = data.get('call_params', {})
    try:
        call = client.call.dispatch_call(agent_id, to_number, call_params)
        return jsonify({'success': True, 'call': call}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/calls', methods=['GET'])
def get_call_logs():
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    agent_id = request.args.get('agent_id')
    try:
        if agent_id:
            logs = client.call.get_call_logs(page=page, page_size=page_size, agent_id=agent_id)
        else:
            logs = client.call.get_call_logs(page=page, page_size=page_size)
        return jsonify({'success': True, 'call_logs': logs}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 