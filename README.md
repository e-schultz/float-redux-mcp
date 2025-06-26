# Float Redux MCP

> Redux for AI - Orchestrate MCP tools through Redux middleware with natural language compilation

[![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-Compatible-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.0-purple)](https://redux-toolkit.js.org)

## Overview

Float Redux MCP transforms AI workflows by treating **Redux as a universal coordination layer** for AI tools. Instead of manually chaining tool calls, dispatch Redux actions and let middleware automatically orchestrate complex multi-tool workflows.

### Key Innovation

```javascript
// Traditional approach: Manual tool chaining
const bridgeData = await chroma_query_documents({...});
const vaultResult = await vault_update({...});
const contextResult = await brain_focus({...});

// Float Redux approach: Declarative dispatch
float_dispatch({
  type: "bridges/restore",
  payload: { bridge_id: "CB-20250612-1738-M3F7" }
});
// → Middleware automatically: queries Chroma → updates vault → focuses brain
```

## Features

- 🔄 **MCP Tools→Tools**: Seamlessly orchestrate multiple MCP servers
- 🧠 **Natural Language Middleware**: Register workflows using plain English  
- 📊 **Redux State Management**: Centralized state for AI system context
- 🔍 **Comprehensive Logging**: Pino JSONL logs for full workflow visibility
- 🎯 **Bridge Restoration**: Automatic context restoration from Chroma
- 🚀 **Fuzzy Compilation**: Ollama-powered natural language → Redux patterns

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Configuration

Add to your MCP client configuration:

```json
{
  "float-redux": {
    "command": "node",
    "args": ["/path/to/float-redux-mcp/dist/index.js"]
  }
}
```

### Basic Usage

```javascript
// Dispatch Redux actions through MCP
await client.callTool({
  name: "float_dispatch",
  arguments: {
    action: {
      type: "bridges/restore",
      payload: { bridge_id: "CB-20250612-1738-M3F7" }
    }
  }
});

// Register natural language middleware
await client.callTool({
  name: "middleware_register", 
  arguments: {
    description: "When bridge restore actions happen, search chroma for bridge data and load context"
  }
});

// Get current state
await client.callTool({
  name: "state_get",
  arguments: {}
});
```

## Architecture

### Redux Store Structure

```typescript
interface FloatState {
  contexts: {
    active: string[];           // Currently loaded contexts
    hierarchy: Record<string, string[]>;
    data: Record<string, any>;
  };
  brain: {
    current_context: any;       // Active focus state
    loaded_data: any;
    focus_state: string;        // idle | active | boosted
  };
  vault: {
    search_results: any[];      // Latest search results
    recent_files: string[];
  };
  bridges: {
    active_bridge: string | null;     // Currently restored bridge
    available_bridges: any[];
    restored_context: any;            // Bridge restoration data
  };
  middleware: {
    registered: Array<{               // Dynamic middleware
      name: string;
      condition: string;              // JavaScript condition
      actions: any[];                 // Actions to dispatch
    }>;
  };
}
```

### Middleware System

The middleware intercepts Redux actions and automatically calls appropriate MCP tools:

```typescript
// Bridge restoration workflow
if (action.type === 'bridges/restore') {
  const result = await chromaClient.callTool({
    name: 'chroma_query_documents',
    arguments: {
      collection_name: 'float_dispatch_bay',
      query_texts: [`bridge ${action.payload.bridge_id}`],
      where: { 'metadata.bridge_id': action.payload.bridge_id }
    }
  });
  
  store.dispatch({
    type: 'bridges/restore_complete',
    payload: { bridge_id: action.payload.bridge_id, context: result }
  });
}
```

## API Reference

### Tools

#### `float_dispatch`

Dispatch Redux actions to the Float system.

```typescript
{
  name: "float_dispatch",
  arguments: {
    action: {
      type: string;           // Redux action type
      payload?: any;          // Action payload
    }
  }
}
```

**Examples:**
```javascript
// Load context
{ type: "context/load", payload: { context: "project-alpha" } }

// Bridge restoration  
{ type: "bridges/restore", payload: { bridge_id: "CB-20250612-1738-M3F7" } }

// Brain focus boost
{ type: "brain/boost_focus", payload: { reason: "user_mentioned_urgent" } }
```

#### `middleware_register`

Register middleware from natural language descriptions.

```typescript
{
  name: "middleware_register",
  arguments: {
    description: string;      // Natural language middleware description
  }
}
```

**Examples:**
```javascript
// Context loading
"When someone mentions airbender, load avatar context and check for outstanding issues"

// Search automation
"When actions contain burp, search chroma and structure response"

// Bridge workflows
"When bridge restore actions happen, search chroma for bridge data and load context"
```

#### `state_get`

Retrieve current Redux state.

```typescript
{
  name: "state_get",
  arguments: {}
}
```

Returns complete Float system state including contexts, brain focus, vault status, and active bridges.

## Examples

### Bridge Restoration Workflow

```javascript
// 1. Dispatch bridge restoration
await float_dispatch({
  type: "bridges/restore",
  payload: { bridge_id: "CB-20250612-1738-M3F7" }
});

// 2. Middleware automatically:
//    - Calls chroma_query_documents
//    - Searches for bridge metadata
//    - Dispatches bridges/restore_complete
//    - Updates Redux state

// 3. Check results
const state = await state_get();
console.log(state.bridges.active_bridge);        // "CB-20250612-1738-M3F7" 
console.log(state.bridges.restored_context);     // Chroma query results
```

### Natural Language Middleware

```javascript
// Register context automation
await middleware_register({
  description: "When users mention React, load react-patterns context and boost focus"
});

// Now any action mentioning React triggers:
await float_dispatch({
  type: "user/message", 
  payload: { text: "I need help with React hooks" }
});
// → Automatically loads react-patterns context
// → Boosts brain focus for React-related queries
```

### Multi-Tool Orchestration

```javascript
// Register complex workflow
await middleware_register({
  description: "When vault search completes, update brain context and log search patterns"
});

// Single dispatch triggers multi-tool chain
await float_dispatch({
  type: "vault/search",
  payload: { query: "typescript patterns" }
});
// → Searches vault
// → Updates brain context with results  
// → Logs search patterns for analysis
// → All coordinated through Redux middleware
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run basic functionality tests
node test-mcp.cjs

# Test bridge restoration
node test-bridge.cjs

# Test middleware execution
node test-middleware.cjs
```

### Logging

Float Redux MCP uses Pino for structured logging. Logs are output to stderr in JSONL format:

```bash
# View logs with jq
node dist/index.js 2>&1 | jq -r '[.time, .level, .msg] | @tsv'

# Filter for errors
node dist/index.js 2>&1 | jq 'select(.level >= 50)'
```

## Integration

### Connecting to Chroma

Float Redux MCP automatically connects to a Chroma MCP server:

```typescript
const chromaTransport = new StdioClientTransport({
  command: '/Users/evan/.local/bin/uvx',
  args: [
    'chroma-mcp',
    '--client-type', 'persistent', 
    '--data-dir', '/Users/evan/github/chroma-data/'
  ]
});
```

### Adding More MCP Servers

Extend the `initializeMCPClients()` function:

```typescript
// Add Obsidian MCP
const obsidianClient = new Client({...});
await obsidianClient.connect(obsidianTransport);
mcpClients['obsidian'] = obsidianClient;

// Use in middleware
if (action.type === 'vault/update') {
  await mcpClients['obsidian'].callTool({...});
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Philosophy

> "Redux boilerplate is annoying for humans, but context goldmine for LLMs"

Float Redux MCP embraces Redux's verbosity as a feature, not a bug. The explicit action types and structured state transitions provide rich context for AI systems to understand and orchestrate complex workflows automatically.

---

**Built with ❤️ for the Float ecosystem**