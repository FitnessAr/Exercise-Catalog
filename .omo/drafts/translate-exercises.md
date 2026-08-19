---
slug: translate-exercises
status: plan-written
intent: clear
review_required: false
pending-action: execution via $start-work (Metis gap analysis skipped per user request for simplicity)
approach: Translate ALL user-facing metadata fields (name, category, body_part, equipment, muscle_group, target, secondary_muscles) to Argentine Spanish AT SEED TIME. Create a translation mapping file, modify prisma/seed.ts to apply it during import, re-seed, verify with automated scripts + API smoke test, and update the README API filter contract to Spanish values.
---

# Draft: translate-exercises

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| ID | Outcome | Status | Evidence |
|----|---------|--------|----------|
| C1 | Extract all unique values from exercises.json for translatable fields | active | exercises-dataset-main/data/exercises.json |
| C2 | Create Argentine Spanish translation mapping file | active | exercise-catalog/prisma/translations.ts (new file) |
| C3 | Modify seed script to apply translations during import | active | exercise-catalog/prisma/seed.ts |
| C4 | Re-seed database and verify translated data (no English residues in translated fields) | active | verification script + seed output |
| C5 | Update README API filter contract to Spanish values | active | exercise-catalog/README.md |

## Decisions (user-confirmed at interview, 2026-08-19)

1. **Location: translate at seed.** DB stores Argentine Spanish values. API returns AND filters in Spanish. Reversible by re-seeding from the untouched dataset.
2. **Scope: ALL visible metadata.** `name`, `category`, `body_part`, `equipment`, `muscle_group`, `target`, `secondary_muscles` (user chose "Todos los metadatos visibles").
3. **Instructions / instruction_steps**: KEEP existing `es` translations from the dataset (neutral Spanish; NOT re-translated to rioplatense).
4. **Verification: tests-after + API smoke test.** Automated script asserts no English residues in translated fields; GET /api/exercises returns Spanish values. Agent-executed QA, no human intervention.
5. **Consequence accepted**: API filter params (`category`, `body_part`, `equipment`, `muscle_group`, `target`) now accept Spanish values; README filter docs updated in C5.
6. **Dataset untouched**: `exercises-dataset-main/data/exercises.json` is never modified; mapping file is the single source of translation truth.

## Findings (cited - path:lines)

1. **Dataset structure** (`exercises-dataset-main/data/exercises.json`):
   - ~1000+ exercises (pretty-printed JSON array, ~145,883 lines).
   - English-only fields: `name` (1000+ unique), `category` (~8-12 unique: waist, upper legs, back, lower legs, chest...), `body_part` (subset of category vocab), `equipment` (~30-50 unique: body weight, cable, leverage machine, assisted, medicine ball...), `muscle_group` (~25-35 unique: hip flexors, obliques, hamstrings, biceps, triceps, shoulders, glutes, quadriceps, chest, calves, forearms, lower back, traps, upper back, ankles...), `target` (~30-50 unique: abs, quads, lats, calves, pectorals, glutes, hamstrings, adductors...), `secondary_muscles` (array reusing target/muscle_group vocabulary).
   - Multi-lang fields already present: `instructions` and `instruction_steps` keyed by en, es, it, tr, ru, zh, hi, pl, ko, fr (es = neutral Spanish).
   - Exercise sample at lines 2-103 (id "0001"): shows full field set incl. `muscle_group: "hip flexors"`, `secondary_muscles: ["hip flexors","lower back"]`, `target: "abs"` (lines 92-97).

2. **Seed script** (`exercise-catalog/prisma/seed.ts`):
   - Reads JSON from `join(process.cwd(), '..', 'exercises-dataset-main', 'data', 'exercises.json')` (line 29).
   - Upserts each exercise via `prisma.exercise.upsert` (lines 42-73), mapping snake_case JSON → camelCase Prisma fields.
   - Single entry point for all data into PostgreSQL.

3. **Prisma schema** (`exercise-catalog/prisma/schema.prisma`):
   - `name` String(255), `category`/`bodyPart`/`equipment`/`muscleGroup`/`target` String?(100), `secondaryMuscles` Json? (array), `instructions`/`instructionSteps` Json.
   - No translated columns; schema change NOT needed for this approach.

4. **API routes**:
   - `src/app/api/exercises/route.ts` filters with exact equality: `where.category`, `where.bodyPart`, `where.equipment`, `where.muscleGroup`, `where.target` (lines 22-26); returns raw DB rows (lines 39-44).
   - `src/app/api/exercises/[id]/route.ts` returns raw row (line 22).

5. **README** (`exercise-catalog/README.md`): documents filter params with ENGLISH example values (category=waist, body_part, equipment=body weight, muscle_group, target) — must be updated to Spanish values.

6. **Consumers**: FitnessAr app does NOT consume the catalog API yet (mock data only, `FitnessAr/features/alumno/home/get-alumno-home-data.ts`). Only external gyms via API key consume it (README "API key que compartes con tus gyms").

7. **Repo**: NOT a git repository (no .git). No commit steps possible unless user inits git (out of scope).

## Open assumptions (announced defaults)

| Assumption | Default | Rationale | Reversible |
|------------|---------|-----------|------------|
| Instructions stay in dataset's neutral `es` | Yes | Re-translating 1000+ instructions to rioplatense was never requested; only name + muscles | Yes (separate future task) |
| Translation is the single source of truth | Mapping file `prisma/translations.ts` | Keeps dataset untouched, maintainable | Yes |
| API filter contract moves to Spanish | Accepted by user | Consequence of translate-at-seed | Yes (re-seed with English) |

## Scope IN

- Create translation mapping for all unique values in the 7 translatable fields.
- Modify `prisma/seed.ts` to apply translations during import (translate before upsert).
- Re-seed DB and verify: no English residues in translated fields; API returns Spanish.
- Update README filter docs + examples to Spanish values.
- Add a verification script (automated QA).

## Scope OUT (Must NOT have)

- Do NOT modify `exercises-dataset-main/data/exercises.json`.
- Do NOT add new DB columns or change the Prisma schema.
- Do NOT translate `instructions` / `instruction_steps` (keep dataset `es`).
- Do NOT change the API response structure or add endpoints.
- Do NOT implement response-layer translation or language negotiation.
- Do NOT touch the FitnessAr app.

## Approval gate
status: awaiting-approval
Approach: translate-at-seed with all visible metadata fields; mapping file + modified seed + re-seed + automated verification + README update.
Next action on approval: write .omo/plans/translate-exercises.md (scaffold + Metis + todos + TL;DR), then deliver with the start-or-high-accuracy question.
<!-- APPROVED: User approved the approach on turn -->