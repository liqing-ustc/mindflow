# Agenda Protocol

This document defines the format and governance rules for `agenda.md` — the living research agenda that tracks active, paused, and abandoned directions. The agenda is the primary interface between human research intent and AI autonomous action.

---

## File Format

The agenda lives at `Workbench/agenda.md`. Below is the canonical template.

```markdown
---
last_updated: YYYY-MM-DD
updated_by: human / <skill-name>
---

## Mission

<!-- HUMAN-ONLY. Never modified by AI. -->
One paragraph describing the long-term research mission and primary scientific question.

---

## Active Directions

### [Direction Name]

- **priority**: high / medium / low
- **status**: exploring / validating / consolidating
- **origin**: human-assigned / ai-discovered / paper-inspired
- **hypothesis**: One-sentence falsifiable hypothesis
- **evidence**: [[Papers/xxx]], [[Experiments/xxx]] — or "none yet"
- **next_action**: Concrete next step (e.g., "Run experiment X", "Read [[Papers/yyy]]")
- **confidence**: 0.0–1.0

---

## Paused Directions

### [Direction Name]

- **priority**: high / medium / low
- **status**: paused
- **origin**: human-assigned / ai-discovered / paper-inspired
- **hypothesis**: One-sentence falsifiable hypothesis
- **evidence**: [[Papers/xxx]], [[Experiments/xxx]]
- **pause_reason**: Why this was paused
- **resume_condition**: What would trigger resuming this direction
- **confidence**: 0.0–1.0

---

## Abandoned Directions

### [Direction Name]

- **abandoned_on**: YYYY-MM-DD
- **original_hypothesis**: What was believed when started
- **reason**: Why this was abandoned
- **lesson**: One-sentence takeaway
- **memory_ref**: [[Workbench/memory/failed-directions.md#heading]]

---

## Pending Decisions

<!-- Items here require human review before AI may act on them. -->

### [Decision title] — [YYYY-MM-DD]

- **proposed_by**: <skill-name>
- **action_requested**: What the AI wants to do
- **rationale**: Why the AI believes this is appropriate
- **blocking**: Which direction or task is waiting on this decision
```

---

## Active Direction Fields

| Field | Type | Description |
|---|---|---|
| `priority` | enum | `high` / `medium` / `low` — human-assigned weight |
| `status` | enum | Current phase of the direction (see values below) |
| `origin` | enum | How this direction entered the agenda |
| `hypothesis` | string | Falsifiable one-sentence prediction |
| `evidence` | wikilinks | Links to supporting notes; `"none yet"` if just created |
| `next_action` | string | Specific, executable next step |
| `confidence` | float | AI-estimated confidence in the hypothesis, 0.0–1.0 |

**`status` values:**

- `exploring` — early stage; hypothesis is being investigated but not yet tested
- `validating` — evidence exists; running experiments or reading papers to confirm or refute
- `consolidating` — direction is well-supported; writing up findings or integrating into Domain Map

**`origin` values:**

- `human-assigned` — the human explicitly added this direction
- `ai-discovered` — the AI proposed this direction based on memory or literature
- `paper-inspired` — this direction emerged from a specific paper or set of papers

---

## AI Permissions

The AI's ability to modify `agenda.md` depends on the current direction's priority, the type of change, and whether the skill is operating in `autopilot` mode.

| Action | Autopilot Allowed? | Condition |
|---|---|---|
| Add a new `exploring` direction (medium or low priority) | Yes | Direction must be supported by at least one piece of evidence in memory or literature |
| Add a new `exploring` direction (high priority) | No | Write proposed direction to `Pending Decisions` for human review |
| Change status from `exploring` → `validating` | Yes | At least one concrete piece of evidence exists (paper, experiment result, or pattern) |
| Change status to `abandoned` | No | Write to `Pending Decisions` with full rationale; never self-abandon without human approval |
| Update `next_action` | Yes | Anytime, no conditions |
| Update `confidence` | Yes | Anytime; must reflect current evidence state accurately |
| Move direction to `Paused Directions` | Yes | Only if `pause_reason` and `resume_condition` are both populated |
| Modify `Mission` section | Never | This section is human-only; no AI modification under any condition |

### Copilot Mode

When a skill runs in `copilot` role, it may **propose** any of the above actions by writing a draft to `Pending Decisions`, even those otherwise allowed in autopilot. The human then approves by moving the proposed change into effect.

---

## Human Overrides

Human edits to `agenda.md` take effect immediately and unconditionally. There is no approval workflow for human changes. When a human edits the agenda:

- The `last_updated` and `updated_by` frontmatter fields should be updated to reflect the change.
- AI skills that run subsequently will read the current state of the file as authoritative.
- Human edits may contradict AI-proposed states in `Pending Decisions`; in that case, the pending item should be removed or marked resolved.

---

## Sync with Memory

When a direction is moved to `Abandoned Directions`, the following three steps must all be completed (typically by the `agenda-sync` or a calling skill):

1. **Write to `failed-directions.md`**: Create a new entry in `Workbench/memory/failed-directions.md` capturing the original hypothesis, evidence against, lesson, and related directions. This is done via the IVE (Insight, Validation, Evolution) pattern — the skill responsible for the abandonment writes the memory entry before modifying the agenda.

2. **Move to Abandoned section**: Transfer the direction from `Active Directions` or `Paused Directions` into `Abandoned Directions`, populating `abandoned_on`, `original_hypothesis`, `reason`, `lesson`, and a `memory_ref` wikilink pointing to the new `failed-directions.md` entry.

3. **Log in changelog**: Append an entry to `Workbench/evolution/changelog.md`:

   ```markdown
   ### [YYYY-MM-DD] Direction abandoned: <direction name>
   - **reason**: <brief reason>
   - **memory_ref**: [[Workbench/memory/failed-directions.md#heading]]
   - **logged_by**: <skill-name or "human">
   ```

These three steps must be atomic — if any step fails, the skill should halt and report the failure rather than leaving the agenda and memory in an inconsistent state.

---

## Agenda Integrity Rules

- Every direction in `Active Directions` must have a non-empty `next_action`. If a direction's next action is unclear, it should be moved to `Paused Directions` until a concrete step is identified.
- `confidence` values must be grounded in evidence. An `exploring` direction with no evidence should start at 0.1–0.2. A direction with multiple confirming papers may reach 0.7–0.8. Reaching 0.9+ requires experimental confirmation.
- The `Pending Decisions` section must be reviewed by a human before any blocked skill proceeds. AI skills should check whether items in `Pending Decisions` are relevant to their current task and pause if a blocking decision is unresolved.
- Duplicate directions (same hypothesis under different names) should be merged. The AI may propose a merge via `Pending Decisions` but must not merge autonomously.
