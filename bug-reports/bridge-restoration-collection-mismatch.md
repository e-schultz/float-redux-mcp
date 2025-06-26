# Bug Report: Bridge Restoration Collection Mismatch

**Issue ID**: bridge-restoration-collection-mismatch  
**Bridge Diagnostic**: `bridge::restore_incomplete_20250626`  
**Priority**: High  
**Status**: Confirmed Bug  
**Labels**: `bug`, `priority-high`, `bridge-system`, `chroma`, `confirmed-bug`

## Summary

Bridge restoration fails because middleware queries the wrong Chroma collection. The bridge exists in `float_continuity_anchors` but middleware searches `float_dispatch_bay`, resulting in empty query results.

## Environment

- **Test Mode**: float-redux (vault off)
- **MCP Daemon**: Claude Desktop  
- **Float Daemon**: float-redux → evna (renaming pending)
- **Bridge ID**: CB-20250626-1045-MCPT
- **Expected Collection**: `float_continuity_anchors`
- **Actual Collection Queried**: `float_dispatch_bay`

## Root Cause Analysis

### Bridge Data in Chroma
```json
{
  "collection_name": "float_continuity_anchors",
  "ids": ["bridge::mcp_tools_calling_tools_20250626"],
  "documents": ["# MCP Tools Calling MCP Tools Implementation Bridge - CB-20250626-1045-MCPT..."],
  "metadatas": [{
    "bridge_id": "CB-20250626-1045-MCPT",
    "created": "2025-06-26",
    "bridge_type": "complete",
    "session": "mcp_architecture_development"
  }]
}
```

### Middleware Query (Incorrect)
```javascript
// src/index.ts line ~175
const result = await mcpClients['chroma'].callTool({
  name: 'chroma_query_documents',
  arguments: {
    collection_name: 'float_dispatch_bay',  // ❌ WRONG COLLECTION
    query_texts: [`bridge ${action.payload.bridge_id}`, action.payload.bridge_id],
    where: { 'metadata.bridge_id': action.payload.bridge_id }
  }
});
```

### Expected Behavior
```javascript
float_dispatch({
  type: "bridges/restore", 
  payload: { bridge_id: "CB-20250626-1045-MCPT" }
})
// Should result in:
// 1. Middleware intercepts action ✅
// 2. Queries float_continuity_anchors collection ❌ (queries wrong collection)
// 3. Finds bridge document and metadata ❌ (empty results)
// 4. Updates Redux state with restored context ❌ (no data to restore)
```

### Actual Behavior
```javascript
// Middleware executes but gets empty results:
{
  "ids": [[], []],
  "documents": [[], []], 
  "metadatas": [[], []],
  "distances": [[], []]
}
// Redux state remains empty:
{
  "bridges": {
    "active_bridge": null,           // Should be "CB-20250626-1045-MCPT"
    "restored_context": null         // Should contain bridge document
  }
}
```

## Fix Required

### Code Change
Update `src/index.ts` around line 175 in the `floatMCPMiddleware` function:

```javascript
// BEFORE (incorrect):
collection_name: 'float_dispatch_bay'

// AFTER (correct):
collection_name: 'float_continuity_anchors'
```

### Complete Fix Context
```javascript
// Handle bridge restore with Chroma lookup
if (action.type === 'bridges/restore' && action.payload?.bridge_id) {
  logger.info({ bridgeId: action.payload.bridge_id }, 'Bridge restore action detected');
  
  if (!mcpClients['chroma']) {
    logger.error('Chroma MCP client not available for bridge restore');
    return next(action);
  }
  
  try {
    logger.debug({ bridgeId: action.payload.bridge_id }, 'Calling Chroma MCP for bridge lookup');
    const result = await mcpClients['chroma'].callTool({
      name: 'chroma_query_documents',
      arguments: {
        collection_name: 'float_continuity_anchors', // ✅ FIXED
        query_texts: [`bridge ${action.payload.bridge_id}`, action.payload.bridge_id],
        where: {
          'metadata.bridge_id': action.payload.bridge_id
        },
        n_results: 10
      }
    });
    
    logger.info({ bridgeId: action.payload.bridge_id, result: typeof result }, 'Bridge context restored from Chroma');
    
    store.dispatch({
      type: 'bridges/restore_complete',
      payload: {
        bridge_id: action.payload.bridge_id,
        context: result
      }
    });
  } catch (error) {
    logger.error({ error, action }, 'Bridge restore failed');
  }
}
```

## Testing Steps

### 1. Verify Bridge Exists
```bash
# Direct Chroma query to confirm bridge exists
chroma_query_documents \
  --collection_name float_continuity_anchors \
  --query_texts "CB-20250626-1045-MCPT" \
  --where '{"bridge_id": "CB-20250626-1045-MCPT"}'
```

### 2. Test Fix
```bash
# Build with fix
npm run build

# Test bridge restoration
node test-final-state.cjs
```

### 3. Expected Success Output
```
🎯 BRIDGE RESTORATION RESULTS:
Active Bridge: CB-20250626-1045-MCPT
Restored Context: YES
✅ MCP TOOLS→TOOLS PATTERN WORKING! 🚀
```

## Impact

### Before Fix
- Bridge restoration always fails with empty results
- MCP tools→tools pattern appears broken
- Redux state never populated with bridge context
- Core Float Redux MCP functionality non-functional

### After Fix  
- Bridge restoration works for bridges in `float_continuity_anchors`
- MCP tools→tools pattern validated and functional
- Redux state properly hydrated with bridge context
- Full Float Redux MCP workflow operational

## Reproduction

1. Start Float Redux MCP server
2. Ensure bridge `CB-20250626-1045-MCPT` exists in `float_continuity_anchors`
3. Dispatch: `{type: "bridges/restore", payload: {bridge_id: "CB-20250626-1045-MCPT"}}`
4. Observe empty results due to wrong collection query
5. Apply fix and test again

## Related Issues

- Collection name standardization across Float ecosystem
- Bridge ID format consistency
- Chroma collection management patterns

---

**This is a simple one-line fix that will immediately resolve the bridge restoration failure and validate the core MCP tools→tools architecture pattern.**