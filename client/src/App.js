import React, { useState } from 'react';
import './App.css';

function App() {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:5000/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instruction: instruction.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to process workflow');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Concierge Workflow</h1>
        <p>Powered by OmniDimension AI Agents</p>
      </header>

      <main className="App-main">
        <form onSubmit={handleSubmit} className="workflow-form">
          <div className="form-group">
            <label htmlFor="instruction">What would you like me to help you with?</label>
            <textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Find a dentist nearby and book the earliest appointment available, then add it to my calendar"
              rows={4}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading || !instruction.trim()}>
            {loading ? '🤖 AI Agent Working...' : '🚀 Start AI Workflow'}
          </button>
        </form>

        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>🤖 Your AI Concierge Agent is processing your request...</p>
            <div className="agent-status">
              <p>• Creating/Configuring AI Agent</p>
              <p>• Dispatching to OmniDimension</p>
              <p>• Agent will handle: Web Search → Call → Book → Calendar</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-section">
            <h3>❌ Error</h3>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-section">
            <h3>✅ Workflow Dispatched Successfully</h3>
            
            <div className="result-details">
              <div className="detail-item">
                <strong>Agent ID:</strong> {result.agent_id}
              </div>
              <div className="detail-item">
                <strong>Call ID:</strong> {result.call_id}
              </div>
              <div className="detail-item">
                <strong>Status:</strong> {result.status}
              </div>
              <div className="detail-item">
                <strong>Instruction:</strong> {result.instruction}
              </div>
            </div>

            <div className="agent-capabilities">
              <h4>🤖 AI Agent Capabilities</h4>
              <ul>
                <li>🔍 <strong>Web Search:</strong> Find businesses and services</li>
                <li>📞 <strong>Voice Calls:</strong> Make and handle phone conversations</li>
                <li>📅 <strong>Calendar Integration:</strong> Add appointments automatically</li>
                <li>🧠 <strong>Natural Language:</strong> Understand and execute complex tasks</li>
                <li>📝 <strong>Post-Call Actions:</strong> Extract info and trigger follow-ups</li>
              </ul>
            </div>

            <div className="workflow-note">
              <p><strong>Note:</strong> {result.note}</p>
              <p>The AI agent will handle the entire workflow autonomously, including web search, calling businesses, booking appointments, and adding them to your calendar.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>Built with OmniDimension AI Agents • React • Node.js • Python</p>
      </footer>
    </div>
  );
}

export default App;
