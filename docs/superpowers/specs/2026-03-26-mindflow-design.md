# MindFlow: Human-AI Collaborative Research System — Design Spec

> Version: 0.1.0-draft
> Date: 2026-03-26
> Status: Design

---

## 1. Vision & Positioning

### One-Line Definition

An open-source Human-AI collaborative research framework: AI autonomously explores, experiments, and accumulates experience; Human reviews, guides, and makes final judgments. All knowledge lives in a shared, transparent Markdown vault.

### Core Differentiation

| Existing AutoResearch assumption | MindFlow assumption |
|----------------------------------|---------------------|
| Goal is **paper output** | Goal is **insight discovery and cognitive growth** (papers are byproducts) |
| AI is **executor**, Human gives orders | AI has its **own research agenda**, explores autonomously |
| Single-run, no cross-project learning | **Persistent memory + evolution**, experience transfers across projects |
| Fixed roles (AI does X, Human does Y) | **Role fluidity** — AI plays different roles at different stages |
| State in databases / vector DBs | **Everything in Markdown**, Human can audit any AI state at any time |

### Design Philosophy (Three Layers)

```
Insight  — Not paper count, not metric improvement.
           "What new thing did we understand?"
Trust    — Transparency → Auditability → Trust → Greater autonomy.
           AI earns trust by consistently producing quality insights.
Markdown — Everything is a file. Everything is readable.
           Everything is version-controlled.
```

### Scope Boundaries

- **In scope**: Literature discovery/digestion, ideation, experiment design/execution, writing (as byproduct), memory/evolution, autonomous research agenda
- **Out of scope**: Training custom LLMs (API calls only), GPU cluster management (experiments run in user's own environment), real-time multi-user collaboration (Google Docs style)

---

## 2. Two-Layer Architecture

### Overview

```
┌─────────────────────────────────────────────┐
│  Layer 2: Orchestrator (optional)            │
│  Scheduler / Memory Index / Notifier /       │
│  Agent Bridge                                │
├─────────────────────────────────────────────┤
│  Layer 1: Skill Protocol (core)              │
│  Skills/*.md / .research/ / vault templates  │
│  Zero dependency, any agent can execute      │
├─────────────────────────────────────────────┤
│  Obsidian Vault (Markdown)                   │
│  Papers/ Topics/ Ideas/ Experiments/         │
│  Reports/ Projects/ Daily/                   │
│  .research/ (AI working state)               │
└─────────────────────────────────────────────┘
```

### Layer 1: Skill Protocol (Core)

**User experience**: `git clone` → copy skills to any coding agent → immediately usable. Zero dependencies.

Layer 1 includes:
- `skills/` — Skill definitions (pure Markdown), organized by research stage
- `templates/` — Vault templates including `.research/` directory structure
- `references/` — Protocol documents (skill format, memory rules, agenda rules, etc.)
- `packages/mindflow-cli/` — NPX installer for one-command setup

### Layer 2: Orchestrator (Optional)

**User experience**: Install when AI full autonomy is needed. Provides scheduler, notifications, and efficient memory retrieval.

Layer 2 includes:
- `scheduler/` — Cron and event-driven task scheduling
- `memory_index/` — Vector index built from `.research/memory/*.md` (rebuildable from Markdown)
- `notifier/` — Push notifications (Telegram, Email, Feishu, etc.)
- `agent_bridge/` — Unified abstraction over Claude Code / Codex / Gemini CLI
- `daemon.py` — Main process: schedule + listen + dispatch

### Interface Contract Between Layers

**Layer 2 reads and writes ONLY vault Markdown files.** It introduces no state that Layer 1 doesn't know about.

```
Layer 2 writes:
  .research/queue/reading.md      ← scheduler discovers new papers
  .research/logs/YYYY-MM-DD.md    ← execution logs
  Reports/YYYY-MM-DD-*.md         ← periodic reports

Layer 2 reads:
  .research/agenda.md             ← decides what to do next
  .research/memory/*.md           ← retrieves relevant experience
  .research/queue/*.md            ← gets pending tasks

The same skill works identically whether triggered by
Human manually or by Layer 2's scheduler.
```

---

## 3. Vault Structure & Information Flow

### Directory Layout

```
MindFlow Vault
├── Papers/          # Knowledge asset: paper notes
├── Topics/          # Knowledge asset: surveys, comparisons
│   └── Domain-Map.md  # ★ Core shared cognition (Human + AI)
├── Ideas/           # Knowledge asset: research ideas
├── Experiments/     # Knowledge asset: experiment records (new)
├── Projects/        # Knowledge asset: project tracking
├── Reports/         # AI → Human structured reports (new)
├── Daily/           # Human's daily logs
├── Templates/       # Note templates
├── Resources/       # Reference materials
├── Attachments/     # File attachments
│
├── .research/       # AI working state
│   ├── agenda.md
│   ├── identity.md
│   ├── memory/
│   │   ├── insights.md
│   │   ├── failed-directions.md
│   │   ├── effective-methods.md
│   │   └── patterns.md
│   ├── queue/
│   │   ├── reading.md
│   │   ├── experiments.md
│   │   ├── questions.md
│   │   └── review.md
│   ├── logs/
│   │   └── YYYY-MM-DD.md
│   └── evolution/
│       └── changelog.md
│
└── skills/          # Skill definitions (or symlinked)
```

### Knowledge Assets vs AI Working State

- **Knowledge assets** (`Papers/`, `Topics/`, `Ideas/`, `Experiments/`, `Reports/`): Finished artifacts, Human-AI shared, the vault's permanent value
- **AI working state** (`.research/`): AI's scratchpad — agenda, memory, queues, logs. Human can read/edit at any time, but these are process artifacts, not polished knowledge

**Rule**: AI's finished outputs go to knowledge asset directories. AI's intermediate work goes to `.research/`.

### Information Flow

```
                    Human input
                    (read papers, write ideas, edit Domain-Map, ask questions)
                        │
                        ▼
┌──────────────────────────────────────────────────────┐
│              Knowledge Assets (Human-AI shared)       │
│                                                       │
│  ★ Topics/Domain-Map.md  ← core shared cognition     │
│  Papers/ Topics/ Ideas/ Experiments/ Reports/         │
└────────────────────┬─────────────────────────────────┘
                     │
          knowledge ←→ AI state bidirectional flow
                     │
┌────────────────────┴─────────────────────────────────┐
│              .research/ (AI working state)             │
│  agenda.md → drives what AI does next                 │
│  memory/   → accumulated experience                   │
│  queue/    → task queue (both Human and AI can write)  │
│  logs/     → raw activity logs                        │
│  evolution/→ change tracking                          │
└──────────────────────────────────────────────────────┘
```

### Key Entity Relationships

#### Papers/ — AI's primary input and output

- AI reads Papers/ for cross-paper analysis, pattern extraction
- AI writes Papers/ when digesting new papers (following existing Templates/Paper.md)
- `.research/queue/reading.md` lists pending papers → processed into `Papers/YYMM-Title.md`

#### Topics/Domain-Map.md — Core shared cognition

- The single most important file in the vault
- Human and AI co-maintain; all Papers/Ideas/Experiments distill into this
- Four sections: Established Knowledge, Active Debates, Open Questions, Known Dead Ends
- AI update rules:

| Operation | AI Autopilot allowed? | Condition |
|-----------|-----------------------|-----------|
| Add Established Knowledge | Yes | confidence > 0.8, >=2 independent evidence sources |
| Add Active Debate | Yes | When inter-paper contradiction found |
| Add Open Question | Yes | Anytime |
| Add Known Dead End | Yes | When agenda direction abandoned |
| **Modify** Established Knowledge | No, needs Human review | Changing existing consensus is a major event |
| **Delete** any entry | No, needs Human review | Can only mark deprecated, never delete |

#### Ideas/ — Shared idea pool

- Both Human and AI write Ideas/; no distinction by origin
- Key dimensions: maturity (`spark` → `developing` → `validated` → `archived`), linked project/experiment, feasibility verification status
- Ideas with `status: validated` may be promoted to active direction in `.research/agenda.md`

#### Experiments/ (new) — Experiment records

- `Experiments/<id>/plan.md` — experiment design
- `Experiments/<id>/results.md` — raw results
- `Experiments/<id>/analysis.md` — analysis and insight extraction

---

## 4. AI State Model (`.research/`)

### `agenda.md` — Research Agenda

```markdown
---
last_updated: YYYY-MM-DD
updated_by: ai / human / both
---
## Mission
[Human-defined long-term research mission]

## Active Directions
### 1. [Direction name]
- **priority**: high / medium / low
- **status**: exploring / validating / consolidating
- **origin**: human-assigned / ai-discovered / paper-inspired
- **hypothesis**: [Current core hypothesis]
- **evidence**: [[Papers/xxx]], [[Experiments/xxx]]
- **next_action**: [Next step plan]
- **confidence**: 0.0-1.0

## Paused Directions
[Paused directions + reason]

## Abandoned Directions
[Abandoned directions + reason → synced to memory/failed-directions.md]

## Pending Decisions
[Items requiring Human decision]
```

### `identity.md` — AI Self-Awareness

```markdown
## Domain
[Current research domain description]

## Expertise
[AI's self-assessed strengths and weaknesses, auto-updated with experience]

## Collaboration Preferences
- **autonomy_level**: full / high / moderate / low
- **report_frequency**: daily / weekly / on-discovery
- **human_review_required**: [Which actions need Human approval]

## Autopilot Rules
- CAN: read papers, run designed experiments, update memory, generate reports
- CAN: discover new papers, explore new directions based on agenda
- CAN: auto-promote validated insight to Domain-Map (confidence > 0.8)
- NEED APPROVAL: start experiments >2h, abandon a research direction
- CANNOT: delete existing notes, modify Human-written content, publish externally
- MUST: log all operations, trigger Reporter mode for major discoveries
```

### `memory/insights.md` — Insight Collection

```markdown
### [YYYY-MM-DD] [Insight title]
- **claim**: [One-sentence statement]
- **evidence**: [[Papers/xxx]], [[Experiments/xxx]]
- **confidence**: high / medium / low
- **source**: literature-analysis / experiment / cross-validation
- **impact**: [Which research directions affected]
- **status**: provisional / validated / integrated
```

---

## 5. Human-AI Role Fluidity

### Four Role Modes

| Mode | AI Role | Human Role | Trigger |
|------|---------|------------|---------|
| **Autopilot** | Autonomous explorer | Offline, reviews later | Human offline + agenda has active directions |
| **Copilot** | Executor of specific tasks | Online, gives specific instructions | Human initiates chat + clear command |
| **Sparring** | Debate partner | Online, discusses ideas/results | Human initiates chat + open question |
| **Reporter** | Structured briefer | Offline, async review | Periodic / major discovery / decision needed |

### Mode Switching Logic

```
                    Human online?
                   ┌────┴────┐
                  yes        no
                   │          │
              Human intent?  agenda has active direction?
           ┌───┴───┐        ┌───┴───┐
        command  discussion yes      no
           │        │        │        │
        Copilot  Sparring  Autopilot  idle
                             │
                          important finding?
                         ┌───┴───┐
                        yes      no
                      Reporter   continue Autopilot
```

Roles are **implicit** — determined by interaction context, not explicit configuration. Exception: Autopilot boundary rules are explicitly defined in `identity.md` because they involve trust boundaries.

### Report Format (Reporter Mode)

```markdown
# Reports/YYYY-MM-DD-{type}.md
---
type: weekly / discovery / decision-needed
period: YYYY-MM-DD ~ YYYY-MM-DD
---
## Highlights
[Top 1-3 findings with evidence links]

## Progress by Direction
### Direction A
- **Actions taken**: ...
- **Key findings**: ...
- **Next steps**: ...
- **Needs Human decision**: [yes/no, details if yes]

## New Discoveries
[Unexpected patterns / notable new papers / ...]

## Experiments Summary
| Experiment | Status | Key Result |
|-----------|--------|-----------|

## Questions for Human
1. [Questions requiring Human judgment]

## Resource Usage
- Papers read: N / Experiments run: N / API tokens: ~N
```

---

## 6. Skill Protocol

### SKILL.md Format

Synthesized from ARIS (frontmatter + allowed-tools), uditgoenka (references/ separation), and Dr. Claw (taxonomy schema):

```markdown
---
name: skill-name
description: Brief purpose
version: 1.0.0

# Taxonomy (extended from Dr. Claw)
intent: literature / ideation / experiment / analysis /
        writing / evolution / orchestration / utility
capabilities: [research-planning, cross-validation, ...]
domain: general / cs-ai / bioinformatics / ...

# Role adaptation (MindFlow original)
roles: [autopilot, sparring, copilot]
autonomy: high / medium / low

# Tool permissions (ARIS approach)
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep

# Input/Output contract
input:
  - name: "description and format"
output:
  - file: "output path pattern"
  - memory: "memory file to append (if any)"
---

# Skill Name

## Purpose
[What this skill does and why]

## Steps
[Detailed execution instructions]

## Guard
[Safety constraints: what not to modify, citation requirements, etc.]

## Examples
[Usage examples]
```

Complex skills split detailed protocols into `references/`:

```
skills/3-experiment/experiment-iterate/
├── SKILL.md                    # Entry: frontmatter + overview
└── references/
    ├── iteration-protocol.md   # Detailed loop rules
    ├── guard-rules.md          # Guard definitions
    └── crash-recovery.md       # Recovery strategies
```

### Skill Hierarchy (Three Levels)

```
Level 0: Atomic skills (one specific task)
  paper-digest, experiment-iterate, memory-distill, ...

Level 1: Orchestration skills (chain multiple atomics)
  cross-paper-analysis, idea-tournament, ...

Level 2: Global orchestration (manage agenda + dispatch skills)
  insight-loop — the Autopilot entry point
```

### Stage-Skill Routing (Dr. Claw approach)

```json
{
  "literature": {
    "discovery": ["paper-discovery"],
    "analysis": ["paper-digest", "cross-paper-analysis"],
    "synthesis": ["knowledge-synthesis"]
  },
  "ideation": {
    "generation": ["idea-generation"],
    "evaluation": ["idea-tournament", "literature-grounding"]
  },
  "experiment": {
    "design": ["experiment-design"],
    "execution": ["experiment-iterate"],
    "analysis": ["result-analysis"]
  },
  "writing": {
    "planning": ["paper-outline"],
    "drafting": ["paper-draft"],
    "review": ["paper-review"]
  },
  "evolution": {
    "distill": ["memory-distill"],
    "retrieve": ["memory-retrieve"],
    "agenda": ["agenda-evolve"]
  }
}
```

### Installation & Distribution

```bash
# Layer 1 — one-command install
npx mindflow install
# Interactive: detect agent, select skill bundles, init vault templates

# Layer 1 — manual
git clone https://github.com/xxx/mindflow
cp -r mindflow/skills/* ~/.claude/skills/

# Layer 2 — optional orchestrator
cd mindflow/orchestrator
pip install -r requirements.txt
cp config.example.yaml config.yaml  # edit: vault path, agent, notifications
python daemon.py start
```

---

## 7. Memory & Evolution System

### Three Evolution Mechanisms (Adapted from EvoScientist)

#### IDE — Insight Direction Evolution (discover viable directions)

- **Trigger**: After cross-paper-analysis or knowledge-synthesis completes
- **Input**: New Topics/ analyses, Papers/ notes
- **Process**: Extract valuable directions → compare against failed-directions.md → compare against Domain-Map
- **Output**: New direction → `memory/insights.md` (provisional); high confidence → propose addition to `agenda.md`

#### IVE — Insight Validation Evolution (record failures)

- **Trigger**: When a research direction is disproven or abandoned
- **Input**: Abandoned direction from agenda.md + linked Experiments/ and Papers/
- **Process**: Analyze failure reason → distill reusable lesson
- **Output**: Append to `memory/failed-directions.md` with hypothesis, counter-evidence, lesson, related directions

#### ESE — Experiment Strategy Evolution (accumulate effective methods)

- **Trigger**: After experiment analysis completes
- **Input**: `Experiments/<id>/` plan + results + analysis
- **Process**: Extract effective methods from successes, pitfalls from failures
- **Output**: Append to `memory/effective-methods.md` with context, method, evidence, pitfalls

### Insight Promotion Hierarchy

```
Level 0: Raw Log (.research/logs/)
    ↓  memory-distill skill
Level 1: Pattern (.research/memory/patterns.md)
    "I noticed X and Y seem related" — confidence: low
    ↓  multiple independent observations
Level 2: Insight (.research/memory/insights.md, status: provisional)
    "I believe X causes Y because..." — confidence: medium
    ↓  experimental or literary cross-validation
Level 3: Validated Insight (.research/memory/insights.md, status: validated)
    "X indeed causes Y, evidence chain: [...]" — confidence: high
    ↓  ≥2 independent evidence sources + confidence > 0.8
Level 4: Domain Map (Topics/Domain-Map.md)
    Becomes part of shared Human-AI cognition
```

Human can **inject knowledge directly** at any level — no promotion process required. AI's Domain-Map updates are logged in `evolution/changelog.md`.

### Memory Retrieval

**Layer 1 (file-only)**: Grep + Glob + LLM judgment. Sufficient when memory < 100 entries.

**Layer 2 (vector-accelerated)**: mxbai-embed-large (Ollama, local) → ChromaDB → cosine similarity top-k. Index is fully rebuildable from Markdown. Falls back to Layer 1 if index unavailable.

---

## 8. Autopilot Core Loop (insight-loop)

### Four-Phase Cycle

```
insight-loop (one cycle per trigger)
    │
    ├── Phase 1: Orient — Where am I? What should I do?
    ├── Phase 2: Act   — Execute one specific task
    ├── Phase 3: Learn — Extract lessons from the result
    └── Phase 4: Report — Anything to report?
```

### Phase 1: Orient

Read `agenda.md`, `queue/*`, `memory/insights.md`, `Topics/Domain-Map.md`.

Decision priority (highest first):
1. `queue/review.md` has Human-marked urgent items → handle immediately
2. `queue/` has new Human-added tasks → execute (Human intent takes priority)
3. `insights.md` has provisional insight needing validation → design verification
4. `agenda.md` highest-priority active direction → advance it
5. Domain-Map has unclaimed Open Questions → self-directed exploration
6. Nothing → run paper-discovery to scan for field updates

Output: `action_type` + `target` → logged to `.research/logs/`

### Phase 2: Act

Query `stage-skill-map.json` based on `action_type`, invoke the corresponding skill. One action per cycle (atomicity). Check `identity.md` autonomy boundaries before execution. Actions needing approval → write to `queue/review.md`, skip this cycle.

### Phase 3: Learn

After every action (success or failure):
1. Log to `.research/logs/YYYY-MM-DD.md`
2. Conditional evolution: cross-paper-analysis → IDE; direction abandoned → IVE; experiment analyzed → ESE
3. Check insight promotion conditions

### Phase 4: Report

Trigger Reporter mode if any condition met:
- High-confidence insight promoted to Domain-Map
- Major inter-paper contradiction found
- Experiment results severely contradict expectations
- Decision fork requiring Human judgment
- `queue/review.md` accumulated ≥3 pending items
- Time since last report exceeds `report_frequency`

If triggered → generate `Reports/YYYY-MM-DD-{type}.md` → notify (Layer 2) or write to `queue/review.md` (Layer 1).

### Layer 1 vs Layer 2 Triggering

| Dimension | Layer 1 (no orchestrator) | Layer 2 (with orchestrator) |
|-----------|--------------------------|----------------------------|
| Trigger | Human manually runs `/insight-loop` | Daemon scheduler auto-triggers |
| Frequency | Human decides | Configurable (hourly / daily / continuous) |
| Notification | Output in vault, Human checks manually | Push to Telegram / Email / etc. |
| Memory retrieval | Grep full-text search | Vector index accelerated |
| Core skill logic | Identical | Identical |

---

## 9. Technology Choices

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Layer 1 skills | Pure Markdown | Zero dependency, cross-agent portable |
| Install CLI | Node.js (npx) | Orchestra approach, widest frontend ecosystem |
| Layer 2 daemon | Python | Most mature AI/ML ecosystem, rich embedding libraries |
| Vector embedding | mxbai-embed-large via Ollama | Local, no API dependency (EvoScientist approach) |
| Vector storage | ChromaDB | Lightweight local, fully rebuildable from Markdown |
| Notifications | Apprise (Python) | One library covers Telegram/Email/Feishu/DingTalk/Slack |
| Scheduling | APScheduler | Python-native, lightweight, supports cron and interval |
| Agent invocation | Agent CLIs | Claude Code / Codex / Gemini CLI with unified wrapper |
| Config | YAML (orchestrator) + Markdown (vault) | YAML for daemon, Markdown for AI and Human |
| License | MIT | Maximum adoption for open-source research tool |

---

## 10. Repository Structure

```
github.com/xxx/mindflow
├── README.md
├── LICENSE (MIT)
├── CONTRIBUTING.md
│
├── skills/                        # Layer 1
│   ├── taxonomy.schema.json
│   ├── stage-skill-map.json
│   ├── 0-orchestration/
│   │   ├── research-agenda/
│   │   └── insight-loop/
│   ├── 1-literature/
│   │   ├── paper-discovery/
│   │   ├── paper-digest/
│   │   ├── cross-paper-analysis/
│   │   └── knowledge-synthesis/
│   ├── 2-ideation/
│   │   ├── idea-generation/
│   │   ├── idea-tournament/
│   │   └── literature-grounding/
│   ├── 3-experiment/
│   │   ├── experiment-design/
│   │   ├── experiment-iterate/
│   │   └── result-analysis/
│   ├── 4-writing/
│   │   ├── paper-outline/
│   │   ├── paper-draft/
│   │   └── paper-review/
│   └── 5-evolution/
│       ├── memory-distill/
│       ├── memory-retrieve/
│       └── agenda-evolve/
│
├── templates/
│   ├── paper.md
│   ├── idea.md
│   ├── experiment.md
│   ├── report.md
│   ├── domain-map.md
│   └── .research/ (init template)
│
├── references/
│   ├── skill-protocol.md
│   ├── memory-protocol.md
│   ├── agenda-protocol.md
│   ├── role-protocol.md
│   └── report-protocol.md
│
├── packages/
│   └── mindflow-cli/
│       ├── package.json
│       ├── bin/install.js
│       └── lib/
│
├── orchestrator/              # Layer 2
│   ├── requirements.txt
│   ├── daemon.py
│   ├── scheduler/
│   ├── memory_index/
│   ├── notifier/
│   ├── agent_bridge/
│   └── config.example.yaml
│
├── docs/
│   ├── getting-started.md
│   ├── skill-authoring.md
│   ├── orchestrator-setup.md
│   └── architecture.md
│
└── examples/
    └── demo-vault/
```

---

## 11. MVP Roadmap

### Phase 1 — Skeleton (2 weeks)

- Repository structure + protocol documents
- 3 core skills: paper-digest, cross-paper-analysis, memory-distill
- Templates and `.research/` initialization
- `npx mindflow install` basic flow
- `examples/demo-vault/`

### Phase 2 — Core Loop (2 weeks)

- insight-loop orchestration skill
- agenda-evolve + memory-retrieve
- idea-generation + idea-tournament
- Complete IDE/IVE/ESE evolution skills
- Domain-Map update protocol implementation

### Phase 3 — Experiment (2 weeks)

- experiment-design + experiment-iterate
- result-analysis
- Guard mechanism
- Cross-model review (ARIS MCP approach)

### Phase 4 — Orchestrator (2 weeks)

- daemon + scheduler
- memory-index (vector retrieval)
- notifier (Telegram + Email)
- agent-bridge (Claude + Codex)
- Reporter mode auto-reports

### Phase 5 — Polish (2 weeks)

- Writing skills (paper-outline / draft / review)
- Complete documentation
- Community contribution guidelines
- Release v0.1.0

---

## 12. Design Provenance

Components adopted from existing open-source frameworks:

| Component | Source | How adapted |
|-----------|--------|-------------|
| SKILL.md format | ARIS | Adopted frontmatter + allowed-tools standard |
| Skill + references/ separation | uditgoenka/autoresearch | Adopted for complex skills |
| Atomic → orchestration → pipeline layering | ARIS | Adopted 3-level hierarchy |
| NPX one-command install | Orchestra AI-Research-SKILLs | Adopted distribution mechanism |
| Taxonomy schema | Dr. Claw | Adopted + extended with roles/autonomy fields |
| Stage × Task → Skill routing | Dr. Claw | Adopted stage-skill-map.json pattern |
| Project directory conventions | Dr. Claw | Adapted 5-stage structure |
| IDE/IVE/ESE evolution mechanisms | EvoScientist | Adopted, but Markdown storage instead of vector DB |
| Idea Elo tournament | EvoScientist | Adopted for idea ranking |
| 8 iteration principles + Guard | uditgoenka/autoresearch | Adopted for experiment-iterate skill |
| Cross-model adversarial review | ARIS | Adopted executor + reviewer pattern via MCP |
| Multi-agent backend abstraction | Dr. Claw | Adopted claude-sdk/gemini-cli/codex pattern |

**Original MindFlow contributions** (not found in any existing framework):
- Research Agenda self-management by AI
- Human-AI role fluidity (Autopilot / Copilot / Sparring / Reporter)
- 4-level Insight promotion hierarchy (log → pattern → insight → Domain-Map)
- Shared Domain-Map as core Human-AI cognition
- Orient → Act → Learn → Report autonomous cycle
- Full transparency: all AI state in auditable Markdown
