# MCPme — Personal Context Portfolio Server

> Stop re-explaining yourself to every AI you work with.

MCPme is an MCP server that exposes your personal context as machine-readable resources. Build it once. Any AI agent, tool, or system that speaks MCP can instantly know who you are, how you work, and what you're working on — without you repeating yourself.

**Inspired by:** [AI Daily Brief — "How to Build a Personal Context Portfolio and MCP Server"](https://open.spotify.com/episode/797ZsDBqYUStrxzXh70ifA) by NLW

---

## What It Is

10 markdown files. Each one captures a different dimension of who you are:

| File | What it captures |
|---|---|
| `identity.md` | Who you are — the one file an AI reads if it can only read one |
| `roles-and-responsibilities.md` | What your job actually involves (not your job description) |
| `current-projects.md` | Active workstreams, status, priority, what done looks like |
| `team-and-relationships.md` | Key people, how you interact, what they need from you |
| `tools-and-systems.md` | Your stack — what you use, how it's configured |
| `communication-style.md` | How you write and how you want things written for you |
| `goals-and-priorities.md` | What you're optimizing for and what you're deliberately ignoring |
| `preferences-and-constraints.md` | Hard rules and strong opinions any AI should respect |
| `domain-knowledge.md` | What you know that a general-purpose AI doesn't |
| `decision-log.md` | How you make decisions, with real examples |

Each file has an embedded **interview protocol** — questions you can hand to Claude, ChatGPT, or any AI to help you fill it out conversationally.

---

## Getting Started

### Step 1 — Fill out your portfolio

Each `.md` file in `/portfolio` contains interview questions in an HTML comment at the top. Use them:

1. Open a new Claude or ChatGPT conversation
2. Paste the interview questions from any file
3. Let the AI interview you and draft the file
4. Edit until it feels right
5. Repeat for all 10 files

### Step 2 — Run locally (Claude Desktop)

```bash
git clone https://github.com/Jkahn-tr/mcpme.git
cd mcpme
```

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "my-context": {
      "command": "node",
      "args": ["/path/to/mcpme/server.js"]
    }
  }
}
```

Restart Claude Desktop. Your context is now available to every Claude conversation.

### Step 3 — Deploy remotely (optional)

For access from any device or agent:

```bash
# Generate a secure token (required for remote deployment)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run with auth enabled
MCP_TOKEN=your-token-here PORT=3100 node server.js --sse
```

**Deploy to Railway:**
1. Fork this repo
2. Connect to [Railway](https://railway.com) → New Project → Deploy from GitHub
3. Set environment variables:
   - `MCP_TOKEN` = your generated token (required)
   - `PORT` = Railway sets this automatically
4. Your MCP server is live at `https://your-app.up.railway.app/mcp`

---

## Security

**Authentication is required for remote deployment.** This is not optional.

The portfolio files contain real context about you — your projects, your team, your priorities. Without auth, anyone with the URL can read them.

- **Local (stdio):** No auth required. Only your machine talks to it.
- **Remote (HTTP/SSE):** `MCP_TOKEN` env var must be set. Every request requires `Authorization: Bearer <token>`.
- **The portfolio is context, not credentials.** Do not put passwords, API keys, or tokens in these files. Use a password manager for those.

**To connect a remote MCP client:**
```
Authorization: Bearer your-token-here
POST https://your-app.up.railway.app/mcp
```

---

## Design Principles

- **Markdown-first** — every AI on earth can read it, no special format required
- **Modular, not monolithic** — separate files for separate concerns; agents grab what's relevant
- **Living, not static** — update it as you change; your agents can help maintain it
- **Portable** — works with Claude, ChatGPT, Cursor, OpenClaw, or anything that speaks MCP

---

## File Structure

```
mcpme/
├── README.md               ← you are here
├── server.js               ← the MCP server
├── package.json
└── portfolio/
    ├── identity.md
    ├── roles-and-responsibilities.md
    ├── current-projects.md
    ├── team-and-relationships.md
    ├── tools-and-systems.md
    ├── communication-style.md
    ├── goals-and-priorities.md
    ├── preferences-and-constraints.md
    ├── domain-knowledge.md
    └── decision-log.md
```

---

## License

MIT. Fork it, customize it, make it yours.
