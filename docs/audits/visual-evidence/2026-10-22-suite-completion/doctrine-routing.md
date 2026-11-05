## Doctrine Family

- Canonical root: `/Users/pranay/Projects/agent-start/doctrines`
- Operating doctrine: `OPERATING_DOCTRINE.md` v8.2 (sha256 `e14bab7b1964d8b7…`) — always applies
- Project: `trucking`
- Routing mechanism: agent-start doctrine-family router v1.1 (deterministic intent-signal model)
- Generated at: 2026-10-22T18:18:17Z
- Generator: agent-start lib/doctrine_family.py

Doctrine routing for this run:

| Doctrine | Version | Status | Reason |
|---|---:|---|---|
| Operating | 8.2 | selected | always active: cross-cutting control plane |
| Review | 1.3 | selected | mode verb signal: review |
| Exploration | 1.1 | selected | mode verb signal: explore |
| Research | 1.0 | selected | mode verb signal: research |
| Architecture | 1.1 | selected | mode verb signal: architect |
| Testing | 1.1 | selected | score 8 (signals: test, regression, testing) |
| Security / Privacy / Safety | 1.0 | not_required | no material routing signal for this task |
| Release Readiness | 1.0 | not_required | no material routing signal for this task |
| Documentation | 1.1 | selected | mode verb signal: document |
| Inquiry and Analysis | 1.0 | selected | mode verb signal: analyze |

Selected specialist doctrines (read from canonical paths when entering these modes):

- `/Users/pranay/Projects/agent-start/doctrines/REVIEW_DOCTRINE.md` — v1.3 — sha256 `135c7ba4b8338bc1…`
  - Role: Judge existing work: findings, contradictions, falsified assumptions, risk, and gaps in claims, architecture, and implementation.
  - Load when: reviewing, auditing, critiquing, red-teaming, assessing architecture, evaluating feedback, or judging readiness
  - Why selected: mode verb signal: review
- `/Users/pranay/Projects/agent-start/doctrines/EXPLORATION_DOCTRINE.md` — v1.1 — sha256 `efc97fe76cb261f1…`
  - Role: Expand frontiers: hypotheses, negative space, cross-domain transfer, opportunity mapping, and no-go discipline before narrowing.
  - Load when: discovering opportunity space, expanding an exploration map, identifying adjacent/tangential work, challenging scope, finding hidden primitives, or deciding what deserves research next
  - Why selected: mode verb signal: explore
- `/Users/pranay/Projects/agent-start/doctrines/RESEARCH_DOCTRINE.md` — v1.0 — sha256 `a78180444eb80d43…`
  - Role: Establish decision-grade knowledge: source hierarchy, recency, triangulation, counter-evidence, and uncertainty discipline.
  - Load when: establishing external or internal facts, resolving exploration nodes, comparing markets or competitors, evaluating technical options, studying standards or regulation, assessing datasets or benchmarks, or producing evidence-backed research
  - Why selected: mode verb signal: research
- `/Users/pranay/Projects/agent-start/doctrines/ARCHITECTURE_DOCTRINE.md` — v1.1 — sha256 `d42dc505e3287cd1…`
  - Role: Design and evolve load-bearing structure: ownership, boundaries, contracts, primitives, state, composition, migration, failure behavior.
  - Load when: designing or evolving system architecture, defining contracts or boundaries, introducing shared primitives, changing data/state ownership, planning migrations, composing capabilities, or making load-bearing technical design decisions
  - Why selected: mode verb signal: architect
- `/Users/pranay/Projects/agent-start/doctrines/TESTING_DOCTRINE.md` — v1.1 — sha256 `8c92920fe5d9fc7c…`
  - Role: Falsify and verify claims: test selection, oracles, sensitivity, regression proof, runtime verification, residual-risk reporting.
  - Load when: designing, running, interpreting, strengthening, or reviewing tests, verification, benchmarks, regressions, launch evidence, or defect closure
  - Why selected: score 8 (signals: test, regression, testing)
- `/Users/pranay/Projects/agent-start/doctrines/DOCUMENTATION_DOCTRINE.md` — v1.1 — sha256 `c16274821c6a9f94…`
  - Role: Preserve durable knowledge: canonical location, provenance, decision records, evidence, handoffs, and supersession.
  - Load when: creating or updating durable project knowledge, architecture records, decisions, reviews, exploration maps, testing evidence, runbooks, handoffs, user/developer documentation, or generated context
  - Why selected: mode verb signal: document
- `/Users/pranay/Projects/agent-start/doctrines/INQUIRY_ANALYSIS_DOCTRINE.md` — v1.0 — sha256 `1e073c96c383e52a…`
  - Role: Structure serious analysis through 5W1H and extended inquiry lenses: ownership, affected parties, scale, alternatives, change, baselines, conditions, provenance, uncertainty, significance, and next action.
  - Load when: performing serious analysis, decomposing a question, explaining a situation, attributing responsibility, comparing alternatives, reconstructing change over time, evaluating causes, mapping scenarios, or turning an ambiguous prompt into a decision-grade account
  - Why selected: mode verb signal: analyze

Full specialist doctrine text is not embedded in this pack by default. The canonical paths above are authoritative; summaries here are derivative and identify their source doctrine, version, and hash.

