const axios = require('axios');

async function testOmniDimension() {
  console.log('Testing OmniDimension integration...');
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const health = await axios.get('http://localhost:5001/health');
    console.log('✅ Health check passed:', health.data);
    
    // Test 2: List agents
    console.log('\n2. Testing agent listing...');
    const agents = await axios.get('http://localhost:5001/agents');
    console.log('✅ Agents listed:', agents.data);
    
    // Test 3: Create agent if none exists
    console.log('\n3. Testing agent creation...');
    const createAgent = await axios.post('http://localhost:5001/agents', {
      name: 'Test Agent',
      welcome_message: 'Hello! I am a test agent.',
      context_breakdown: [{ title: 'Purpose', body: 'Testing OmniDimension integration' }]
    });
    console.log('✅ Agent created:', createAgent.data);
    
    // Test 4: Dispatch a test call
    console.log('\n4. Testing call dispatch...');
    const agentId = createAgent.data.agent.id || createAgent.data.agent._id || 1;
    const callData = {
      agent_id: parseInt(agentId),
      to_number: "+15551234567",
      call_context: {
        customer_name: "Test User",
        purpose: "Test call",
        test_mode: true
      }
    };
    
    const call = await axios.post('http://localhost:5001/calls', callData);
    console.log('✅ Call dispatched:', call.data);
    
    console.log('\n🎉 All OmniDimension tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testOmniDimension(); 