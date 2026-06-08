# Implementation Plan: Onboarding Flow

**Branch**: `001-onboarding-flow` | **Date**: 2026-06-08 | **Spec**: [spec.md](file:///Users/adminadmin/Documents/ainews/specs/001-onboarding-flow/spec.md)

**Input**: Feature specification from `specs/001-onboarding-flow/spec.md` and UI designs from `/designs/`.

## Summary

Build a 4-screen onboarding flow for the AI News app, including a "Begin" screen, two intermediate informational/notification screens implemented as a swipeable carousel, and a final "Suggestions" screen for topic selection. Preferences will be stored locally.

## User Review Required

Please review the proposed tech stack (Expo, AsyncStorage, Expo Notifications) and confirm if you want to use Expo Router for navigation, as it's the standard for modern Expo apps. 

## Technical Context

**Language/Version**: TypeScript, React Native (Expo v56.0.0 per project rules)

**Primary Dependencies**: 
- `expo-router` (for navigation)
- `react-native-reanimated` & `react-native-gesture-handler` (for swipeable carousel)
- `@react-native-async-storage/async-storage` (for local preferences)
- `expo-notifications` (for handling iOS/Android notification permissions)

**Storage**: Local device storage (`AsyncStorage`)

**Testing**: Jest, React Native Testing Library

**Target Platform**: iOS and Android

**Project Type**: Mobile Application

**Performance Goals**: Topic selection screen renders in < 1 second. Fast image loading for static onboarding assets.

**Constraints**: Simplicity over complexity, offline-capable local storage, respect privacy by default.

**Scale/Scope**: 4 screens (Begin, Curated For You, One Daily Brief, What Do You Follow).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Primary Sourcing:** N/A (Onboarding screens only).
- [x] **AI Transparency:** N/A (No AI generation in onboarding).
- [x] **Simplicity:** Yes, using standard Expo libraries without over-engineering backend sync.
- [x] **Privacy by Default:** Yes, preferences are stored purely locally. No third-party trackers.
- [x] **User Value:** Yes, no manipulative engagement tactics, clear skip/next flows.

## Proposed Changes

### Configuration & Dependencies
#### [MODIFY] package.json
- Add `@react-native-async-storage/async-storage`
- Add `expo-notifications`
- Add `react-native-reanimated` (if not present)

### Components
#### [NEW] src/components/OnboardingCarousel.tsx
- A swipeable carousel component using a flatlist or `react-native-reanimated` to smoothly transition between the first 3 screens.
- Will manage the pagination dots indicator at the bottom.

#### [NEW] src/components/TopicPill.tsx
- A selectable pill component for the topics (e.g., "Models", "Agents") with active/inactive states based on the designs.

### Screens / Routing
Assuming `expo-router` is used:

#### [NEW] src/app/onboarding/index.tsx
- The host screen for the `OnboardingCarousel`. 
- Contains the 3 slides:
  1. **Begin Screen**: "STAY AHEAD OF AI." with "Let's begin" button.
  2. **Screen 1**: "CURATED FOR YOU." with "Next" and "Skip" buttons.
  3. **Screen 2**: "ONE DAILY BRIEF." with "Turn on notifications" button.
- Handles the notification permission request via `expo-notifications` on Slide 3.

#### [NEW] src/app/onboarding/topics.tsx
- The recommendations screen ("WHAT DO YOU FOLLOW?").
- Displays the grid of `TopicPill` components.
- Handles the selection state and "Build my feed" button.
- Saves the selected topics and a flag `onboardingCompleted: true` to `AsyncStorage`.
- Navigates to the main app feed upon completion.

### Services / Data Layer
#### [NEW] src/lib/storage.ts
- Wrapper for `AsyncStorage` to handle getting/setting `onboardingCompleted` and `selectedTopics`.

#### [NEW] src/lib/notifications.ts
- Helper functions wrapping `expo-notifications` to request permissions natively.

## Project Structure

```text
src/
├── app/
│   ├── onboarding/
│   │   ├── index.tsx
│   │   └── topics.tsx
├── components/
│   ├── OnboardingCarousel.tsx
│   └── TopicPill.tsx
├── lib/
│   ├── storage.ts
│   └── notifications.ts
```

**Structure Decision**: Standard Expo Router layout with encapsulated UI components and generic library helpers.

## Verification Plan

### Automated Tests
- `npm run test` (Jest unit tests for `storage.ts` logic).
- Component tests for `TopicPill` rendering active/inactive states.

### Manual Verification
- Launch the app on an iOS Simulator or Android Emulator.
- Verify the "Begin" screen shows first.
- Swipe through the carousel and tap "Next" / "Skip".
- Tap "Turn on notifications" and verify the native OS prompt appears.
- Select topics on the recommendations screen and tap "Build my feed".
- Reload the app and verify the onboarding flow is skipped automatically (verifying `AsyncStorage` persistence).
