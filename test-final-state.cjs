#!/usr/bin/env node

const { spawn } = require('child_process');

// Start the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let requestId = 0;

function sendRequest(method, params = {}) {
  return new Promise((resolve) => {
    const request = {
      jsonrpc: '2.0',
      id: ++requestId,
      method,
      params
    };
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    server.stdout.once('data', (data) => {
      const response = JSON.parse(data.toString());
      resolve(response);
    });
  });
}

async function testFinalState() {
  // Initialize
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { roots: { listChanged: true } },
    clientInfo: { name: 'final-state-test', version: '1.0.0' }
  });

  console.log('⏳ Waiting for initialization...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test bridge restore action
  console.log('🌉 Dispatching bridge restore...');
  await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'bridges/restore',
        payload: { bridge_id: 'CB-20250612-1738-M3F7' }
      }
    }
  });

  // Wait for async operations
  console.log('⏳ Waiting for MCP calls to complete...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check final state
  console.log('📊 Getting final state...');
  const stateResponse = await sendRequest('tools/call', {
    name: 'state_get',
    arguments: {}
  });

  const state = JSON.parse(stateResponse.result.content[0].text);
  
  console.log('\n🎯 BRIDGE RESTORATION RESULTS:');
  console.log(`Active Bridge: ${state.bridges.active_bridge}`);
  console.log(`Restored Context: ${state.bridges.restored_context ? 'YES' : 'NO'}`);
  
  if (state.bridges.restored_context) {
    console.log('✅ MCP TOOLS→TOOLS PATTERN WORKING! 🚀');
    console.log('Context details:', JSON.stringify(state.bridges.restored_context, null, 2));
  } else {
    console.log('❌ No context restored - check Chroma connection');
  }

  server.kill();
}

testFinalState().catch(console.error);