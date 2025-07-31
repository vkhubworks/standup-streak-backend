const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testOnboardingFlow() {
  try {
    console.log('🧪 Testing Admin Onboarding Flow APIs...\n');

    // 1. Get onboarding progress
    console.log('1. Getting onboarding progress...');
    const progressResponse = await api.get('/teams/onboarding/progress');
    console.log('✅ Progress:', progressResponse.data);
    console.log('');

    // 2. Phase 1: Team Setup
    console.log('2. Testing Phase 1: Team Setup...');
    const phase1Data = {
      name: 'Engineering Team',
      description: 'Our awesome engineering team'
    };
    const phase1Response = await api.post('/teams/onboarding/phase1', phase1Data);
    console.log('✅ Phase 1 saved:', phase1Response.data);
    console.log('');

    // 3. Phase 2: Schedule Configuration
    console.log('3. Testing Phase 2: Schedule Configuration...');
    const phase2Data = {
      standupTime: '09:00',
      timezone: 'UTC-8',
      reminderMinutes: 5
    };
    const phase2Response = await api.post('/teams/onboarding/phase2', phase2Data);
    console.log('✅ Phase 2 saved:', phase2Response.data);
    console.log('');

    // 4. Phase 3: Team Members
    console.log('4. Testing Phase 3: Team Members...');
    const phase3Data = {
      memberEmails: [
        'john@example.com',
        'jane@example.com',
        'bob@example.com'
      ]
    };
    const phase3Response = await api.post('/teams/onboarding/phase3', phase3Data);
    console.log('✅ Phase 3 saved:', phase3Response.data);
    console.log('');

    // 5. Phase 4: Goals & Targets
    console.log('5. Testing Phase 4: Goals & Targets...');
    const phase4Data = {
      punctualityGoal: 90,
      engagementGoal: 85
    };
    const phase4Response = await api.post('/teams/onboarding/phase4', phase4Data);
    console.log('✅ Phase 4 saved:', phase4Response.data);
    console.log('');

    // 6. Complete onboarding
    console.log('6. Completing onboarding...');
    const completeResponse = await api.post('/teams/onboarding/complete');
    console.log('✅ Onboarding completed:', completeResponse.data);
    console.log('');

    // 7. Get user's teams
    console.log('7. Getting user teams...');
    const teamsResponse = await api.get('/teams');
    console.log('✅ User teams:', teamsResponse.data);
    console.log('');

    console.log('🎉 All tests passed! Onboarding flow is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n🧪 Testing validation errors...\n');

  try {
    // Test invalid team name
    console.log('Testing invalid team name...');
    await api.post('/teams/onboarding/phase1', {
      name: 'ab', // Too short
      description: 'Test'
    });
  } catch (error) {
    console.log('✅ Validation error caught for short team name:', error.response?.data?.message);
  }

  try {
    // Test invalid email
    console.log('Testing invalid email...');
    await api.post('/teams/onboarding/phase3', {
      memberEmails: ['invalid-email', 'valid@example.com']
    });
  } catch (error) {
    console.log('✅ Validation error caught for invalid email:', error.response?.data?.message);
  }

  try {
    // Test invalid goals
    console.log('Testing invalid goals...');
    await api.post('/teams/onboarding/phase4', {
      punctualityGoal: 50, // Too low
      engagementGoal: 110  // Too high
    });
  } catch (error) {
    console.log('✅ Validation error caught for invalid goals:', error.response?.data?.message);
  }
}

// Run tests
if (require.main === module) {
  console.log('🚀 Starting API Tests...\n');
  
  if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  Please set a valid JWT token in the script before running tests.');
    console.log('   You can get a token by logging in through the auth endpoints.');
    process.exit(1);
  }

  testOnboardingFlow()
    .then(() => testValidationErrors())
    .catch(console.error);
}

module.exports = { testOnboardingFlow, testValidationErrors }; 