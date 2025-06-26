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
    console.log(`Request: ${JSON.stringify(request, null, 2)}`);
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    server.stdout.once('data', (data) => {
      const response = JSON.parse(data.toString());
      console.log(`Response: ${JSON.stringify(response, null, 2)}\n`);
      resolve(response);
    });
  });
}

async function runBridgeTest() {
  // Initialize
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { roots: { listChanged: true } },
    clientInfo: { name: 'bridge-test-client', version: '1.0.0' }
  });

  // Wait for Chroma connection
  console.log('⏳ Waiting 3 seconds for Chroma MCP connection...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test bridge restore
  await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'bridges/restore',
        payload: {
          bridge_id: 'CB-20250612-1738-M3F7'
        }
      }
    }
  });

  // Check final state
  await sendRequest('tools/call', {
    name: 'state_get',
    arguments: {}
  });

  console.log('✅ Bridge test completed');
  server.kill();
}

runBridgeTest().catch(console.error);