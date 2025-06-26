#!/usr/bin/env node

// Simple test script for the Float Redux MCP server
const { spawn } = require('child_process');

// Start the MCP server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test sequence
const tests = [
  // Initialize
  {
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: { roots: { listChanged: true } },
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  },
  // List tools
  {
    method: 'tools/list'
  },
  // Test float_dispatch
  {
    method: 'tools/call',
    params: {
      name: 'float_dispatch',
      arguments: {
        action: {
          type: 'context/load',
          payload: { context: 'test-project' }
        }
      }
    }
  },
  // Test middleware registration
  {
    method: 'tools/call',
    params: {
      name: 'middleware_register',
      arguments: {
        description: 'When someone mentions airbender, load avatar context and check for outstanding issues'
      }
    }
  },
  // Get state
  {
    method: 'tools/call',
    params: {
      name: 'state_get',
      arguments: {}
    }
  }
];

let testIndex = 0;

function runNextTest() {
  if (testIndex >= tests.length) {
    console.log('\n✅ All tests completed');
    server.kill();
    return;
  }
  
  const test = tests[testIndex++];
  const message = {
    jsonrpc: '2.0',
    id: testIndex,
    method: test.method,
    params: test.params || {}
  };
  
  console.log(`\n🚀 Test ${testIndex}: ${test.method}`);
  console.log('Request:', JSON.stringify(message, null, 2));
  
  server.stdin.write(JSON.stringify(message) + '\n');
}

// Handle server output
server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    if (line.startsWith('{')) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
        
        // Continue to next test after a short delay
        setTimeout(runNextTest, 100);
      } catch (e) {
        console.log('Non-JSON output:', line);
      }
    } else {
      console.log('Server log:', line);
    }
  });
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start testing
runNextTest();