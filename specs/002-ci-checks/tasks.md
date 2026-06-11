# Tasks: CI Checks

**Input**: Design documents from `/specs/002-ci-checks/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Ensure `npm run lint` script exists in `package.json`
- [x] T002 [P] Ensure `npm test` script exists in `package.json`
- [x] T003 [P] Ensure `npm run typecheck` script exists in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create GitHub Actions workflows directory `.github/workflows/`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Pull Request Validation (Priority: P1) 🎯 MVP

**Goal**: Automatically run checks on all Pull Requests to prevent regressions.

**Independent Test**: Can be fully tested by creating a PR with a known error and verifying the CI check fails, then fixing the error and verifying it passes.

### Implementation for User Story 1

- [x] T005 [US1] Create `.github/workflows/ci.yml` file
- [x] T006 [US1] Define `pull_request` trigger in `.github/workflows/ci.yml`
- [x] T007 [US1] Define standard steps (checkout code, setup-node, npm install) in `.github/workflows/ci.yml`
- [x] T008 [US1] Add `lint` job step to `.github/workflows/ci.yml`
- [x] T009 [US1] Add `test` job step to `.github/workflows/ci.yml`
- [x] T010 [US1] Add `typecheck` job step to `.github/workflows/ci.yml`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Main Branch Verification (Priority: P2)

**Goal**: Code pushed or merged to the main branch must be automatically verified.

**Independent Test**: Can be fully tested by pushing directly to the main branch and observing the CI pipeline execution.

### Implementation for User Story 2

- [x] T011 [US2] Add `push` to `main` branch trigger to existing `.github/workflows/ci.yml`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T012 Run quickstart.md validation locally to ensure all scripts in `package.json` work before pushing.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test PR pipeline
5. Merge if ready

### Incremental Delivery

1. Complete Setup + Foundational
2. Add User Story 1 → Test PR independently → Merge
3. Add User Story 2 → Test Main push independently → Merge
