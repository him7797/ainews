# Tasks: Onboarding Flow

**Input**: Design documents from `/specs/001-onboarding-flow/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Add onboarding dependencies to package.json (`expo-notifications`, `@react-native-async-storage/async-storage`, `react-native-reanimated`)
- [ ] T002 [P] Configure `react-native-reanimated/plugin` in babel.config.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Implement `AsyncStorage` wrapper in `src/lib/storage.ts`
- [ ] T004 [P] Implement `expo-notifications` logic in `src/lib/notifications.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - App Introduction (Priority: P1) 🎯 MVP

**Goal**: As a new user, I want to see a welcoming landing screen and introductory screens so that I understand the value proposition of the AI News app.

**Independent Test**: Launch the app for the first time and observing the "Begin" screen and subsequent informational screens.

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create carousel component in `src/components/OnboardingCarousel.tsx`
- [ ] T006 [US1] Create main onboarding screen in `src/app/onboarding/index.tsx` (uses `OnboardingCarousel`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Topic Selection (Priority: P1)

**Goal**: As a new user, I want to select AI topics of interest (suggestions/recommendations) so that my news feed is personalized.

**Independent Test**: Can be tested by selecting topics and verifying that the selection is saved upon completion.

### Implementation for User Story 3

- [ ] T007 [P] [US3] Create pill component in `src/components/TopicPill.tsx`
- [ ] T008 [US3] Create topics screen in `src/app/onboarding/topics.tsx` using `TopicPill.tsx` and `storage.ts`

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 2 - Notification Opt-In (Priority: P2)

**Goal**: As a new user, I want to be prompted to enable notifications so that I can receive real-time updates about breaking AI news.

**Independent Test**: Can be tested by navigating to the specific onboarding screen containing the notification prompt and interacting with it.

### Implementation for User Story 2

- [ ] T009 [US2] Update slide 3 in `src/app/onboarding/index.tsx` to trigger notification prompt from `src/lib/notifications.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T010 [P] Update `src/app/_layout.tsx` to check `storage.ts` and conditionally skip onboarding.
- [ ] T011 [P] Add unit tests for `src/lib/storage.ts` in `tests/unit/test_storage.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 UI to attach the trigger

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Models/Components within a story marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test independently → Deploy/Demo
4. Add User Story 2 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories
