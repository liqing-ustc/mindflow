---
name: cross-paper-analysis
description: >
  When selected paper wikilinks or tag filters need cross-paper synthesis, build a bounded claim/evidence/contradiction matrix from `## Claims` blocks and emit a Topics analysis without editing Papers or DomainMaps.
argument-hint: "<wikilinks-or-tags> [focus/topic]"
allowed-tools: Read, Write, Edit, Glob, Grep
---

## Purpose

Use this skill to compare a bounded set of paper notes through the shared claim protocol, not through free-form literature summary. It consumes selected `[[wikilinks]]` or tag filters, reads the relevant `Papers/` notes and their `## Claims` blocks, and writes `Topics/{Topic}-Analysis.md` with claim/evidence matrices, contradiction tracking, open questions, DomainMap update suggestions, and a run log.

The claim contract is `references/claim-protocol.md`. Every claim used or emitted must preserve the canonical fields in order: `claim_id`, `claim`, `type`, `scope`, `stance`, `confidence`, `grounding`, `evidence`, `counterevidence`, `contradictions`, `impact`, `status`, `provenance`.

## Steps

1. Parse the request.
   - Accept either explicit paper wikilinks such as `[[2606-VideoRewardAudit]]` or a tag filter such as `tags: VLA`.
   - Accept an optional focus or topic name for the output file.
   - Bound the paper set before reading: use all explicit wikilinks, or for tag filters select at most 12 notes, preferring higher `rating`, `status: finished`, and recent relevance when those fields exist.
2. Read the protocols and inputs.
   - Read `references/claim-protocol.md` before extracting or comparing claims.
   - Read `references/memory-protocol.md` before appending any memory pattern.
   - Resolve each candidate note under `Papers/` and read the full note if it is in the bounded set.
   - Extract every `## Claims` block that follows the canonical field order. If a relevant note has no structured claims, record it in the analysis as `missing structured claims` rather than inventing claims.
3. Build the comparison model.
   - Group claims by shared question, method family, benchmark, dataset, task, or impact target.
   - Preserve each source claim's `claim_id`, `stance`, `confidence`, `grounding`, `evidence`, `counterevidence`, `contradictions`, `status`, and `provenance`.
   - Treat contradictions as append-only signals: link incompatible claim IDs or wikilinks and explain whether the conflict is due to scope, benchmark, dataset, metric, implementation, or a genuine unresolved disagreement.
4. Write `Topics/{Topic}-Analysis.md`.
   - If the target file already exists, stop and ask for a new topic name; do not overwrite it.
   - Use this required structure:

```markdown
---
date: YYYY-MM-DD
topic: Topic
input: selected wikilinks or tag filter
paper_count: N
focus: focus string
claim_protocol: [[references/claim-protocol]]
---

# Topic Analysis

## Source Set

| Paper | Claims found | Missing claim notes | Selection reason |
|---|---:|---|---|

## Claim/Evidence Matrix

| Claim cluster | Claim IDs | Net stance | Confidence range | Supporting evidence | Counterevidence | Scope notes | Status |
|---|---|---|---|---|---|---|---|

## Contradiction Ledger

| Contradiction | Claims involved | Evidence on each side | Likely source of disagreement | Resolution status | Follow-up |
|---|---|---|---|---|---|

## Open Questions

| Question | Triggering claims | Why unresolved | Needed evidence | Research impact |
|---|---|---|---|---|

## DomainMap Update Suggestions

| Target DomainMap | Suggested update | Grounding claims | Required human judgment |
|---|---|---|---|

## Claim-Derived Memory Candidates

| Destination | Candidate entry | Source claims | Confidence | Append-only action |
|---|---|---|---|---|

## Log Entry

- **skill**: cross-paper-analysis
- **input**: selected wikilinks or tag filter
- **output**: [[Topics/Topic-Analysis]]
- **claim_count**: N
- **contradiction_count**: N
- **open_question_count**: N
- **memory_appends**: N
```

5. Append only claim-derived follow-ups when warranted.
   - Append new recurring patterns to `Workbench/memory/patterns.md` only when at least two claims support the pattern and it is not already represented.
   - Append open questions to `Workbench/queue.md` only when the contradiction or evidence gap is explicit in the matrix.
   - Follow `references/memory-protocol.md`: previous entries are historical evidence; superseding knowledge is appended, not edited.
6. Log the run.
   - Append the `## Log Entry` fields to `Workbench/logs/YYYY-MM-DD.md`.
   - If the log file does not exist, create it with `# YYYY-MM-DD` and then append the entry.

## Guard

- Do not modify any file under `Papers/`; paper notes are read-only inputs.
- Do not modify any file under `DomainMaps/`; put all DomainMap changes in `## DomainMap Update Suggestions` for Owner review.
- Do not create a database, vector index, top-level `Claims/` directory, or external API dependency.
- Do not invent claim fields, reorder canonical fields, or rename the shared claim protocol fields.
- Do not promote a claim to `validated` unless `references/claim-protocol.md` and `references/memory-protocol.md` conditions are met.
- Do not overwrite an existing `Topics/{Topic}-Analysis.md`; ask for a new topic name or suffix.
- Keep all conclusions traceable to `[[wikilink]]` evidence, claim IDs, or explicit `missing structured claims` notes.

## Verify

- [ ] `Topics/{Topic}-Analysis.md` exists, is non-empty, and was not an overwrite.
- [ ] The source set is bounded and lists every selected paper.
- [ ] The report contains `## Claim/Evidence Matrix`, `## Contradiction Ledger`, `## Open Questions`, `## DomainMap Update Suggestions`, and `## Log Entry`.
- [ ] Every claim row preserves claim IDs and cites `evidence` from `references/claim-protocol.md` fields.
- [ ] Contradictions are append-only and list claim IDs or wikilinks.
- [ ] Any memory or queue update is claim-derived, append-only, and logged.
- [ ] No file under `Papers/` or `DomainMaps/` was modified.

## Examples

Compare explicit papers:

```text
/cross-paper-analysis [[2606-VideoRewardAudit]], [[2605-GUIRecovery]], [[2604-StateOnlyAgent]] focus: recovery evidence
```

Expected output: `Topics/RecoveryEvidence-Analysis.md` with a claim/evidence matrix, contradiction ledger for incompatible recovery claims, open questions about missing evidence, DomainMap update suggestions, and a log entry.

Compare a bounded tag-filtered set:

```text
/cross-paper-analysis tags: VLA focus: evaluation reliability
```

Expected behavior: select at most 12 relevant `Papers/` notes, extract structured claims, write `Topics/VLA-EvaluationReliability-Analysis.md`, append only new claim-derived patterns or questions, and leave `Papers/` and `DomainMaps/` unchanged.
