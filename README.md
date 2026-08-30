# SQL Query Agent

Ask a plain-English question, watch Claude write and run the SQL live against a small
demo dataset, and get a natural-language answer back. Built as a portfolio piece to
demonstrate SQL + agent/tool-use design (data-analyst / AI-engineer roles) without
relying on any NDA'd work.

## Architecture

```
frontend/index.html  (static, GitHub Pages)
        │ fetch()
        ▼
worker/src/index.js  (Cloudflare Worker, holds ANTHROPIC_API_KEY)
        │ tool call: run_select_query
        ▼
Cloudflare D1  (demo SQLite: products, orders)
```

The browser never talks to the Claude API directly — the Worker holds the secret key
and does the actual SQL execution, after checking the generated query is a single
SELECT statement (see `worker/src/validateSql.js`).

## Setup

1. **Install & auth**
   ```
   cd worker
   npm install
   npx wrangler login
   ```

2. **Create the D1 database**
   ```
   npx wrangler d1 create sql-agent-demo-db
   ```
   Copy the returned `database_id` into `wrangler.toml`.

3. **Load the schema + seed data**
   ```
   npx wrangler d1 execute sql-agent-demo-db --remote --file=schema.sql
   ```

4. **Set your Anthropic API key as a secret** (never goes in code or the repo)
   ```
   npx wrangler secret put ANTHROPIC_API_KEY
   ```

5. **Deploy the Worker**
   ```
   npx wrangler deploy
   ```
   Note the `*.workers.dev` URL it prints.

6. **Wire up the frontend**
   Edit `frontend/index.html`, replace `WORKER_URL` with `https://<your-worker>.workers.dev/run`.

7. **Publish the frontend on GitHub Pages**
   Push this repo to GitHub, then in Settings → Pages, set the source to the
   `frontend/` folder (or move `index.html` to repo root if you'd rather serve
   from `/`).

8. **Before sharing the link publicly: rate-limit it.**
   This endpoint calls a paid API with no auth in front of it. In the Cloudflare
   dashboard, add a WAF rate-limiting rule on the Worker's route (e.g. cap requests
   per IP per minute) — this is a free built-in feature, no code needed. Skipping
   this step means anyone with the link can run up your API bill.

## Local check

```
cd worker
npm test
```
Runs `validateSql.test.mjs`, which asserts the SELECT-only guard actually blocks
`DROP`/`UPDATE`/stacked statements and allows normal `SELECT`s.

## Known ceiling

`validateSql.js` is a keyword-blocklist guard, not a real SQL parser — good enough
for a demo dataset with nothing sensitive in it. If this ever fronts real data, swap
in a proper SQL parser (e.g. `node-sql-parser`) to validate the query's AST instead
of pattern-matching the string.
