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
    
    console.log(`🚀 Test: ${method}`);
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    server.stdout.once('data', (data) => {
      const response = JSON.parse(data.toString());
      console.log(`Response: ${JSON.stringify(response, null, 2)}\n`);
      resolve(response);
    });
  });
}

async function testMiddleware() {
  // Initialize
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { roots: { listChanged: true } },
    clientInfo: { name: 'middleware-test', version: '1.0.0' }
  });

  console.log('⏳ Waiting 5 seconds for initialization...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test simple context action first (should trigger middleware logging)
  console.log('🔬 Testing simple context action...');
  await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'context/load',
        payload: { context: 'test' }
      }
    }
  });

  // Test bridge restore action
  console.log('🌉 Testing bridge restore action...');
  const bridgeResponse = await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'bridges/restore',
        payload: { bridge_id: 'test-bridge' }
      }
    }
  });

  console.log('🌉 Bridge response received');
  
  // Wait a moment for async middleware operations
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('✅ Middleware test completed');
  server.kill();
}

testMiddleware().catch(console.error);