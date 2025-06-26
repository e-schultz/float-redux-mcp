#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { configureStore, createSlice, PayloadAction, Middleware } from '@reduxjs/toolkit';
import { z } from 'zod';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Ollama } from 'ollama';
import pino from 'pino';

// Initialize Pino logger with file output
const logger = pino({
  name: 'float-redux-mcp',
  level: 'debug'
}, pino.destination('/Users/evan/projects/float-workspace/tools/float-redux-mcp/float-redux-mcp.jsonl'));

// Float Redux State Schema
interface FloatState {
  contexts: {
    active: string[];
    hierarchy: Record<string, string[]>;
    data: Record<string, any>;
  };
  brain: {
    current_context: any;
    loaded_data: any;
    focus_state: string;
  };
  vault: {
    search_results: any[];
    recent_files: string[];
  };
  bridges: {
    active_bridge: string | null;
    available_bridges: any[];
  };
  middleware: {
    registered: Array<{
      name: string;
      pattern?: string;
      condition?: string;
      actions: any[];
    }>;
  };
}

// Redux Slices
const contextSlice = createSlice({
  name: 'context',
  initialState: {
    active: [] as string[],
    hierarchy: {} as Record<string, string[]>,
    data: {} as Record<string, any>
  },
  reducers: {
    load: (state, action: PayloadAction<{ context: string }>) => {
      if (!state.active.includes(action.payload.context)) {
        state.active.push(action.payload.context);
      }
    },
    unload: (state, action: PayloadAction<{ context: string }>) => {
      state.active = state.active.filter(c => c !== action.payload.context);
    }
  }
});

const brainSlice = createSlice({
  name: 'brain',
  initialState: {
    current_context: null,
    loaded_data: null,
    focus_state: 'idle'
  },
  reducers: {
    boot: (state, action) => {
      state.current_context = action.payload;
      state.focus_state = 'active';
    },
    boost_focus: (state, action) => {
      state.focus_state = 'boosted';
    }
  }
});

const vaultSlice = createSlice({
  name: 'vault',
  initialState: {
    search_results: [] as any[],
    recent_files: [] as string[]
  },
  reducers: {
    search: (state, action: PayloadAction<{ query: string }>) => {
      // This now triggers middleware that calls Chroma
      state.search_results = [`Searching for: ${action.payload.query}...`];
    },
    search_complete: (state, action) => {
      // Store actual Chroma results
      state.search_results = action.payload;
    }
  }
});

const bridgeSlice = createSlice({
  name: 'bridges',
  initialState: {
    active_bridge: null as string | null,
    available_bridges: [] as any[],
    restored_context: null as any
  },
  reducers: {
    restore: (state, action) => {
      state.active_bridge = action.payload.bridge_id;
    },
    restore_complete: (state, action) => {
      state.active_bridge = action.payload.bridge_id;
      state.restored_context = action.payload.context;
    }
  }
});

const middlewareSlice = createSlice({
  name: 'middleware',
  initialState: {
    registered: [] as Array<{
      name: string;
      pattern?: string;
      condition?: string;
      actions: any[];
    }>
  },
  reducers: {
    register: (state, action) => {
      state.registered.push(action.payload);
    }
  }
});

// MCP Client connections for calling other MCP servers
const mcpClients: Record<string, Client> = {};

// Initialize MCP client connections
async function initializeMCPClients() {
  logger.info('Initializing MCP client connections');
  
  try {
    logger.debug('Creating Chroma MCP transport with uvx');
    // Connect to Chroma MCP server using same config as Claude Desktop
    const chromaTransport = new StdioClientTransport({
      command: '/Users/evan/.local/bin/uvx',
      args: [
        'chroma-mcp',
        '--client-type',
        'persistent', 
        '--data-dir',
        '/Users/evan/github/chroma-data/'
      ]
    });

    logger.debug('Creating Chroma MCP client');
    const chromaClient = new Client({
      name: 'float-redux-chroma-client',
      version: '0.1.0'
    }, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      }
    });

    logger.info('Connecting to Chroma MCP server...');
    
    // Connect client to the Chroma MCP server
    await chromaClient.connect(chromaTransport);
    
    // Wait a moment for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    mcpClients['chroma'] = chromaClient;
    logger.info('✅ Connected to Chroma MCP server successfully');

  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to Chroma MCP');
    // Continue without Chroma - graceful degradation
  }
}

// Redux middleware that intercepts actions and calls MCP tools
const floatMCPMiddleware: Middleware = store => next => async (action: any) => {
  // console.error('🔧 MIDDLEWARE CALLED:', action.type); // Remove console debug
  logger.debug({ action }, 'Middleware intercepting action');
  
  // Handle Chroma search actions
  if (action.type === 'chroma/search') {
    logger.info({ query: action.payload.query }, 'Chroma search action detected');
    
    if (!mcpClients['chroma']) {
      logger.error('Chroma MCP client not available for search');
      return next(action);
    }
    
    try {
      logger.debug('Calling Chroma MCP: chroma_query_documents');
      const result = await mcpClients['chroma'].callTool({
        name: 'chroma_query_documents',
        arguments: {
          collection_name: 'float_dispatch_bay',
          query_texts: [action.payload.query],
          n_results: 5
        }
      });
      
      logger.info({ result: typeof result }, 'Chroma search completed');
      
      // Dispatch results to store
      store.dispatch({
        type: 'vault/search_complete',
        payload: result
      });
    } catch (error) {
      logger.error({ error, action }, 'Chroma search failed');
    }
  }
  
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
          collection_name: 'float_continuity_anchors',
          query_texts: [`bridge ${action.payload.bridge_id}`, action.payload.bridge_id],
          where: {
            bridge_id: action.payload.bridge_id
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
  
  // Process registered middleware
  const state = store.getState();
  const registeredCount = state.middleware.registered.length;
  
  if (registeredCount > 0) {
    logger.debug({ registeredCount }, 'Processing registered middleware');
  }
  
  for (const middleware of state.middleware.registered) {
    let shouldTrigger = false;
    
    if (middleware.condition) {
      try {
        logger.debug({ middlewareName: middleware.name, condition: middleware.condition }, 'Evaluating middleware condition');
        // Safe eval using Function constructor
        const checkCondition = new Function('action', `return ${middleware.condition}`);
        shouldTrigger = checkCondition(action);
        
        if (shouldTrigger) {
          logger.info({ middlewareName: middleware.name }, 'Middleware condition matched - triggering actions');
        }
      } catch (e) {
        logger.error({ error: e, middlewareName: middleware.name }, 'Middleware condition eval failed');
      }
    }
    
    if (shouldTrigger) {
      for (const middlewareAction of middleware.actions) {
        logger.debug({ middlewareAction }, 'Dispatching middleware action');
        store.dispatch(middlewareAction);
      }
    }
  }
  
  return next(action);
};

// Configure Redux Store with middleware
const store = configureStore({
  reducer: {
    context: contextSlice.reducer,
    brain: brainSlice.reducer,
    vault: vaultSlice.reducer,
    bridges: bridgeSlice.reducer,
    middleware: middlewareSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(floatMCPMiddleware)
});

// Zod Schemas for MCP Tools
const DispatchActionSchema = z.object({
  type: z.string(),
  payload: z.any().optional()
});

const RegisterMiddlewareSchema = z.object({
  name: z.string(),
  pattern: z.string().optional(),
  condition: z.string().optional(),
  actions: z.array(z.any())
});

// MCP Server Setup
const server = new Server({
  name: 'float-redux-mcp',
  version: '0.1.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Tool: float.dispatch
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'float_dispatch',
        description: 'Dispatch Redux action to Float system',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                payload: { type: 'object' }
              },
              required: ['type']
            }
          },
          required: ['action']
        }
      },
      {
        name: 'middleware_register', 
        description: 'Register middleware from natural language',
        inputSchema: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description: 'Natural language description of middleware to register'
            }
          },
          required: ['description']
        }
      },
      {
        name: 'state_get',
        description: 'Get current Redux state',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    logger.debug({ toolName: name, args }, 'MCP tool called');
    
    switch (name) {
      case 'float_dispatch': {
        const { action } = args as { action: any };
        const validatedAction = DispatchActionSchema.parse(action);
        
        logger.info({ action: validatedAction }, 'Dispatching action to Redux store');
        
        // Dispatch to Redux store
        store.dispatch(validatedAction);
        
        // Get updated state
        const state = store.getState();
        
        logger.debug({ stateKeys: Object.keys(state) }, 'Redux state updated');
        
        return {
          content: [{
            type: 'text',
            text: `Dispatched: ${JSON.stringify(validatedAction, null, 2)}\n\nUpdated State: ${JSON.stringify(state, null, 2)}`
          }]
        };
      }
      
      case 'middleware_register': {
        const { description } = args as { description: string };
        
        logger.info({ description }, 'Registering middleware from natural language');
        
        // Parse natural language into middleware config
        const middleware = await parseNaturalLanguageMiddleware(description);
        
        if (middleware) {
          logger.info({ middleware }, 'Middleware parsed successfully');
          
          store.dispatch({
            type: 'middleware/register',
            payload: middleware
          });
          
          logger.debug('Middleware registered to Redux store');
          
          return {
            content: [{
              type: 'text',
              text: `🎯 Registered middleware: ${middleware.name}\nCondition: ${middleware.condition || middleware.pattern || 'always'}\nActions: ${middleware.actions.length} actions\n\nParsed via: ${middleware.condition ? 'Ollama fuzzy compiler' : 'regex pattern'}`
            }]
          };
        } else {
          logger.warn({ description }, 'Failed to parse middleware from description');
          
          return {
            content: [{
              type: 'text',
              text: `❌ Could not parse middleware from: "${description}"\n\nTry patterns like:\n- "when actions contain burp, search chroma and structure response"\n- "if someone mentions airbender, load avatar context"\n- "on bridge restore, validate and notify"`
            }]
          };
        }
      }
      
      case 'state_get': {
        const state = store.getState();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(state, null, 2)
          }]
        };
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error}`
      }],
      isError: true
    };
  }
});


// Enhanced Natural Language Middleware Parser with Ollama
async function parseNaturalLanguageMiddleware(text: string): Promise<any | null> {
  // First try simple regex patterns for speed
  const quickPatterns = [
    {
      regex: /when.*mentions?\s+(\w+).*load\s+(\w+)\s+context/i,
      handler: (matches: RegExpMatchArray) => ({
        name: `${matches[1]}_context_loader`,
        pattern: `/${matches[1]}/i`,
        actions: [
          { type: 'context/load', payload: { context: matches[2] } },
          { type: 'brain/boost_focus', payload: { reason: `${matches[1]}_mentioned` } }
        ]
      })
    },
    {
      regex: /when.*actions?.*contain\s+['"]?(\w+)['"]?.*search\s+(\w+)/i,
      handler: (matches: RegExpMatchArray) => ({
        name: `${matches[1]}_${matches[2]}_middleware`,
        condition: `action.type.includes('${matches[1]}') || JSON.stringify(action.payload).includes('${matches[1]}')`,
        actions: [
          { type: `${matches[2]}/search`, payload: { query: matches[1] } },
          { type: 'brain/boost_focus', payload: { reason: `${matches[1]}_triggered` } }
        ]
      })
    }
  ];
  
  // Try quick patterns first
  for (const pattern of quickPatterns) {
    const matches = text.match(pattern.regex);
    if (matches) {
      return pattern.handler(matches);
    }
  }
  
  // Fall back to Ollama for complex natural language
  try {
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    const response = await ollama.chat({
      model: 'llama3.1', // or qwen2.5-coder if you have it
      messages: [{
        role: 'user',
        content: `Parse this natural language into Redux middleware configuration:

"${text}"

Return JSON with this exact structure:
{
  "name": "descriptive_middleware_name",
  "condition": "JavaScript condition string to match actions",
  "actions": [
    {"type": "action_type", "payload": {"key": "value"}}
  ]
}

Examples:
- "when actions contain burp" → condition: "action.type.includes('burp') || JSON.stringify(action.payload).includes('burp')"
- "if someone mentions Redux" → condition: "JSON.stringify(action).toLowerCase().includes('redux')"
- "on bridge restore" → condition: "action.type.includes('bridge') && action.type.includes('restore')"

Only return valid JSON, no explanation.`
      }],
      format: 'json',
      options: {
        temperature: 0.1 // Low temperature for consistent parsing
      }
    });
    
    return JSON.parse(response.message.content);
  } catch (error) {
    console.error('Ollama parsing failed:', error);
    return null;
  }
}

// Start Server
async function main() {
  logger.info('Starting Float Redux MCP Server');
  
  // Initialize MCP client connections
  await initializeMCPClients();
  
  logger.debug('Creating stdio transport');
  const transport = new StdioServerTransport();
  
  logger.info('Connecting MCP server to transport');
  await server.connect(transport);
  
  logger.info('✅ Float Redux MCP Server running and ready for connections');
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error in Float Redux MCP Server');
  process.exit(1);
});