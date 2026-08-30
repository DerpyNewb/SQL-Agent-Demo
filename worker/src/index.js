import Anthropic from '@anthropic-ai/sdk';
import { validateSelectOnly } from './validateSql.js';

const MODEL_ID = 'claude-opus-5';

const SCHEMA_DESCRIPTION = `
products(id INTEGER, name TEXT, category TEXT, price REAL)
orders(id INTEGER, product_id INTEGER -> products.id, quantity INTEGER, order_date TEXT 'YYYY-MM-DD', customer TEXT)
`.trim();

const SYSTEM_PROMPT = `You are a data analyst assistant answering questions about a small demo SQLite database.

Schema:
${SCHEMA_DESCRIPTION}

Always use the run_select_query tool to look up data before answering — never guess numbers.
Only ever write a single SELECT statement. After you see the query results, give a short, direct
natural-language answer to the user's question.`;

const TOOL_DEF = {
  name: 'run_select_query',
  description: 'Execute a single read-only SELECT query against the demo database and return the resulting rows.',
  input_schema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'A single SELECT statement.' },
    },
    required: ['sql'],
  },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function runAgent(question, env) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const messages = [{ role: 'user', content: question }];
  let sqlUsed = null;
  let rows = null;

  for (let i = 0; i < 3; i++) {
    const response = await client.messages.create({
      model: MODEL_ID,
      // ponytail: deliberately low — cost cap for a publicly-linked demo, not
      // a truncation-avoidance default. Raise if answers start hitting max_tokens.
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [TOOL_DEF],
      messages,
    });

    if (response.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: response.content });
      continue;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find((b) => b.type === 'tool_use');
      messages.push({ role: 'assistant', content: response.content });

      const validation = validateSelectOnly(toolUse.input.sql);
      let toolResult;
      if (!validation.ok) {
        toolResult = `Error: ${validation.reason}`;
      } else {
        sqlUsed = validation.sql;
        try {
          const { results } = await env.DB.prepare(sqlUsed).all();
          rows = results;
          toolResult = JSON.stringify(results).slice(0, 4000);
        } catch (e) {
          toolResult = `SQL error: ${e.message}`;
        }
      }

      messages.push({
        role: 'user',
        content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: toolResult }],
      });
      continue;
    }

    const answer = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    return { answer, sql: sqlUsed, rows };
  }

  return { answer: "Sorry, I couldn't finish that query in time.", sql: sqlUsed, rows };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/run') {
      return new Response('Not found', { status: 404, headers: CORS_HEADERS });
    }

    let question;
    try {
      ({ question } = await request.json());
    } catch {
      return new Response('Invalid JSON body', { status: 400, headers: CORS_HEADERS });
    }
    if (!question || typeof question !== 'string') {
      return new Response('Missing "question" string', { status: 400, headers: CORS_HEADERS });
    }

    try {
      const result = await runAgent(question, env);
      return new Response(JSON.stringify(result), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      const jsonHeaders = { ...CORS_HEADERS, 'Content-Type': 'application/json' };
      if (e instanceof Anthropic.RateLimitError) {
        return new Response(JSON.stringify({ error: 'Rate limited — try again in a moment.' }), {
          status: 429,
          headers: jsonHeaders,
        });
      }
      if (e instanceof Anthropic.APIError) {
        return new Response(JSON.stringify({ error: `Claude API error: ${e.message}` }), {
          status: 502,
          headers: jsonHeaders,
        });
      }
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: jsonHeaders });
    }
  },
};
