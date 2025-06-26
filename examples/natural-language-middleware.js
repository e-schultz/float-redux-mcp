#!/usr/bin/env node

/**
 * Example: Natural Language Middleware Registration
 * 
 * Demonstrates how to register AI workflows using plain English:
 * 1. Register middleware with natural language
 * 2. Test the middleware execution
 * 3. Show automatic workflow triggering
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
    
    server.stdin.write(JSON.stringify(request) + '\n');
    
    server.stdout.once('data', (data) => {
      const response = JSON.parse(data.toString());
      resolve(response);
    });
  });
}

async function naturalLanguageMiddlewareExample() {
  console.log('🧠 Float Redux MCP - Natural Language Middleware Example\n');

  // Initialize
  await sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: { roots: { listChanged: true } },
    clientInfo: { name: 'nl-middleware-example', version: '1.0.0' }
  });

  console.log('⏳ Initializing...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Example 1: Register context-loading middleware
  console.log('📝 Example 1: Registering context-loading middleware');
  console.log('   Description: "When someone mentions React, load react-patterns context"');
  
  const middleware1 = await sendRequest('tools/call', {
    name: 'middleware_register',
    arguments: {
      description: 'When someone mentions React, load react-patterns context and boost focus'
    }
  });
  
  console.log('✅ Middleware registered:', middleware1.result.content[0].text);

  // Example 2: Register search automation middleware  
  console.log('\n📝 Example 2: Registering search automation middleware');
  console.log('   Description: "When actions contain typescript, search vault and prepare context"');
  
  const middleware2 = await sendRequest('tools/call', {
    name: 'middleware_register', 
    arguments: {
      description: 'When actions contain typescript, search vault and prepare context'
    }
  });
  
  console.log('✅ Middleware registered:', middleware2.result.content[0].text);

  // Example 3: Check registered middleware
  console.log('\n📊 Example 3: Checking registered middleware state');
  
  const stateResponse = await sendRequest('tools/call', {
    name: 'state_get',
    arguments: {}
  });
  
  const state = JSON.parse(stateResponse.result.content[0].text);
  
  console.log(`\n🎯 Middleware Registry Status:`);
  console.log(`   Total registered: ${state.middleware.registered.length}`);
  
  state.middleware.registered.forEach((mw, i) => {
    console.log(`\n   ${i + 1}. ${mw.name}`);
    console.log(`      Condition: ${mw.condition || mw.pattern || 'always'}`);
    console.log(`      Actions: ${mw.actions.length} action(s)`);
  });

  // Example 4: Test middleware triggering
  console.log('\n🧪 Example 4: Testing middleware execution');
  console.log('   Dispatching action that should trigger React middleware...');
  
  await sendRequest('tools/call', {
    name: 'float_dispatch',
    arguments: {
      action: {
        type: 'user/message',
        payload: { 
          text: 'I need help with React hooks and state management',
          topic: 'React development'
        }
      }
    }
  });

  // Wait for middleware execution
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check final state
  const finalState = await sendRequest('tools/call', {
    name: 'state_get',
    arguments: {}
  });

  const final = JSON.parse(finalState.result.content[0].text);
  
  console.log('\n📈 Final State Changes:');
  console.log(`   Active contexts: ${final.context.active.join(', ') || 'None'}`);
  console.log(`   Brain focus: ${final.brain.focus_state}`);
  console.log(`   Current context: ${final.brain.current_context || 'None'}`);

  if (final.context.active.length > 0 || final.brain.focus_state !== 'idle') {
    console.log('\n✅ SUCCESS: Natural language middleware working!');
    console.log('   The system automatically:');
    console.log('   1. Parsed natural language into executable middleware');
    console.log('   2. Registered condition matching logic');
    console.log('   3. Triggered middleware when conditions matched');
    console.log('   4. Executed the specified actions automatically');
  } else {
    console.log('\n⚠️  Middleware registered but may not have triggered');
    console.log('   Check action matching conditions and try different triggers');
  }

  console.log('\n🔚 Example completed');
  server.kill();
}

naturalLanguageMiddlewareExample().catch(error => {
  console.error('❌ Example failed:', error);
  server.kill();
  process.exit(1);
});