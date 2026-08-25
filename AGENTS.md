# AGENTS.md

## Project

Dude Course is a web portal. Consult [docs/PRD.md](docs/PRD.md) whenever you need clarification
about the product — what it does, who it's for, or what a feature should behave like. That
document is the source of truth for product scope and behavior — do not invent features or
requirements beyond what it describes. If a request conflicts with the PRD, flag the conflict to
the user instead of silently deviating.

## Current Status

This repository is **pre-implementation**: no tech stack, framework, or database has been chosen
yet, and no application code exists.

## Working Agreements for AI Agents

- **Do not pick a tech stack unilaterally.** Before scaffolding any project structure, framework,
  or database, propose options to the user and get confirmation.
- Once a stack is chosen, record the decision (and rationale) in a short ADR under `docs/` (e.g.,
  `docs/adr/0001-tech-stack.md`) so future work — human or AI — has that context without
  re-deciding it.
- Keep `docs/PRD.md` as the single source of truth for product requirements. If new product
  decisions are made during implementation, update the PRD (or its Open Questions section) rather
  than letting decisions live only in code or chat history.
- Ask before making structural or hard-to-reverse decisions (e.g., choosing a database, changing
  the auth model, altering the data model in ways that affect existing data).
- Keep this file (`AGENTS.md`) up to date as the project evolves — e.g., add build/test commands
  and coding conventions once a stack exists.
