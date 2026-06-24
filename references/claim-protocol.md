# Claim Protocol

This protocol defines how MindFlow records paper, experiment, and synthesis claims in Markdown. A claim is a falsifiable statement with explicit evidence, counterevidence, confidence, provenance, and promotion status.

The protocol is Markdown-native. It does not require any external API, database, vector index, or top-level `Claims/` directory. Claims live inside the notes or reports that produced them, usually under `## Claims`.

## Claim Block Placement

Use a `## Claims` section in paper notes, survey reports, and cross-paper analysis reports. Each claim is one `### Claim: <short title>` block followed by the canonical fields in the exact order below.

```markdown
## Claims

### Claim: <short title>

- **claim_id**: C-YYYYMM-<slug>
- **claim**: One falsifiable sentence.
- **type**: factual
- **scope**: paper
- **stance**: supports
- **confidence**: 0.70
- **grounding**: paper
- **evidence**: [[Papers/YYMM-ShortTitle#section]]
- **counterevidence**: none
- **contradictions**: none
- **impact**: [[Workbench/agenda.md#Direction]] or [[DomainMaps/VLA]]
- **status**: raw
- **provenance**: source=paper-digest; extracted_from=[[Papers/YYMM-ShortTitle#section]]; captured_at=YYYY-MM-DD; method=direct extraction
```

## Canonical Field Set

The only canonical field set is:

- `claim_id`
- `claim`
- `type`
- `scope`
- `stance`
- `confidence`
- `grounding`
- `evidence`
- `counterevidence`
- `contradictions`
- `impact`
- `status`
- `provenance`

Every claim block must contain exactly these fields in this order. Later skills may add prose around a claim block, but they must not rename, reorder, or duplicate the canonical fields.

## Field Semantics

- **claim_id**: Stable ID for the claim. See ID Rules.
- **claim**: One specific, falsifiable sentence. Avoid vague summaries such as "the method works well".
- **type**: Kind of statement. See Allowed Values.
- **scope**: Where the claim applies. See Allowed Values.
- **stance**: Relationship between the current source and the claim. See Allowed Values.
- **confidence**: Decimal from `0.00` to `1.00` using the confidence semantics below.
- **grounding**: What the claim is grounded in. See Allowed Values.
- **evidence**: One or more Obsidian wikilinks to concrete paper sections, tables, figures, experiment logs, or reports. `none` is not allowed.
- **counterevidence**: Wikilinks to evidence that weakens the claim, or `none` if no counterevidence is known.
- **contradictions**: Claim IDs or wikilinks to incompatible claims, or `none` if no contradiction is known.
- **impact**: The affected agenda item, Domain Map, Topic, Idea, or open question.
- **status**: Lifecycle state. See Status Semantics.
- **provenance**: Machine-readable source trail. See Provenance Format.

## ID Rules

Claim IDs use `C-YYYYMM-<slug>`.

- `C` is literal.
- `YYYYMM` is the source publication month when available; otherwise use the capture month.
- `<slug>` is 2-6 lowercase ASCII words or tokens joined by hyphens.
- Use only `a-z`, `0-9`, and `-` in the slug.
- Keep IDs stable after creation. If a claim is superseded, append a new claim and link it through `contradictions` or `provenance`; do not rewrite the old ID.
- If two claims would produce the same ID, append a short numeric suffix such as `-2`.

Example: `C-202604-video-rl-scales`.

## Allowed Values

`type` values:

- `factual`: Describes an observed result, dataset property, architectural fact, or reported measurement.
- `comparative`: Compares methods, models, datasets, or settings.
- `causal`: Claims one factor causes or explains another.
- `methodological`: Claims a procedure, design, metric, training recipe, or evaluation setup is useful or flawed.
- `negative-result`: Reports a failure, null result, limitation, or disproven direction.

`scope` values:

- `paper`: Applies only to one source.
- `benchmark`: Applies to a named benchmark or evaluation setting.
- `method-family`: Applies to a family of methods.
- `domain`: Applies to a research domain.
- `task`: Applies to a task definition.
- `dataset`: Applies to a dataset or data distribution.

`stance` values:

- `supports`: The source gives evidence for the claim.
- `challenges`: The source weakens the claim without fully refuting it.
- `refutes`: The source gives evidence that the claim is false under the stated scope.
- `open`: The source frames the claim as unresolved.
- `mixed`: The source supports the claim in some conditions and challenges it in others.

`grounding` values:

- `paper`: Evidence comes from a paper, blog, benchmark report, or technical report.
- `experiment`: Evidence comes from a local experiment or reproduction.
- `reasoning`: Evidence comes from explicit analysis without new empirical data.
- `mixed`: Evidence combines more than one grounding type.

`status` values:

- `raw`: Newly extracted and not yet compared across sources.
- `provisional`: Supported by at least one source, but still under active uncertainty.
- `validated`: Supported by at least two independent sources or one strong local experiment, with no unresolved high-impact contradiction.
- `deprecated`: Superseded, contradicted, or no longer useful. The block remains for history.

## Confidence Semantics

Confidence is a decimal between `0.00` and `1.00`.

- `0.00-0.29`: Weak confidence. Evidence is indirect, single-source, or mostly reasoning.
- `0.30-0.59`: Moderate confidence. Evidence exists, but scope, baseline, or replication risk remains.
- `0.60-0.84`: High confidence. Evidence is direct and the stated scope is clear.
- `0.85-1.00`: Very high confidence. Evidence is independently supported or locally reproduced.

Confidence is not a probability of truth in all contexts. It is the current MindFlow confidence under the stated `scope` and `grounding`.

## Status Semantics

Status records lifecycle, not enthusiasm.

- Use `raw` during paper digestion or first extraction.
- Promote to `provisional` when the claim has been compared with at least one adjacent source or has an explicit caveat.
- Promote to `validated` only when independent evidence supports it and known contradictions are resolved or scoped away.
- Use `deprecated` when later evidence supersedes or refutes the claim.

Status changes are append-only. Do not edit an old claim block to change status after it has been used by another synthesis artifact. Add a new claim block or a dated note in the later artifact and link back through `provenance`.

## Provenance Format

Use semicolon-separated `key=value` pairs:

```text
source=<skill-or-human>; extracted_from=<wikilink>; captured_at=YYYY-MM-DD; method=<method>
```

Required keys:

- `source`: Skill name or `human`.
- `extracted_from`: Wikilink to the source note, section, log, or report.
- `captured_at`: Date when the claim was recorded.
- `method`: Extraction method, such as `direct extraction`, `survey synthesis`, `cross-paper comparison`, `experiment analysis`, or `human note`.

Optional keys may be appended after the required keys, for example `reviewed_by=human` or `supersedes=C-YYYYMM-slug`.

## Append-Only Contradiction Handling

Contradictions are append-only.

- Never delete or rewrite an older claim because a later claim contradicts it.
- Record the later claim as a new claim block with its own `claim_id`.
- Put the incompatible claim ID or wikilink in `contradictions`.
- Put concrete weakening evidence in `counterevidence`.
- If a validated claim is contradicted, create a new `provisional` claim or memory entry noting the contradiction. Do not mutate the old validated entry.
- If the contradiction is resolved by scope, keep both claims and make the scope difference explicit.

This matches `references/memory-protocol.md`: old entries remain historical evidence, and superseding knowledge is appended.

## Memory And Agenda Promotion Mapping

Claims can feed memory and agenda work without bypassing the existing protocols.

| Claim signal | Destination | Mapping |
|---|---|---|
| Recurring low-confidence claim across sources | `Workbench/memory/patterns.md` | `claim` -> `observation`; `evidence` -> `occurrences`; `confidence` below `0.60` -> `low` or `medium`; unresolved `counterevidence` -> `needs_verification` |
| Claim supported by three or more independent sources | `Workbench/memory/insights.md` with `status: provisional` | `claim` -> `claim`; `evidence` -> `evidence`; average or bounded range -> `confidence`; `impact` -> `impact`; `provenance` -> `source` |
| Claim supported by two independent evidence sources and no unresolved high-impact contradiction | `Workbench/memory/insights.md` with `status: validated` | Same as provisional, with contradiction review recorded in the entry |
| Negative-result claim that blocks a direction | `Workbench/memory/failed-directions.md` or agenda direction note | `claim` -> `lesson`; `counterevidence` or `evidence` -> `evidence_against`; `impact` -> related direction |
| Claim exposes a testable open question | `Workbench/agenda.md` or `Workbench/queue.md` | `claim` -> hypothesis or question; `evidence` and `counterevidence` -> rationale; `confidence` -> confidence |
| Stable validated insight ready for domain integration | `DomainMaps/{Name}.md` after Researcher judgment | Promote through `references/memory-protocol.md`; log the Domain Map update in `Workbench/evolution/changelog.md` |

Claim extraction and memory distillation must not directly modify `DomainMaps/`. Domain Map updates happen only through the memory promotion rule.

## Examples

### Paper-Digest Raw Claim

```markdown
### Claim: Video reward models expose temporal shortcuts

- **claim_id**: C-202606-video-reward-shortcuts
- **claim**: Video reward models can assign high scores to policies that exploit temporal shortcuts instead of completing the intended task.
- **type**: methodological
- **scope**: method-family
- **stance**: supports
- **confidence**: 0.58
- **grounding**: paper
- **evidence**: [[Papers/2606-VideoRewardAudit#Failure Cases]]
- **counterevidence**: none
- **contradictions**: none
- **impact**: [[Workbench/agenda.md#Reliable Video Evaluation]]
- **status**: raw
- **provenance**: source=paper-digest; extracted_from=[[Papers/2606-VideoRewardAudit#Failure Cases]]; captured_at=2026-06-23; method=direct extraction
```

### Cross-Paper Contradiction Claim

```markdown
### Claim: GUI agents need screenshot history for robust recovery

- **claim_id**: C-202605-gui-history-recovery
- **claim**: GUI agents need screenshot history to recover reliably from navigation errors in multi-step desktop tasks.
- **type**: causal
- **scope**: task
- **stance**: mixed
- **confidence**: 0.64
- **grounding**: mixed
- **evidence**: [[Papers/2605-GUIRecovery#Ablation]], [[Topics/GUI-Agent-Survey#Recovery]]
- **counterevidence**: [[Papers/2604-StateOnlyAgent#Desktop Results]]
- **contradictions**: C-202604-state-only-recovery
- **impact**: [[DomainMaps/ComputerUseAgent]]
- **status**: provisional
- **provenance**: source=cross-paper-analysis; extracted_from=[[Topics/GUI-Agent-Survey#Claim Matrix]]; captured_at=2026-06-23; method=cross-paper comparison
```

## Verification Checklist

Use this checklist when creating or reviewing claim blocks:

- [ ] The note has a `## Claims` section when claims are expected.
- [ ] Each block starts with `### Claim: <short title>`.
- [ ] The field list is exactly `claim_id`, `claim`, `type`, `scope`, `stance`, `confidence`, `grounding`, `evidence`, `counterevidence`, `contradictions`, `impact`, `status`, `provenance`.
- [ ] Every field appears exactly once and in order.
- [ ] `claim_id` matches `C-YYYYMM-<slug>`.
- [ ] Enum fields use only allowed values from this protocol.
- [ ] `confidence` is between `0.00` and `1.00`.
- [ ] `evidence` contains at least one concrete wikilink and is never `none`.
- [ ] `counterevidence` and `contradictions` use wikilinks, claim IDs, or `none`.
- [ ] Contradictions are handled append-only.
- [ ] `provenance` contains `source`, `extracted_from`, `captured_at`, and `method` in semicolon-separated `key=value` format.
- [ ] Promotion to memory or agenda follows the mapping above and does not require any external API, database, vector index, or top-level `Claims/` directory.
