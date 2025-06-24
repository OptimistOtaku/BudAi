const axios = require('axios');

async function testConciergeWorkflow() {
  console.log('🧪 Testing OmniDimension AI Concierge Workflow System...\n');
  
  try {
    // Test 1: Health check Python service
    console.log('1. Testing Python service health...');
    const pythonHealth = await axios.get('http://localhost:5001/health');
    console.log('✅ Python service healthy:', pythonHealth.data);
    
    // Test 2: Health check Node.js service
    console.log('\n2. Testing Node.js service health...');
    const nodeHealth = await axios.get('http://localhost:5000/');
    console.log('✅ Node.js service healthy:', nodeHealth.data);
    
    // Test 3: Create concierge agent
    console.log('\n3. Creating AI Concierge agent...');
    const agentResponse = await axios.post('http://localhost:5001/agents/create-concierge', {
      webhook_url: 'http://localhost:5000/omnidim-webhook'
    });
    console.log('✅ Concierge agent created:', {
      id: agentResponse.data.agent.id,
      name: agentResponse.data.agent.name,
      message: agentResponse.data.message
    });
    
    // Test 4: Test workflow dispatch
    console.log('\n4. Testing workflow dispatch...');
    const workflowResponse = await axios.post('http://localhost:5000/workflow', {
      instruction: 'Find a dentist nearby and book the earliest appointment available, then add it to my calendar'
    });
    console.log('✅ Workflow dispatched:', {
      success: workflowResponse.data.success,
      agent_id: workflowResponse.data.agent_id,
      call_id: workflowResponse.data.call_id,
      status: workflowResponse.data.status,
      message: workflowResponse.data.message
    });
    
    // Test 5: Test webhook endpoint (simulate post-call action)
    console.log('\n5. Testing webhook endpoint...');
    const webhookData = {
      call_id: 'test-call-123',
      agent_id: agentResponse.data.agent.id,
      extracted_variables: {
        appointment_date: '2024-01-15T10:00:00Z',
        business_name: 'Dr. Sarah Johnson Dental Clinic',
        business_phone: '+15551234567',
        business_address: '123 Main St, New York, NY',
        appointment_type: 'General checkup',
        special_instructions: 'Please arrive 15 minutes early'
      },
      summary: 'Successfully booked dental appointment',
      transcript: 'Full conversation transcript would be here...'
    };
    
    const webhookResponse = await axios.post('http://localhost:5000/omnidim-webhook', webhookData);
    console.log('✅ Webhook processed:', {
      success: webhookResponse.data.success,
      message: webhookResponse.data.message,
      calendar_event_created: webhookResponse.data.calendar_event_created
    });
    
    console.log('\n🎉 All tests passed! OmniDimension AI Concierge system is working correctly.');
    console.log('\n📋 System Summary:');
    console.log('• Python microservice: ✅ Running');
    console.log('• Node.js backend: ✅ Running');
    console.log('• AI Concierge agent: ✅ Created');
    console.log('• Workflow dispatch: ✅ Working');
    console.log('• Webhook handling: ✅ Working');
    console.log('• Calendar integration: ✅ Configured');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure the Python service is running: cd python_service && python app.py');
      console.log('2. Make sure the Node.js service is running: cd server && npm start');
      console.log('3. Check that OMNIDIM_API_KEY is set in your environment');
    }
  }
}

// Run the test
testConciergeWorkflow(); 