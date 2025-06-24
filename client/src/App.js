import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingSteps, setProcessingSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProcessingSteps([]);
    setCurrentStepIndex(-1);

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
        const steps = data.steps || [];
        setProcessingSteps(steps);
        if (steps.length > 0) {
            setCurrentStepIndex(0); // Start the step simulation
        } else {
            // No steps, just show result and stop loading
            setLoading(false);
        }
      } else {
        setError(data.error || 'Failed to process workflow');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) return;

    if (currentStepIndex < processingSteps.length) {
        const timer = setTimeout(() => {
            setCurrentStepIndex(currentStepIndex + 1);
        }, 1500); // Move to next step every 1.5 seconds
  
        return () => clearTimeout(timer);
    } else if (currentStepIndex >= processingSteps.length && processingSteps.length > 0) {
        // Finished all steps
        setLoading(false);
    }
  }, [currentStepIndex, processingSteps, loading]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧠 BudAI</h1>
        <p className="tagline">Your AI-powered workflow assistant</p>
      </header>

      <main className="App-main">
        <form onSubmit={handleSubmit} className="workflow-form">
          <div className="form-group">
            <label htmlFor="instruction">What can BudAI automate for you today?</label>
            <textarea
              id="instruction"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Find a dentist nearby, book the earliest appointment, and add it to my calendar."
              rows={4}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading || !instruction.trim()}>
            {loading ? '🤖 BudAI is working...' : '✨ Run Workflow'}
          </button>
        </form>

        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>🤖 Your AI Concierge Agent is processing your request...</p>
            {processingSteps.length > 0 && (
              <div className="agent-status">
                <h4>Workflow Steps:</h4>
                {processingSteps.map((step, index) => {
                  const stepText = step.action ? `${step.action}: ${step.details}` : step;
                  let icon = '⏳';
                  let statusClass = 'pending';
                  if (index < currentStepIndex) {
                    icon = '✅';
                    statusClass = 'done';
                  } else if (index === currentStepIndex) {
                    icon = '⚙️';
                    statusClass = 'in-progress';
                  }
                  
                  return (
                    <p key={index} className={`step-item ${statusClass}`}>
                      <span className="step-icon">{icon}</span> {stepText}
                    </p>
                  );
                })}
              </div>
            )}
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
