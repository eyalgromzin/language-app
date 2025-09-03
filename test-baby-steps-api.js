// Test script for baby steps API
const fetch = require('node-fetch');

async function testBabyStepsAPI() {
  try {
    console.log('Testing baby steps API...');
    
    const response = await fetch('http://localhost:3000/baby-steps/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ language: 'en' }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data && data.steps && Array.isArray(data.steps)) {
        console.log(`✅ Success! Found ${data.steps.length} steps`);
        console.log('First step:', data.steps[0]);
      } else {
        console.log('❌ Data structure issue:');
        console.log('- data exists:', !!data);
        console.log('- data.steps exists:', !!(data && data.steps));
        console.log('- data.steps is array:', !!(data && data.steps && Array.isArray(data.steps)));
        console.log('- data keys:', data ? Object.keys(data) : 'no data');
      }
    } else {
      console.log('❌ API request failed');
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testBabyStepsAPI();
