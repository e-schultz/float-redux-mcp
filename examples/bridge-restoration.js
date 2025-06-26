#!/usr/bin/env node

/**
 * Example: Bridge Restoration Workflow
 * 
 * Demonstrates the core Float Redux MCP capability:
 * 1. Dispatch a bridge/restore action
 * 2. Middleware automatically calls Chroma MCP
 * 3. Results stored in Redux state
 * 4. Full MCP tools→tools orchestration
 */

const { spawn } = require('child_process');

// Start the Float Redux MCP server
const server = spawn('node', ['../dist/index.js'], {
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
    
    console.log(`🚀 ${method}:`, JSON.stringify(params, null, 2));
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    server.stdout.once('data', (data) => {
      const response = JSON.parse(data.toString());
      console.log(`✅ Response:`, JSON.stringify(response.result || response, null, 2));
      resolve(response);
    });
  });
}

async function bridgeRestorationExample() {
  console.log('🌉 Float Redux MCP - Bridge Restoration Example\n');

  // Initialize the MCP connection
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { roots: { listChanged: true } },
    clientInfo: { name: 'bridge-restoration-example', version: '1.0.0' }
  });

  console.log('\n⏳ Waiting for Chroma MCP connection to establish...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Example 1: Bridge restoration
  console.log('📋 Example 1: Restoring a bridge from Chroma');
  await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'bridges/restore',
        payload: { 
          bridge_id: 'CB-20250612-1738-M3F7',
          description: 'MCP + Nushell + FloatCtl Integration bridge'
        }
      }
    }
  });

  // Wait for async middleware operations
  console.log('\n⏳ Waiting for middleware to complete Chroma calls...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check the results
  console.log('📊 Example 2: Checking restored state');
  const stateResponse = await sendRequest('tools/call', {
    name: 'state_get',
    arguments: {}
  });

  // Parse and display results
  const state = JSON.parse(stateResponse.result.content[0].text);
  
  console.log('\n🎯 Bridge Restoration Results:');
  console.log(`   Active Bridge: ${state.bridges.active_bridge || 'None'}`);
  console.log(`   Context Restored: ${state.bridges.restored_context ? 'YES' : 'NO'}`);
  console.log(`   Available Bridges: ${state.bridges.available_bridges.length}`);
  
  if (state.bridges.restored_context) {
    console.log('\n✅ SUCCESS: MCP tools→tools pattern working!');
    console.log('   The middleware automatically:');
    console.log('   1. Intercepted the bridges/restore action');
    console.log('   2. Called chroma_query_documents tool');
    console.log('   3. Restored context from Chroma database');
    console.log('   4. Updated Redux state with results');
  } else {
    console.log('\n❌ No context restored - check Chroma connection');
  }

  console.log('\n🔚 Example completed - cleaning up...');
  server.kill();
}

bridgeRestorationExample().catch(error => {
  console.error('❌ Example failed:', error);
  server.kill();
  process.exit(1);
});