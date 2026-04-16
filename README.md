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

---

## Getting Started

**You don't build this yourself. Your agent builds it for you.**

Forward this repo link to your AI agent (Claude, ChatGPT, Cursor, OpenClaw — whatever you use) with the following instruction:

---

> **Prompt to give your agent:**
>
> "Read the MCPme repo at https://github.com/Jkahn-tr/mcpme and build my personal context portfolio. Use everything you already know about me from our conversation history, memory files, and any context you have access to. Fill out all 10 portfolio files. Where you're uncertain, make your best inference and flag it so I can correct it. Once the files are drafted, set up the MCP server locally and walk me through deploying it remotely with authentication enabled."

---

Your agent knows you better than you think. It has your conversation history, your preferences, your projects. Let it do the work. You review and correct — that's it.

**What good agents will do:**
- Pull from memory files, past conversations, and any stored context
- Draft all 10 files without asking you to fill out forms
- Flag gaps or uncertain inferences for your review
- Set up the server, generate a secure token, and walk you through Railway deployment
- Keep the portfolio updated over time as your projects and priorities shift

---

## Security

**Authentication is required for remote deployment. This is not optional.**

The portfolio files contain real context about you — your projects, your team, your priorities. Without auth, anyone with the URL can read them.

- **Local (stdio):** No auth required. Only your machine talks to it.
- **Remote (HTTP/SSE):** `MCP_TOKEN` env var must be set. Every request requires `Authorization: Bearer <token>`. Your agent will generate this for you.
- **The portfolio is context, not credentials.** Do not put passwords, API keys, or tokens in these files. Credentials belong in a password manager or secrets vault — not here.

Your agent should enforce this automatically. If it tries to deploy without setting a token, stop it and tell it to add auth first.

---

## Design Principles

- **Markdown-first** — every AI on earth can read it; no special format required
- **Modular, not monolithic** — separate files for separate concerns; agents grab what's relevant
- **Living, not static** — update it as you change; your agents maintain it over time
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

Each file contains an embedded interview protocol in an HTML comment at the top — for cases where you want to guide your agent through the process file by file.

---

## License

MIT. Fork it, customize it, make it yours.
