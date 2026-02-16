# Plan: Autonomous AI Agent System for Sisimpur

## TL;DR

Build a **7-agent autonomous system** in a **separate repo** (`sisimpur-agents`) that operates on the Sisimpur codebase. You update a single `VISION.md` file each morning; the Orchestrator agent reads it, generates a daily plan, and dispatches tasks to 6 specialist agents (Planner, Coder, QA, Reviewer, DevOps, Researcher). The system runs locally via cron, uses **Claude Sonnet API** (~$50-100/mo) as the brain, **Aider** (free) as the coding engine, and **CrewAI** (free) for agent coordination. Total estimated cost: **$70-150/month**. Two repos, not mono — because agents need clean git control over Sisimpur without polluting it with agent infrastructure code.

---

## Architecture Decision: 2 Repos, Not Mono

| Approach | Verdict | Reason |
|---|---|---|
| **Mono-repo** | Rejected | Agents create branches, PRs, commits on Sisimpur. Mixing agent code into the same repo pollutes git history, creates circular dependency (agent modifying its own code while running), and makes git operations messy. |
| **2 Separate Repos** | **Chosen** | `Sisimpur` = product code (as-is). `sisimpur-agents` = agent system that clones/operates on Sisimpur. Clean separation. Agent repo has its own git history. Can be reused for other Udbhabon projects later. |

---

## The 7 Agents

| # | Agent | Role | Build vs Reuse | Tool/Framework |
|---|---|---|---|---|
| 1 | **Orchestrator** | CEO — reads vision, generates daily plan, dispatches tasks, tracks progress, sends reports | **Custom code** (core brain, must own this) | Python + APScheduler + Claude API |
| 2 | **Planner** | PM + Architect — decomposes goals into atomic tasks with file paths, dependencies, acceptance criteria | **Custom code** + CrewAI | CrewAI agent with Claude Sonnet |
| 3 | **Coder** | Software Engineer — implements features, fixes bugs, creates branches/commits | **Wrapper around Aider** (90% reuse) | [Aider](https://aider.chat) CLI (free, open source) |
| 4 | **QA** | Test Engineer — writes tests, runs pytest, validates changes, reports coverage | **Custom code** (30%) + pytest | pytest + Aider for test writing |
| 5 | **Reviewer** | Code Reviewer — reviews diffs, checks patterns/security, approves or rejects PRs | **Custom code** (50%) + LLM | Claude API + GitPython for diff analysis |
| 6 | **DevOps** | Infrastructure — Docker builds, deployments, health checks, DB backups | **Custom code** (60%) + Docker SDK | Docker SDK + subprocess for commands |
| 7 | **Researcher** | R&D — web search for solutions, benchmarks libraries, writes findings | **Mostly reuse** | CrewAI agent + Tavily API ($5/mo) |

---

## Cost Breakdown

| Item | Monthly Cost | Notes |
|---|---|---|
| Claude Sonnet API (main LLM) | $50–120 | ~2M tokens/day for all agents |
| Tavily API (web search) | $5 | For Researcher agent |
| GitHub (free tier) | $0 | Public repos, Actions free for public |
| Aider | $0 | Open source, uses your Claude key |
| CrewAI | $0 | Open source framework |
| Local machine electricity | ~$10-15 | Running during agent hours |
| **Total** | **$65–140/mo** | Within your $50-200 budget |

---

## The Daily Autonomous Loop

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU: Update VISION.md each morning (optional, 5 min max)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
  07:00 ┌──────────────────▼──────────────────┐
        │  ORCHESTRATOR wakes up              │
        │  ├── Reads VISION.md (your input)   │
        │  ├── Reads PROGRESS.md (state)      │
        │  ├── Reads GitHub issues/PRs        │
        │  ├── Reads yesterday's REPORT       │
        │  └── Generates DAILY_PLAN.md        │
        └──────────────────┬──────────────────┘
                           │
  07:15 ┌──────────────────▼──────────────────┐
        │  RESEARCHER picks up R&D tasks      │
        │  ├── Searches web (Tavily)          │
        │  ├── Reads docs, compares options   │
        │  └── Writes to reports/research/    │
        └──────────────────┬──────────────────┘
                           │
  07:45 ┌──────────────────▼──────────────────┐
        │  PLANNER decomposes goals           │
        │  ├── Creates atomic task specs      │
        │  ├── Assigns priority + deps        │
        │  └── Writes to tasks/backlog/       │
        └──────────────────┬──────────────────┘
                           │
  08:00 ┌──────────────────▼──────────────────┐
        │  CODER executes tasks (loop)        │
        │  ├── Picks highest priority task    │
        │  ├── Creates feature branch         │
        │  ├── Calls Aider to implement       │
        │  ├── Commits with clear messages    │
        │  ├── Pushes & creates PR            │
        │  └── Repeats for next task          │
        └──────────────────┬──────────────────┘
                           │ (triggered per PR)
  ──── ┌───────────────────▼──────────────────┐
       │  QA AGENT validates each PR          │
       │  ├── Runs full pytest suite          │
       │  ├── Writes new tests if missing     │
       │  ├── Checks coverage delta           │
       │  └── Comments pass/fail on PR        │
       └───────────────────┬──────────────────┘
                           │
  ──── ┌───────────────────▼──────────────────┐
       │  REVIEWER checks code quality        │
       │  ├── Reads PR diff via GitHub API    │
       │  ├── Checks patterns, security,      │
       │  │   Django conventions, DRY          │
       │  ├── Approves OR requests changes    │
       │  └── If rejected → back to CODER     │
       └───────────────────┬──────────────────┘
                           │
  ──── ┌───────────────────▼──────────────────┐
       │  DEVOPS (when PRs merge to main)     │
       │  ├── Pulls latest main               │
       │  ├── Runs Docker build               │
       │  ├── Runs health checks              │
       │  ├── Deploys (staging first)         │
       │  └── Monitors for 15 min            │
       └───────────────────┬──────────────────┘
                           │
  23:00 ┌──────────────────▼──────────────────┐
        │  ORCHESTRATOR nightly wrap-up       │
        │  ├── Summarizes day's work          │
        │  ├── Updates PROGRESS.md            │
        │  ├── Writes DAILY_REPORT.md         │
        │  ├── Sends Discord summary          │
        │  └── Prepares tomorrow's priorities │
        └─────────────────────────────────────┘
```

---

## Repo Structure: `sisimpur-agents`

```
sisimpur-agents/
├── VISION.md                          # YOUR single source of truth
├── PROGRESS.md                        # Auto-generated progress state
├── config/
│   ├── agents.yaml                    # Agent definitions, roles, models
│   ├── schedules.yaml                 # Cron timing for each agent
│   ├── sisimpur.yaml                  # Target repo config (path, branch rules)
│   └── .env                           # ANTHROPIC_API_KEY, GITHUB_TOKEN, etc.
├── agents/
│   ├── base.py                        # BaseAgent class (logging, LLM, state)
│   ├── orchestrator/
│   │   ├── agent.py                   # Core orchestrator logic
│   │   ├── vision_parser.py           # NLP parsing of VISION.md changes
│   │   ├── daily_planner.py           # Generates DAILY_PLAN.md
│   │   ├── progress_tracker.py        # Reads all agent outputs, updates state
│   │   └── prompts/                   # System prompts for the orchestrator
│   ├── planner/
│   │   ├── agent.py                   # Task decomposition agent
│   │   ├── task_spec.py               # Task spec data model
│   │   ├── codebase_analyzer.py       # Reads Sisimpur code for context
│   │   └── prompts/
│   ├── coder/
│   │   ├── agent.py                   # Aider wrapper + git workflow
│   │   ├── aider_runner.py            # Subprocess calls to Aider CLI
│   │   ├── git_manager.py             # Branch creation, PR creation
│   │   └── prompts/
│   ├── qa/
│   │   ├── agent.py                   # Test orchestration
│   │   ├── test_runner.py             # pytest subprocess + result parsing
│   │   ├── test_writer.py             # Uses Aider to write tests
│   │   ├── coverage_checker.py
│   │   └── prompts/
│   ├── reviewer/
│   │   ├── agent.py                   # PR review agent
│   │   ├── diff_analyzer.py           # Parses git diffs for LLM review
│   │   ├── rules.py                   # Django-specific review rules
│   │   └── prompts/
│   ├── devops/
│   │   ├── agent.py                   # Build & deploy agent
│   │   ├── docker_manager.py          # Docker SDK operations
│   │   ├── health_checker.py          # HTTP health checks
│   │   └── prompts/
│   └── researcher/
│       ├── agent.py                   # Web research agent (CrewAI)
│       ├── search_client.py           # Tavily API wrapper
│       └── prompts/
├── shared/
│   ├── llm_client.py                  # Unified Claude API client with caching
│   ├── github_client.py               # PyGithub wrapper
│   ├── discord_notifier.py            # Webhook notifications
│   ├── task_store.py                  # SQLite task management
│   ├── models.py                      # Pydantic models (Task, Plan, Report)
│   └── token_budget.py               # Track daily API spend, enforce limits
├── tasks/                             # File-based task queue
│   ├── backlog/                       # Generated by Planner
│   ├── in_progress/                   # Claimed by Coder/QA
│   ├── in_review/                     # Waiting for Reviewer
│   ├── completed/                     # Done
│   └── failed/                        # For retry/escalation
├── reports/
│   ├── daily/                         # YYYY-MM-DD.md daily reports
│   └── research/                      # R&D findings
├── logs/                              # Per-agent log files
├── main.py                            # Entry point + scheduler
├── requirements.txt
└── Makefile                           # setup, start, stop, status commands
```

---

## VISION.md Format (What You Write)

```markdown
# Sisimpur Vision — Updated 2026-02-17

## Priority: CRITICAL
- Fix the duplicated code in authentication/views.py
- Fix CSRF_TRUSTED_ORIGINS string concatenation bug in settings.py
- Fix brain_cli.py broken import (references removed brain_engine)

## Priority: HIGH
- Migrate from SQLite to PostgreSQL
- Set DEBUG=False for production, configure proper ALLOWED_HOSTS
- Add Gunicorn as WSGI server in Docker
- Enable WhiteNoise middleware for static files

## Priority: MEDIUM
- Add comprehensive test suite (target 70% coverage)
- Add GitHub Actions CI/CD pipeline
- Implement proper Celery task queue instead of raw threading

## Ideas (Research First)
- Should we add a React/Next.js frontend instead of Django templates?
- Evaluate adding Redis for caching exam sessions
- Look into WebSocket for real-time job status instead of polling

## Notes
- Don't touch the n8n webhook integration, it works fine
- Keep supporting Bengali/Bangla language
```

---

## Implementation Phases

### Phase 1 — Foundation (Week 1–2)

1. Create the `sisimpur-agents` repo with the directory structure above. Initialize with `requirements.txt` containing: `anthropic`, `crewai`, `gitpython`, `PyGithub`, `apscheduler`, `pydantic`, `tavily-python`, `docker`, `python-dotenv`, `rich` (for CLI output)

2. Build `shared/llm_client.py` — a unified Claude API wrapper with: token counting, daily budget tracking ($5/day default cap), response caching for identical prompts, retry with exponential backoff, structured output via Pydantic models

3. Build `agents/base.py` — `BaseAgent` class that all agents inherit. Includes: LLM client access, logging setup, state persistence (read/write JSON), GitHub client, Discord notifier, `run()` method template, error handling with auto-retry

4. Build `agents/orchestrator/vision_parser.py` — parses `VISION.md` using Claude to extract: priority-ranked goals, new vs unchanged items (diff from yesterday), research questions, constraints/notes. Output: structured `VisionState` Pydantic model

5. Build `agents/orchestrator/agent.py` — the core loop: read vision → read progress → diff what changed → generate daily plan → write `DAILY_PLAN.md` → dispatch to agents. Uses Claude to reason about priorities and capacity (max 3-5 tasks/day to start)

6. Build `agents/coder/aider_runner.py` — wraps Aider CLI via `subprocess.run()`. Key commands: `aider --yes-always --no-auto-commits --model claude-3-5-sonnet --file <files> --message <task>`. Captures stdout/stderr, parses success/failure, handles timeouts (10 min max per task)

7. Build `agents/coder/git_manager.py` — using GitPython: clone/pull Sisimpur repo, create feature branch (`agent/<task-id>-<slug>`), stage changes, commit with conventional commit messages, push to remote. Using PyGithub: create PR with description, labels, link to task spec

8. Wire up `main.py` with APScheduler — schedule Orchestrator at 07:00, have it trigger Coder agent synchronously for each task. This is the **MVP**: Vision → Plan → Code → Commit. No QA/Review yet

9. **First test**: Write a `VISION.md` with the 3 critical Sisimpur bugs (duplicated auth code, CSRF bug, broken CLI import). Run the system. Verify it creates branches with fixes and opens PRs

### Phase 2 — Intelligence (Week 3–4)

10. Build `agents/planner/agent.py` — takes Orchestrator's high-level goals, reads relevant Sisimpur source files (using `codebase_analyzer.py` which does targeted `grep` + file reads), produces atomic `TaskSpec` objects with: title, description, files to modify, acceptance criteria, estimated difficulty, dependencies on other tasks

11. Build `agents/qa/test_runner.py` — runs `pytest` via subprocess on the Sisimpur repo, parses output (uses `--json-report` pytest plugin), extracts: pass/fail counts, failure details with file:line, coverage percentage. Returns structured `TestResult`

12. Build `agents/qa/test_writer.py` — when a PR has no tests, uses Aider to generate tests. Strategy: read the changed files, identify untested functions, generate pytest tests following existing test patterns in the repo

13. Build `agents/qa/agent.py` — orchestrates: run existing tests → if failures, report to Orchestrator → write new tests for new code → run again → comment results on PR

14. Add **self-correction loop** to the Coder agent: if QA reports test failures on a PR, Coder agent gets the failure output and attempts a fix (max 3 retries). If still failing after 3 tries, task moves to `failed/` and Orchestrator escalates (notifies you on Discord)

15. Build `shared/task_store.py` — SQLite-backed task management. Tables: `tasks` (id, title, status, priority, agent_assigned, created_at, completed_at, retries, metadata_json), `agent_runs` (id, agent_name, task_id, started_at, ended_at, result, tokens_used), `daily_plans` (id, date, plan_json). This replaces the file-based queue for reliability

### Phase 3 — Quality Gates (Week 5–6)

16. Build `agents/reviewer/diff_analyzer.py` — uses GitPython to get PR diff, chunks it into reviewable sections, annotates with file context (what does this file do?). Feeds to Claude with Django-specific review rules in `agents/reviewer/rules.py`: check for security (`@csrf_exempt` without auth), proper error handling, no hardcoded secrets, follows project conventions

17. Build `agents/reviewer/agent.py` — reviews every PR created by Coder. Three outcomes: `APPROVE` (auto-merge via GitHub API), `REQUEST_CHANGES` (comments on PR, sends back to Coder), `ESCALATE` (too risky, notifies you on Discord). Rule: never auto-merge migrations or settings changes

18. Build `agents/devops/agent.py` — triggered when a PR merges to `main`. Actions: `git pull` → `docker-compose build` → `docker-compose up -d` → wait 30s → hit health endpoints (`/healthz/`, `/ping/`) → if healthy, deployment succeeds → if unhealthy, auto-rollback (`git revert` + rebuild) → Discord notification either way

19. Add **GitHub Actions workflow** to Sisimpur repo (created by the agent system): `.github/workflows/ci.yml` — on PR: lint (flake8), test (pytest), build (Docker). This gives external validation beyond the agent's own QA

20. Build `shared/token_budget.py` — enforces daily API spending limits. Tracks tokens per agent, per day. If budget exceeded, agents queue remaining tasks for tomorrow. Default: $5/day (~100K tokens Claude Sonnet). Alert on Discord when 80% consumed

### Phase 4 — Full Autonomy (Week 7–8)

21. Build `agents/researcher/agent.py` — uses CrewAI with Tavily search tool. Takes research questions from `VISION.md` "Ideas" section and Planner's unknowns. Workflow: search web → read top results → synthesize findings → write structured report to `reports/research/`. Include: recommendation, pros/cons, effort estimate, links

22. Add **multi-day planning** to Orchestrator — maintain a `ROADMAP.md` that tracks weekly/monthly goals. Orchestrator breaks `VISION.md` goals into weekly milestones, allocates daily capacity. If a task is too large for one day, it splits across days with proper branch management (long-running feature branches)

23. Add **agent memory** — each agent maintains a `memory.json` with: lessons learned (what patterns cause failures), frequently referenced files, successful prompts. Fed as context on next run to improve over time

24. Build the **morning report system** — at 07:00, before processing `VISION.md`, Orchestrator generates a summary of yesterday's work and posts to Discord: PRs merged, tests added, coverage delta, deployment status, blocked tasks, budget spent. You read this with your morning coffee

25. Add **emergency protocols** — if health checks fail repeatedly, DevOps agent: reverts to last known good commit, rebuilds, notifies you. If Coder agent fails on the same task 3x, it's parked and you're notified. If API budget hits limit, all agents pause gracefully

26. Build `Makefile` commands: `make setup` (install deps, clone Sisimpur, configure), `make start` (launch scheduler daemon), `make stop` (graceful shutdown), `make status` (show running agents, today's progress), `make logs` (tail all agent logs), `make budget` (show API spend)

---

## Key Technical Decisions

- **Claude Sonnet over GPT-4o**: Better code quality for Django/Python, structured output more reliable, and fits budget at ~$3/1M input tokens
- **Aider over raw LLM calls for coding**: Aider handles repo-map, file selection, edit formats, git integration — months of engineering you don't need to redo. It's the best open-source coding agent
- **CrewAI only for Researcher**: Other agents need tighter control (subprocess calls, git ops, test parsing) that CrewAI's abstraction gets in the way of. Researcher is the purest "LLM + tools" agent, perfect for CrewAI
- **APScheduler over cron**: Python-native, can dynamically adjust schedules, integrates with the agent system's state
- **SQLite for task store**: Lightweight, zero-config, matches Sisimpur's current stack. No need for Redis/Postgres for the agent system itself
- **Feature branches per task, not direct commits**: Safety — every agent change goes through branch → PR → QA → review → merge. You can always check PRs if you want
- **Discord over email for notifications**: You already have Discord webhooks in Sisimpur, and it's real-time

---

## Immediate Sisimpur Fixes (Agent's First Tasks)

The research revealed **14 critical issues** in the current codebase. These become the agent system's first `VISION.md` goals to prove the system works:

1. Fix duplicated code in `apps/authentication/views.py` (same code appears twice)
2. Fix CSRF string concatenation bug in `core/settings.py` (missing comma)
3. Fix broken import in `brain_cli.py` (references removed `brain_engine`)
4. Set `DEBUG = False` + proper `ALLOWED_HOSTS` in `core/settings.py`
5. Replace `runserver` with Gunicorn in `Dockerfile`
6. Uncomment WhiteNoise in `core/middleware.py`
7. Fix duplicate `COMING_SOON` setting in `core/settings.py`
8. Replace raw `threading.Thread` with Celery in `apps/brain/services.py`
9. Add proper test suite (currently only 2 test files)
10. Add `.github/workflows/ci.yml` for CI/CD

---

## Verification Milestones

- **Phase 1 proof**: Run `make start`, update `VISION.md` with one bug fix. Verify a PR appears on GitHub within 30 minutes with the correct fix
- **Phase 2 proof**: Add a feature request to `VISION.md`. Verify Planner creates task specs, Coder implements, QA writes tests, all automated
- **Phase 3 proof**: Intentionally introduce a bug via `VISION.md`. Verify Reviewer catches it and requests changes, Coder fixes, eventually merges clean code
- **Phase 4 proof**: Don't touch `VISION.md` for 3 days. Verify agents continue working from the roadmap, daily reports arrive on Discord, and Sisimpur keeps improving
- **Budget proof**: Run `make budget` after 1 week — verify total API spend is within $15-35 (projected $65-140/mo)

---

## Risk Mitigations

| Risk | Mitigation |
|---|---|
| Agent writes broken code that deploys | All changes go through PR → QA → Review → health check pipeline. Auto-rollback on failure |
| Spiraling API costs | `token_budget.py` enforces daily cap ($5/day default). Discord alert at 80% |
| Agent loops (retry infinite) | Max 3 retries per task, then park in `failed/` and notify |
| You want to override agents | Just push a commit to `main` yourself. Agents will `git pull` and adjust |
| Machine turns off/restarts | APScheduler persists state to SQLite. On restart, picks up where it left off |
| Aider makes wrong edits | Everything is on a feature branch. Reviewer agent catches bad changes. Worst case: branch is deleted |
