---
layout: posts
title: Was Ist Pi ?
date: 2026-05-06
excerpt: Pi ... a minimal terminal agent that doesn't treat you like you need training wheels
---

> This is a WIP post. Will be evolving as I add more things.

## A Note About Minimalism

Look, unless you have been living under a particularly dense rock, you already know about AI coding agents. You have probably tried Claude Code, Cursor, Cline, GitHub Copilot, Aider, or maybe even OpenCode. Maybe you have got three of them installed and a fourth running in a Docker container "just in case."

Here's the thing though: **they all have the same problem.** They are bloated. Opinionated. And they make decisions for you that you didn't ask them to make.

Even OpenCode... which, don't get me wrong, is a cool project... locks you into developer workflows you might not want. It's like buying a car and finding out the manufacturer decided you don't need a steering wheel because "most people just go straight anyway."

### Enter Pi

Pi's thesis is simple. It ships with **seven tools**: `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`. That's it. That's the entire built-in toolkit.

No default plan mode. No sub-agents. No permission popups asking if you are *sure* you want to delete that file (you clicked the button twice, didn't you?). No MCP. No built-in todos. No background bash execution.

Mario Zechner [wrote about it](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) back in November: the features other tools bake into their core are better served as **extensions**.

**Sub-agents?** You can build them a dozen different ways, each suited to a different workflow. Spawn pi instances via tmux, write a TypeScript extension that orchestrates child sessions, or install a community package. The point is that *you choose*. The tool doesn't decide for you.

**MCP?** Mario has [a whole post](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/) arguing that CLI tools with READMEs are often the simpler, more composable answer. Pi doesn't have MCP support. If you want it, you build an extension. If you don't, there's zero overhead. No abstraction waiting to be configured at 2 AM when you are debugging why your agent won't talk to your database.

This pattern repeats everywhere. Permission gates? Build one that matches your threat model...or run in a container and skip them entirely. Background bash? Use tmux. Plan mode? A hundred-line TypeScript extension that restricts tools and parses plan steps.

Which brings me to the part that actually matters: **how you make Pi yours.**

---

## The Part Where You Actually Install Something

### Install Pi

You will need npm (Node.js) installed. I used Homebrew on my Mac and Ubuntu laptops ... your mileage may vary, but the internet has opinions about that.

```bash
npm install -g @mariozechner/pi-coding-agent
# OR:
curl -fsSL https://pi.dev/install.sh | sh
```

That's it. That's the installation. See you in the next ...

*Wait, no. Just kidding. We're not done yet.*

### Adding a Provider

Pi doesn't come with a provider because it assumes you have preferences. Maybe you are an OpenSource purist running Ollama locally. Maybe you are paying too much money already to you-know-who. Maybe you have got a llama.cpp instance running on a server in your basement (no judgment).

Here's how to add **Ollama** :

Create or edit `~/.pi/agent/models.json`:

```json
{
  "providers": {
    "ollama": {
      "api": "openai-completions",
      "apiKey": "ollama",
      "baseUrl": "http://127.0.0.1:11434/v1",
      "models": [
        {
          "_launch": true,
          "contextWindow": 262144,
          "id": "kimi-k2.6:cloud",
          "input": [
            "text",
            "image"
          ],
          "reasoning": true
        },
        {
          "_launch": true,
          "contextWindow": 202752,
          "id": "glm-5.1:cloud",
          "input": [
            "text"
          ],
          "reasoning": true
        },
        {
          "_launch": true,
          "contextWindow": 196608,
          "id": "minimax-m2.7:cloud",
          "input": [
            "text"
          ],
          "reasoning": true
        },
        {
          "_launch": true,
          "contextWindow": 1048576,
          "id": "deepseek-v4-pro:cloud",
          "input": [
            "text"
          ],
          "reasoning": true
        },
        {
          "_launch": true,
          "contextWindow": 262144,
          "id": "qwen3.5:397b-cloud",
          "input": [
            "text",
            "image"
          ],
          "reasoning": true
        }
      ]
    }
  }
}
```

For **llama.cpp** users, the structure is similar, just point the `baseUrl` to your llama.cpp server endpoint.

> **Fun fact:** Once you connect Pi to a model, you can use *it* to help you add more features. That's not circular logic, that's efficiency.

### The Folder Structure

Upon installation, Pi creates a `.pi` directory in your project root and `~/.pi/agent/` globally. Here's what my setup looks like:

```
~/.pi/agent/
├── extensions/
│   ├── ask-mode/
│   └── plan-mode/
├── skills/
├── models.json
└── settings.json
```

Extensions live in `~/.pi/agent/extensions/` for global availability, or `.pi/extensions/` for project-specific setups. See the [extensions documentation](https://github.com/badlogic/pi-mono/blob/main/docs/extensions.md) for the full breakdown.

---

## Making Pi Actually Useful (Extensions Time)

Now that you have Pi installed and connected to a model, let's talk about what makes it *yours*. The default Pi is the monk of coding agents ... no desires, no attachments, just seven tools and a dream.

But you probably want more. Here's how to add it.

### Adding Plan Mode

Plan mode is great for when you want the agent to think before it acts. Like a responsible person, basically.

The plan mode extension lives in Pi's example directory. Copy it into the auto-discovery path:

```bash
mkdir -p ~/.pi/agent/extensions/
cp -r /opt/homebrew/lib/node_modules/@mariozechner/pi-coding-agent/examples/extensions/plan-mode \
   ~/.pi/agent/extensions/
```

Restart Pi (or run `/reload` if you are fancy) and `/plan` becomes available. `Ctrl+Alt+P` toggles it.

**How it works:** When the agent produces a `Plan:` section with numbered steps, Pi extracts them, displays a checklist widget, and asks whether to execute, stay, or refine. During plan mode, only read-only tools are available (`read`, `bash`, `grep`, `find`, `ls`, `questionnaire`). Bash commands are filtered through an allowlist ... destructive stuff gets blocked.

The extension is about 300 lines of TypeScript. You can read it, understand it, and modify it if something doesn't match your workflow.

### Adding Ask Mode

Here's where things get interesting. I was enjoying Pi's minimalism and how it saves tonnes of context. But other agents have something called "ask mode" ... basically read-only tools for exploring a codebase without making changes. Just Q&A, no file modifications.

Pi doesn't ship with this. So I built it.

My ask-mode extension lives at `~/.pi/agent/extensions/ask-mode/`. Here's the structure:

```
ask-mode/
├── index.ts      # Main extension logic
├── utils.ts      # Command allowlist helpers
└── README.md     # Documentation
```

#### The Ask Mode Extension

**index.ts:**

```typescript
/**
 * Ask Mode Extension
 *
 * Read-only Q&A mode for safe codebase exploration.
 * Use /ask to enter ask mode and /agent to return to normal agent mode.
 *
 * Features:
 * - /ask command to enter read-only Q&A mode
 * - /agent command to return to full tool access
 * - --ask flag to start in ask mode
 * - Bash restricted to allowlisted read-only commands
 * - Injects hidden system instructions during ask mode
 * - Footer status indicator matching plan mode style
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { TextContent } from "@mariozechner/pi-ai";
import { isSafeCommand } from "./utils.js";

// Tools
const ASK_MODE_TOOLS = ["read", "bash", "grep", "find", "ls"];
const NORMAL_MODE_TOOLS = ["read", "bash", "edit", "write"];

export default function askModeExtension(pi: ExtensionAPI): void {
	let askModeEnabled = false;

	pi.registerFlag("ask", {
		description: "Start in ask mode (read-only Q&A)",
		type: "boolean",
		default: false,
	});

	function updateStatus(ctx: ExtensionContext): void {
		if (askModeEnabled) {
			ctx.ui.setStatus("ask-mode", ctx.ui.theme.fg("warning", "⏸ ask"));
		} else {
			ctx.ui.setStatus("ask-mode", undefined);
		}
	}

	function persistState(): void {
		pi.appendEntry("ask-mode", {
			enabled: askModeEnabled,
		});
	}

	function enableAskMode(ctx: ExtensionContext): void {
		askModeEnabled = true;
		pi.setActiveTools(ASK_MODE_TOOLS);
		ctx.ui.notify(`Ask mode enabled. Tools: ${ASK_MODE_TOOLS.join(", ")}`);
		updateStatus(ctx);
		persistState();
	}

	function disableAskMode(ctx: ExtensionContext): void {
		askModeEnabled = false;
		pi.setActiveTools(NORMAL_MODE_TOOLS);
		ctx.ui.notify("Ask mode disabled. Full access restored.");
		updateStatus(ctx);
		persistState();
	}

	pi.registerCommand("ask", {
		description: "Enter ask mode (read-only Q&A)",
		handler: async (_args, ctx) => {
			if (askModeEnabled) {
				ctx.ui.notify("Already in ask mode", "info");
				return;
			}
			enableAskMode(ctx);
		},
	});

	pi.registerCommand("agent", {
		description: "Return to normal agent mode (full tool access)",
		handler: async (_args, ctx) => {
			if (!askModeEnabled) {
				ctx.ui.notify("Already in agent mode", "info");
				return;
			}
			disableAskMode(ctx);
		},
	});

	// Block destructive bash commands in ask mode
	pi.on("tool_call", async (event) => {
		if (!askModeEnabled || event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!isSafeCommand(command)) {
			return {
				block: true,
				reason: `Ask mode: command blocked (not allowlisted). Use /agent to exit ask mode first.\nCommand: ${command}`,
			};
		}
	});

	// Filter out stale ask mode context when not in ask mode
	pi.on("context", async (event) => {
		if (askModeEnabled) return;

		return {
			messages: event.messages.filter((m) => {
				const msg = m as { customType?: string; role?: string; content?: unknown };
				if (msg.customType === "ask-mode-context") return false;
				if (msg.role !== "user") return true;

				const content = msg.content;
				if (typeof content === "string") {
					return !content.includes("[ASK MODE ACTIVE]");
				}
				if (Array.isArray(content)) {
					return !content.some(
						(c) => c.type === "text" && (c as TextContent).text?.includes("[ASK MODE ACTIVE]"),
					);
				}
				return true;
			}),
		};
	});

	// Inject ask mode context before agent starts
	pi.on("before_agent_start", async () => {
		if (!askModeEnabled) return;

		return {
			message: {
				customType: "ask-mode-context",
				content: `[ASK MODE ACTIVE]
You are in ask mode — a read-only Q&A mode for safe codebase exploration.

Restrictions:
- You can only use: read, bash, grep, find, ls
- You CANNOT use: edit, write (file modifications are disabled)
- Bash is restricted to an allowlist of read-only commands

Answer the user's question about the codebase or files.
Do NOT propose or perform any edits.
If the user wants to make changes, suggest switching to agent mode with /agent.`,
				display: false,
			},
		};
	});

	// Restore state on session start/resume
	pi.on("session_start", async (_event, ctx) => {
		if (pi.getFlag("ask") === true) {
			askModeEnabled = true;
		}

		const entries = ctx.sessionManager.getEntries();
		const askModeEntry = entries
			.filter((e) => e.type === "custom" && e.customType === "ask-mode")
			.pop() as { data?: { enabled: boolean } } | undefined;

		if (askModeEntry?.data) {
			askModeEnabled = askModeEntry.data.enabled ?? askModeEnabled;
		}

		if (askModeEnabled) {
			pi.setActiveTools(ASK_MODE_TOOLS);
		}
		updateStatus(ctx);
	});
}

```

**utils.ts:**

```typescript
/**
 * Pure utility functions for ask mode.
 * Extracted for testability.
 */

// Destructive commands blocked in ask mode
const DESTRUCTIVE_PATTERNS = [
	/\brm\b/i,
	/\brmdir\b/i,
	/\bmv\b/i,
	/\bcp\b/i,
	/\bmkdir\b/i,
	/\btouch\b/i,
	/\bchmod\b/i,
	/\bchown\b/i,
	/\bchgrp\b/i,
	/\bln\b/i,
	/\btee\b/i,
	/\btruncate\b/i,
	/\bdd\b/i,
	/\bshred\b/i,
	/(^|[^<])>(?!>)/,
	/>>/,
	/\bnpm\s+(install|uninstall|update|ci|link|publish)/i,
	/\byarn\s+(add|remove|install|publish)/i,
	/\bpnpm\s+(add|remove|install|publish)/i,
	/\bpip\s+(install|uninstall)/i,
	/\bapt(-get)?\s+(install|remove|purge|update|upgrade)/i,
	/\bbrew\s+(install|uninstall|upgrade)/i,
	/\bgit\s+(add|commit|push|pull|merge|rebase|reset|checkout|branch\s+-[dD]|stash|cherry-pick|revert|tag|init|clone)/i,
	/\bsudo\b/i,
	/\bsu\b/i,
	/\bkill\b/i,
	/\bpkill\b/i,
	/\bkillall\b/i,
	/\breboot\b/i,
	/\bshutdown\b/i,
	/\bsystemctl\s+(start|stop|restart|enable|disable)/i,
	/\bservice\s+\S+\s+(start|stop|restart)/i,
	/\b(vim?|nano|emacs|code|subl)\b/i,
];

// Safe read-only commands allowed in ask mode
const SAFE_PATTERNS = [
	/^\s*cat\b/,
	/^\s*head\b/,
	/^\s*tail\b/,
	/^\s*less\b/,
	/^\s*more\b/,
	/^\s*grep\b/,
	/^\s*find\b/,
	/^\s*ls\b/,
	/^\s*pwd\b/,
	/^\s*echo\b/,
	/^\s*printf\b/,
	/^\s*wc\b/,
	/^\s*sort\b/,
	/^\s*uniq\b/,
	/^\s*diff\b/,
	/^\s*file\b/,
	/^\s*stat\b/,
	/^\s*du\b/,
	/^\s*df\b/,
	/^\s*tree\b/,
	/^\s*which\b/,
	/^\s*whereis\b/,
	/^\s*type\b/,
	/^\s*env\b/,
	/^\s*printenv\b/,
	/^\s*uname\b/,
	/^\s*whoami\b/,
	/^\s*id\b/,
	/^\s*date\b/,
	/^\s*cal\b/,
	/^\s*uptime\b/,
	/^\s*ps\b/,
	/^\s*top\b/,
	/^\s*htop\b/,
	/^\s*free\b/,
	/^\s*git\s+(status|log|diff|show|branch|remote|config\s+--get)/i,
	/^\s*git\s+ls-/i,
	/^\s*npm\s+(list|ls|view|info|search|outdated|audit)/i,
	/^\s*yarn\s+(list|info|why|audit)/i,
	/^\s*node\s+--version/i,
	/^\s*python\s+--version/i,
	/^\s*curl\s/i,
	/^\s*wget\s+-O\s*-/i,
	/^\s*jq\b/,
	/^\s*sed\s+-n/i,
	/^\s*awk\b/,
	/^\s*rg\b/,
	/^\s*fd\b/,
	/^\s*bat\b/,
	/^\s*eza\b/,
];

export function isSafeCommand(command: string): boolean {
	const isDestructive = DESTRUCTIVE_PATTERNS.some((p) => p.test(command));
	const isSafe = SAFE_PATTERNS.some((p) => p.test(command));
	return !isDestructive && isSafe;
}
```

**README.md:**

```markdown
# Ask Mode Extension

Read-only Q&A mode for safe codebase exploration.

## Features

- **Read-only tools**: Restricts available tools to read, bash, grep, find, ls
- **Bash allowlist**: Only read-only bash commands are allowed
- **Ask mode system prompt**: Injects hidden instructions to keep the agent in Q&A mode
- **Footer status indicator**: Shows when ask mode is active (matching plan mode style)
- **Session persistence**: State survives session resume

## Commands

- `/ask` - Enter ask mode (read-only Q&A)
- `/agent` - Return to normal agent mode (full tool access)
- `--ask` flag - Start the session in ask mode

## Usage

1. Enable ask mode with `/ask` or `--ask` flag
2. Ask questions about the codebase, files, or architecture
3. The agent answers using only read-only tools
4. Switch to agent mode with `/agent` when you're ready to make changes

## How It Works

### Ask Mode (Read-Only)
- Only read-only tools available: `read`, `bash`, `grep`, `find`, `ls`
- Bash commands filtered through allowlist (destructive commands blocked)
- Hidden system instructions injected before each turn to keep the agent in Q&A mode
- File modifications (`edit`, `write`) are disabled

### Agent Mode
- Full tool access restored (`read`, `bash`, `edit`, `write`)
- Hidden ask-mode instructions are filtered out of context
- Footer status indicator cleared

### Command Allowlist

Safe commands (allowed):
- File inspection: `cat`, `head`, `tail`, `less`, `more`, `file`, `stat`
- Search: `grep`, `find`, `rg`, `fd`, `sed -n`, `awk`, `jq`
- Directory: `ls`, `pwd`, `tree`, `du`, `df`
- Git read: `git status`, `git log`, `git diff`, `git branch`, `git show`
- Package info: `npm list`, `npm outdated`, `yarn info`, `npm audit`
- System info: `uname`, `whoami`, `date`, `uptime`, `ps`, `top`
- Network: `curl`, `wget -O -`

Blocked commands:
- File modification: `rm`, `mv`, `cp`, `mkdir`, `touch`, `chmod`, `chown`
- Git write: `git add`, `git commit`, `git push`, `git checkout`, `git merge`
- Package install: `npm install`, `yarn add`, `pip install`, `brew install`
- System: `sudo`, `kill`, `reboot`, `shutdown`
- Editors: `vim`, `nano`, `code`, `emacs`
- Redirections: `>`, `>>` (any output redirect)
```


**Usage:**

```bash
# Start a session in ask mode
pi --ask

# Or toggle during a session
/ask      # Enter read-only Q&A mode
/agent    # Return to full tool access
```

When ask mode is active, you will see `⏸ ask` in the footer status. The agent can answer questions, explore code, and run read-only bash commands ... but it can't modify files or run destructive operations.

---

## Why This Approach Actually Wins

The reason I am writing this isn't to sell you on Pi. It's that the coding agent space has settled into a pattern that should bother us: every tool ships the same features, implemented slightly differently, and you're stuck with whatever version of plan mode or sub-agents that particular team decided was right.

Pi inverts that. It ships with almost nothing, and gives you the primitives to build **exactly what you need**. Extensions are TypeScript, not some bespoke config language. The event hooks expose the real internals ... you can intercept prompt context, mutate tool arguments, replace the system prompt. If something breaks, you can read the extension (it's probably under 300 lines) and fix it yourself.

### The Trade-off

The cost is that **you have to know what you want**. If you are looking for a tool that works exactly one way and you never need to deviate, ClaudeCode or OpenCode are probably fine. They will hold your hand, make decisions for you, and occasionally surprise you with features you didn't ask for.

But if you have felt that friction ... if you have found yourself fighting the tool's opinions about how you should work ... Pi is the first agent I have used that gets out of the way and stays there.

### My Current Setup

Here's what I'm running:

- **Pi** with plan mode and ask mode extensions
- **Ollama** for local inference
- **Dark theme** that matches my terminal (because aesthetics matter)
- **Total extension code:** ~600 lines

Everything I need, nothing I don't. No features I will never use.

---

## Resources

- [Pi Documentation](https://pi.dev/docs/latest)
- [Extensions Guide](https://pi.dev/docs/latest/extensions)
- [Mario's Blog](https://mariozechner.at)

Have questions? Just ask Pi ... it's pretty good at explaining itself.
