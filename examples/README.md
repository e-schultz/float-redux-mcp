# Float Redux MCP Examples

This directory contains working examples demonstrating the key capabilities of Float Redux MCP.

## Prerequisites

1. Build the project:
   ```bash
   cd .. && npm run build
   ```

2. Ensure Chroma MCP is available:
   ```bash
   uvx chroma-mcp --help
   ```

## Examples

### 1. Bridge Restoration (`bridge-restoration.js`)

**What it demonstrates:**
- Core MCP tools→tools pattern
- Automatic Chroma integration
- Redux state management for AI workflows

**How to run:**
```bash
node bridge-restoration.js
```

**Expected output:**
```
🌉 Float Redux MCP - Bridge Restoration Example
✅ SUCCESS: MCP tools→tools pattern working!
   Active Bridge: CB-20250612-1738-M3F7
   Context Restored: YES
```

**What happens internally:**
1. `float_dispatch({type: "bridges/restore", payload: {...}})` called
2. Redux middleware intercepts the action
3. Middleware automatically calls `chroma_query_documents` 
4. Results stored in `state.bridges.restored_context`
5. Full workflow completes without manual tool chaining

### 2. Natural Language Middleware (`natural-language-middleware.js`)

**What it demonstrates:**
- Natural language → Redux middleware compilation
- Dynamic workflow registration
- Automatic trigger conditions

**How to run:**
```bash
node natural-language-middleware.js
```

**Expected output:**
```
🧠 Float Redux MCP - Natural Language Middleware Example
✅ Middleware registered: react_context_loader
✅ SUCCESS: Natural language middleware working!
```

**What happens internally:**
1. Natural language description parsed by regex/Ollama
2. Middleware registered with condition matching logic
3. Test action dispatched that matches conditions
4. Middleware automatically executes specified actions
5. State updates reflect the automated workflow

## Understanding the Output

### Successful Bridge Restoration
When bridge restoration works, you'll see:
- `Active Bridge: [bridge-id]` - The bridge was found and activated
- `Context Restored: YES` - Chroma data was successfully retrieved
- Chroma query results in the restored context

### Successful Middleware Registration
When middleware registration works, you'll see:
- Middleware name (auto-generated from description)
- Condition or pattern that triggers it
- Number of actions it will execute
- State changes when the middleware triggers

## Troubleshooting

### "No context restored" 
- Check that Chroma MCP server is accessible
- Verify the bridge ID exists in your Chroma database
- Look at stderr logs for connection errors

### "Middleware registered but didn't trigger"
- Check that the action type/payload matches the middleware condition
- Try simpler patterns first (e.g., exact string matches)
- Enable debug logging to see middleware evaluation

### Connection timeouts
- Increase wait times in the examples
- Check that no other processes are using the Chroma database
- Verify MCP server processes start successfully

## Extending the Examples

### Adding Your Own Bridge IDs
Replace `CB-20250612-1738-M3F7` with bridge IDs from your own Chroma database:

```javascript
await sendRequest('tools/call', {
  name: 'float_dispatch',
  arguments: {
    action: {
      type: 'bridges/restore',
      payload: { bridge_id: 'YOUR-BRIDGE-ID' }
    }
  }
});
```

### Creating Custom Middleware
Experiment with different natural language descriptions:

```javascript
// Context automation
"When users mention Python, load python-patterns and boost focus"

// Search workflows  
"When vault search completes, update brain context and log patterns"

// Complex conditions
"When actions contain error or failure, create issue and notify team"
```

### Testing Different Action Types
Try dispatching various action types to see middleware behavior:

```javascript
// Context management
{ type: "context/load", payload: { context: "project-alpha" } }

// Brain state
{ type: "brain/boost_focus", payload: { reason: "urgent_request" } }

// Vault operations
{ type: "vault/search", payload: { query: "typescript patterns" } }
```

## Next Steps

After running these examples:

1. **Explore the codebase**: Look at `src/index.ts` to understand the implementation
2. **Check the logs**: Run examples with stderr visible to see detailed execution logs
3. **Integrate with your workflow**: Add Float Redux MCP to your Claude Desktop configuration
4. **Build custom patterns**: Create middleware for your specific AI workflows

## Contributing Examples

To add a new example:

1. Create a new `.js` file in this directory
2. Follow the existing pattern (MCP server startup, request helper, cleanup)
3. Document what the example demonstrates
4. Add it to this README
5. Test thoroughly before submitting

---

**Remember**: These examples showcase a fundamentally new approach to AI workflow orchestration. Instead of manually chaining tools, you're declaring intent through Redux actions and letting middleware handle the complex orchestration automatically. 🚀