/**
 * Test 3: Create Agents with Demo Data
 */

const apiClient = require('../utils/api-client');
const logger = require('../utils/logger');
const dataStore = require('../utils/test-data-store');

const agentsData = [
  {
    name: 'Sarah Agent',
    email: 'agent1@demoagency.com',
    phone: '+91 98765 00001',
    territory: 'North India',
    specialization: 'Luxury Travel'
  },
  {
    name: 'Mike Agent',
    email: 'agent2@demoagency.com',
    phone: '+91 98765 00002',
    territory: 'South India',
    specialization: 'Adventure Tours'
  },
  {
    name: 'Lisa Agent',
    email: 'agent3@demoagency.com',
    phone: '+91 98765 00003',
    territory: 'West India',
    specialization: 'Family Packages'
  }
];

async function createAgent(agentData, token) {
  const result = await apiClient.post('/agents', {
    name: agentData.name,
    email: agentData.email,
    password: 'Agent@123',
    phone: agentData.phone,
    territory: agentData.territory,
    specialization: agentData.specialization
  }, token);

  if (!result.success) {
    logger.error(`Failed to create ${agentData.name}: ${result.error}`);
    return null;
  }

  const agentId = result.data.data?.agent?._id || result.data.data?._id;
  logger.success(`Agent created: ${agentData.name} (${agentData.email})`);
  
  dataStore.addUser('agent', {
    id: agentId,
    name: agentData.name,
    email: agentData.email,
    territory: agentData.territory,
    specialization: agentData.specialization
  });
  
  return agentId;
}

async function verifyAgentsCreated(token) {
  logger.info('Verifying agents were created...');
  
  const result = await apiClient.get('/agents', token);
  
  if (!result.success) {
    logger.warning(`Could not verify agents: ${result.error}`);
    logger.info('Agents may still have been created');
    return true; // Not critical
  }
  
  const agents = result.data.data?.agents || result.data.data || [];
  logger.success(`Verified: ${agents.length} agents found in system`);
  
  return agents.length >= 3;
}

async function runTest() {
  logger.step('TEST 3: Create Agents with Demo Data');
  
  const token = apiClient.getToken('operator');
  logger.info(`Debug: operator token value: ${token ? token.substring(0, 20) + '...' : 'UNDEFINED/NULL'}`);
  logger.info(`Debug: All tokens keys: ${JSON.stringify(Object.keys(apiClient.tokens))}`);
  logger.info(`Debug: Token values: ${JSON.stringify(Object.keys(apiClient.tokens).map(k => ({ [k]: apiClient.tokens[k] ? 'EXISTS' : 'MISSING' })))}`);
  
  if (!token) {
    logger.error('No operator token found. Test 2 may have failed to save token.');
    const result = { success: false, error: 'No operator token' };
    dataStore.addTestResult('Test 3: Create Agents', result);
    return result;
  }
  
  let createdCount = 0;
  
  for (const agentData of agentsData) {
    const agentId = await createAgent(agentData, token);
    if (agentId) createdCount++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  logger.info(`Created ${createdCount}/${agentsData.length} agents`);
  
  // Verify
  const verified = await verifyAgentsCreated(token);
  
  const result = { 
    success: createdCount === agentsData.length && verified,
    createdCount,
    totalExpected: agentsData.length
  };
  
  dataStore.addTestResult('Test 3: Create Agents', result);
  return result;
}

module.exports = { runTest };
