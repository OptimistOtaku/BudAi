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
      <div className="background-pattern"></div>
      
      <header className="App-header">
        <div className="logo-container">
          <div className="logo-icon">🌱</div>
          <h1>BudAI</h1>
        </div>
        <p className="tagline">Your Intelligent AI Concierge</p>
        <div className="header-decoration"></div>
      </header>

      <main className="App-main">
        <div className="container">
          <form onSubmit={handleSubmit} className="workflow-form">
            <div className="form-header">
              <h2>What can I help you with today?</h2>
              <p>Describe any task and I'll handle it for you automatically</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="instruction">
                <span className="label-icon">💬</span>
                Your Request
              </label>
              <textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g., Find a dentist nearby and book the earliest appointment available, then add it to my calendar"
                rows={4}
                disabled={loading}
              />
            </div>
            
            <button type="submit" disabled={loading || !instruction.trim()} className="submit-btn">
              <span className="btn-icon">{loading ? '🤖' : '🚀'}</span>
              <span className="btn-text">
                {loading ? 'AI Agent Working...' : 'Start AI Workflow'}
              </span>
            </button>
          </form>

          {loading && (
            <div className="loading-section">
              <div className="loading-animation">
                <div className="loading-spinner"></div>
                <div className="loading-pulse"></div>
              </div>
              <h3>🤖 Your AI Concierge is processing...</h3>
              <p>I'm working on your request step by step</p>
              
              {processingSteps.length > 0 && (
                <div className="agent-status">
                  <h4>📋 Workflow Progress</h4>
                  <div className="steps-container">
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
                        <div key={index} className={`step-item ${statusClass}`}>
                          <span className="step-icon">{icon}</span>
                          <span className="step-text">{stepText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-section">
              <div className="error-icon">⚠️</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="result-section">
              <div className="result-header">
                <div className="success-icon">🎉</div>
                <h3>Workflow Dispatched Successfully!</h3>
              </div>
              
              <div className="result-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Agent ID</span>
                    <span className="detail-value">{result.agent_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Call ID</span>
                    <span className="detail-value">{result.call_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value status-badge">{result.status}</span>
                  </div>
                </div>
                
                <div className="instruction-display">
                  <span className="instruction-label">Your Request:</span>
                  <p className="instruction-text">{result.instruction}</p>
                </div>
              </div>

              <div className="agent-capabilities">
                <h4>🤖 What I Can Do For You</h4>
                <div className="capabilities-grid">
                  <div className="capability-item">
                    <span className="capability-icon">🔍</span>
                    <div className="capability-content">
                      <h5>Web Search</h5>
                      <p>Find businesses and services</p>
                    </div>
                  </div>
                  <div className="capability-item">
                    <span className="capability-icon">📞</span>
                    <div className="capability-content">
                      <h5>Voice Calls</h5>
                      <p>Make and handle phone conversations</p>
                    </div>
                  </div>
                  <div className="capability-item">
                    <span className="capability-icon">📅</span>
                    <div className="capability-content">
                      <h5>Calendar Integration</h5>
                      <p>Add appointments automatically</p>
                    </div>
                  </div>
                  <div className="capability-item">
                    <span className="capability-icon">🧠</span>
                    <div className="capability-content">
                      <h5>Natural Language</h5>
                      <p>Understand and execute complex tasks</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="workflow-note">
                <div className="note-icon">💡</div>
                <div className="note-content">
                  <p><strong>How it works:</strong> {result.note}</p>
                  <p>The AI agent will handle the entire workflow autonomously, including web search, calling businesses, booking appointments, and adding them to your calendar.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="App-footer">
        <div className="footer-content">
          <p>Built with ❤️ using OmniDimension AI Agents • React • Node.js • Python</p>
          <div className="footer-decoration"></div>
        </div>
      </footer>
    </div>
  );
}

export default App;
