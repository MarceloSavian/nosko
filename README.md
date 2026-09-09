# nosko

A private household finance manager for two people (Marcelo + Gabriele), hosted on AWS.

This is a fresh application that **reimplements the proven functionality of `money-evaluation`**
(couple budgeting cycles, subscription/spend evaluations, savings projections) as a real
multi-user web application with a backend, database, and authentication — replacing the
hand-maintained `source.json` + static dashboard workflow.

It reuses the **architecture lessons** of the earlier `nosko` attempt (AWS Lambda, Clean
Architecture, Zod-to-OpenAPI, modular IaC) without carrying over its code.

## Status

Inception (Development Lifecycle). See [`documentation/`](./documentation/) for requirements,
design, and the current lifecycle state. No application code exists yet — decisions are being
locked first.

## Working name

`nosko` is a placeholder. The final name is an open question in
[`documentation/requirements-questions.md`](./documentation/requirements-questions.md).
