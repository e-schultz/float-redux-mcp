# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Float Redux MCP project.

## Project Context

Float Redux MCP is a breakthrough implementation that proves **Redux can serve as a universal coordination layer for AI workflows**. This project emerged from a late-night coding session (built in ~1 hour!) that validated the "Redux for AI" concept.

### Core Innovation

The key insight: **LLMs as fuzzy compilers** can transform natural language into Redux middleware patterns, enabling declarative AI workflows instead of imperative tool chaining.

```typescript
// Instead of: Manual tool orchestration
const result1 = await tool1();
const result2 = await tool2(result1);
const result3 = await tool3(result2);

// We get: Declarative dispatch with automatic orchestration
dispatch({ type: "workflow/execute", payload: { context: "user_intent" } });
// → Middleware handles the entire tool chain automatically
```

## Architecture Decisions

### Redux Store Design

The store is organized around AI system concerns rather than traditional UI state:

- **contexts**: Active AI contexts and hierarchies
- **brain**: Focus state and cognitive load management  
- **vault**: Knowledge retrieval and search state
- **bridges**: Cross-session continuity and context restoration
- **middleware**: Dynamic workflow patterns registered at runtime

### MCP Integration Pattern

The project implements the **MCP tools→tools pattern**:

1. Float Redux MCP server receives actions via `float_dispatch`
2. Redux middleware intercepts actions and calls other MCP servers (Chroma, Obsidian, etc.)
3. Results flow back through the middleware to update Redux state
4. Complex workflows emerge from simple action dispatches

### Natural Language Compilation

Two-tier compilation system:

1. **Regex patterns** for common, fast parsing
2. **Ollama fallback** for complex natural language using structured output

```typescript
// Fast path: Regex recognition
/when.*mentions?\s+(\w+).*load\s+(\w+)\s+context/i

// Slow path: LLM compilation with Zod schemas
const middleware = await ollama.chat({
  messages: [{ role: 'user', content: naturalLanguageDescription }],
  format: 'json'
});
```

## Development Patterns

### Logging Strategy

Uses Pino for structured JSONL logging to stderr, ensuring JSON-RPC protocol remains clean:

```typescript
const logger = pino({
  name: 'float-redux-mcp',
  level: 'debug'  
}, process.stderr);
```

**Key logging points:**
- MCP client connections
- Middleware execution flow
- Tool call success/failure
- State transitions

### Error Handling

Graceful degradation pattern: If Chroma or other MCP servers fail, Float Redux continues operating with reduced functionality rather than crashing.

### Testing Approach

Three-tier testing strategy:

1. **Basic MCP functionality** (`test-mcp.cjs`)
2. **Middleware execution** (`test-middleware.cjs`) 
3. **End-to-end workflows** (`test-bridge.cjs`)

## Extending the System

### Adding New MCP Servers

1. Add client initialization in `initializeMCPClients()`
2. Add middleware conditions in `floatMCPMiddleware`
3. Update state slices if new data types needed

### Creating New Middleware Patterns

Two approaches:

**Programmatic:**
```typescript
store.dispatch({
  type: 'middleware/register',
  payload: {
    name: 'custom_workflow',
    condition: 'action.type.includes("custom")',
    actions: [/* Redux actions to dispatch */]
  }
});
```

**Natural Language:**
```typescript
await client.callTool({
  name: 'middleware_register',
  arguments: {
    description: "When users ask about documentation, search vault and prepare context"
  }
});
```

### State Management Guidelines

- **Actions should be descriptive**: `bridges/restore` not `restore`
- **Payloads should be structured**: Include all necessary context
- **Middleware should be idempotent**: Safe to run multiple times
- **State updates should be atomic**: Complete workflows in single state updates

## Integration with Float Ecosystem

### Float Dropzone Integration

Float Redux MCP operates within the larger Float workspace:

```
/Users/evan/projects/float-workspace/
├── tools/float-redux-mcp/     # This project
├── operations/float-dropzone/ # Daily processing logs
└── shared/vault/              # Obsidian knowledge base
```

### Bridge System Integration

Bridges are cross-session continuity anchors stored in Chroma with metadata:

```typescript
{
  bridge_id: "CB-20250612-1738-M3F7",
  metadata: {
    session_id: "...",
    timestamp: "...", 
    context_type: "development",
    // ... other metadata
  }
}
```

### Obsidian Vault Integration

Future integration will enable:
- Automatic note creation from bridge restorations
- Vault search through Redux actions
- Knowledge graph updates via middleware

## Debugging Guidelines

### MCP Connection Issues

1. Check stderr logs for connection status
2. Verify MCP server processes are running
3. Test with isolated server connections

### Middleware Not Executing

1. Verify middleware registration: Check `state.middleware.registered`
2. Test action matching: Use console debug in middleware
3. Check async operation completion: Add timing logs

### State Management Issues

1. Use `state_get` tool to inspect current state
2. Check action types match exactly (case sensitive)
3. Verify payload structure matches slice expectations

## Performance Considerations

### Ollama Integration

- **Cold start**: First Ollama call ~2-3 seconds
- **Warm requests**: Subsequent calls ~200-500ms
- **Fallback strategy**: Always provide regex patterns for common cases

### MCP Tool Chains

- **Tool calls are async**: Don't block Redux dispatch
- **Batch operations**: Group related tool calls when possible
- **Cache results**: Store frequently accessed data in Redux state

## Future Development

### Roadmap Priorities

1. **Enhanced middleware compilation**: Better natural language → Redux patterns
2. **Multi-MCP orchestration**: Obsidian + Linear + Email workflows
3. **Performance optimization**: Connection pooling, caching strategies
4. **Error recovery**: Retry logic, graceful fallbacks

### Extension Points

- **Custom middleware compilers**: Plugin system for domain-specific patterns
- **State persistence**: Redux-persist integration for cross-session state
- **Metrics and analytics**: Usage patterns, performance monitoring
- **UI integration**: Real-time state visualization

## Security Considerations

- **Ollama isolation**: Local LLM prevents prompt injection risks
- **MCP sandboxing**: Each MCP server runs in isolated process
- **Input validation**: Zod schemas validate all action payloads
- **No secrets in state**: Keep authentication tokens out of Redux store

## Philosophy

> "Redux boilerplate is annoying for humans, but context goldmine for LLMs"

This project embraces Redux's verbosity as a feature for AI systems. The explicit action types, predictable state updates, and middleware patterns provide rich semantic context that LLMs can leverage for intelligent workflow automation.

### Design Principles

1. **Explicit over implicit**: Clear action types over magic
2. **Composable workflows**: Small, reusable middleware patterns
3. **Observable state**: Every change logged and traceable
4. **Declarative intent**: What you want, not how to get it
5. **Graceful degradation**: System remains functional with reduced capabilities

---

**Remember**: This isn't just Redux with AI tools bolted on. It's a fundamental reimagining of how AI systems can coordinate complex workflows through declarative state management.

The magic isn't in the individual tools—it's in the emergent behaviors that arise when LLMs can understand and orchestrate Redux patterns automatically. 🧠✨