# nosko — Feature Documentation

Development Lifecycle (DLC) workspace for building nosko: a private, two-user household finance
manager on AWS that reimplements the functionality of `money-evaluation` with the architecture
lessons of the earlier nosko attempt.

## Outcome

A deployed AWS web application, private to Marcelo + Gabriele, that replaces the hand-maintained
`money-evaluation` (`source.json` + static dashboard) with:
- multi-user auth (two members, one household) and a real database with RLS isolation;
- two spaces: Casa (shared, joint accounts) and Pessoal (private per member);
- couple budgeting cycles (configurable anchor day, default 23rd→22nd) with the proportional
  model and the exact chaining/derived-figure logic;
- fixed-bill tracking with recurring-rule detection, shared payments with category caps;
- statement-file ingestion (CSV; PDF for Amex/C6) with a review queue;
- spend evaluations and a personal subscription audit;
- personal savings tracking + the two-phase / Box-3 projection engine; shared goals;
- the WhatsApp resumo.

## Documents

| File | Purpose | Status |
|---|---|---|
| `reverse-engineering.md` | Capability capture from money-evaluation + legacy lessons | Done |
| `requirements-questions.md` / `requirements-clarification-questions.md` | Locked decisions | Answered |
| `requirements.md` | Functional + non-functional requirements + Data Architecture (UI-aligned) | Done |
| `user-stories.md` | Stories & actions per epic (BFF surface), from the generated UI | Done |
| `stitch-prompts.md` | Google Stitch prompts (personal/shared spaces) | Done |
| `ui/` | Generated Stitch screens (HTML + images + design tokens) | Reference |
| `design/architecture.md` | Effect + BFF + DDD + IaC; Cycle/Projection/Evaluation specs; RLS isolation | Done |
| `design/database-design.md` | PostgreSQL/Neon schema (joint accounts, shared payments, goals, subs, FX, RLS) | Done |
| `design/units-of-work.md` | Dependency-ordered decomposition (U0–U15) | Done |
| `repo-structure-and-agreements.md` | Which agreements go in which repo README/CONVENTIONS | Done |
| `plans/implementation-plan.md` | Phased execution plan (U0–U1 done; resumes at U2) | Approved |
| `state.md` | Current lifecycle stage and next step | Live |
| `verification.md` | Validation summary | Pending (post-implementation) |

## Reference projects (read-only, not modified)

- `~/Documents/money-evaluation` — functional source of truth.
- `~/Documents/projects/personal/nosko-legacy` — architecture reference (patterns only; no code
  carried over).
