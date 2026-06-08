# Feature Specification: Onboarding Flow

**Feature Branch**: `001-onboarding-flow`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Build a landing screen for the ainews. There should be a begin screen and followed by 2 screen and then a suggestions or recommendations screen to select the topic related to AI. One of the screen includes the turn on notifications upon clicking on this it should ask permissions for notifications in both iOS and android."

## Clarifications

### Session 2026-06-08

- Q: Topic Data Source → A: Hardcoded in the app (updated via app releases or OTA)
- Q: Navigation Flow → A: Swipeable carousel with "Next" and optional "Skip" button
- Q: Denied Notification Edge Case → A: Show a custom dialog directing the user to OS Settings

## User Scenarios & Testing *(mandatory)*

### User Story 1 - App Introduction (Priority: P1)

As a new user, I want to see a welcoming landing screen and introductory screens so that I understand the value proposition of the AI News app.

**Why this priority**: It is the first impression the app makes and sets the context for the user experience.

**Independent Test**: Can be fully tested by launching the app for the first time and observing the "Begin" screen and subsequent informational screens.

**Acceptance Scenarios**:

1. **Given** a fresh installation of the app, **When** the app is launched, **Then** the "Begin" landing screen is displayed.
2. **Given** the user is on the "Begin" screen, **When** they tap the primary action button, **Then** they are taken to the first intermediate onboarding screen.

---

### User Story 2 - Notification Opt-In (Priority: P2)

As a new user, I want to be prompted to enable notifications so that I can receive real-time updates about breaking AI news.

**Why this priority**: Notifications are critical for user retention and delivering timely news, but secondary to the core app introduction.

**Independent Test**: Can be tested by navigating to the specific onboarding screen containing the notification prompt and interacting with it.

**Acceptance Scenarios**:

1. **Given** the user is on the notification onboarding screen, **When** they tap to enable notifications, **Then** the native OS (iOS/Android) permission dialog is presented.
2. **Given** the user accepts or declines the OS permission, **Then** the app records their preference and proceeds to the next screen.
3. **Given** the user taps to skip notifications, **Then** the OS permission is not requested and the user proceeds to the next screen.

---

### User Story 3 - Topic Selection (Priority: P1)

As a new user, I want to select AI topics of interest (suggestions/recommendations) so that my news feed is personalized.

**Why this priority**: Personalization is central to providing high-signal, relevant content as per the product vision.

**Independent Test**: Can be tested by selecting topics and verifying that the selection is saved upon completion.

**Acceptance Scenarios**:

1. **Given** the user is on the topic selection screen, **When** they select one or more AI topics and tap continue, **Then** their preferences are saved and onboarding is marked as complete.
2. **Given** the user is on the topic selection screen, **When** they attempt to continue without selecting any topics, **Then** they are blocked from continuing and prompted to select at least one topic.

### Edge Cases

- What happens when the user force-closes the app midway through onboarding? (Expected: Onboarding restarts from the beginning on next launch).
- What happens if the native notification permission is already denied at the OS level due to previous installations? (Expected: Show a custom dialog directing the user to OS Settings).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a "Begin" landing screen upon the first app launch.
- **FR-002**: The system MUST display a sequence of two intermediate screens after the "Begin" screen, navigable via a swipeable carousel with "Next" and "Skip" buttons.
- **FR-003**: The system MUST provide an explicit prompt to enable push notifications on one of the intermediate screens.
- **FR-004**: The system MUST request native OS notification permissions (iOS and Android) when the user opts in via the app's prompt.
- **FR-005**: The system MUST present a "Suggestions/Recommendations" screen at the end of the flow containing a list of AI-related topics.
- **FR-006**: The system MUST allow users to toggle the selection of individual topics.
- **FR-007**: The system MUST persist the selected topics to the user's local preferences.
- **FR-008**: The system MUST mark the onboarding flow as complete so it is not shown on subsequent app launches.

### Key Entities

- **User Preferences**: Stores the boolean state of onboarding completion, notification opt-in status, and the list of selected AI topics.
- **Topic**: A selectable category of AI news (e.g., "Generative AI", "LLMs", "Robotics", "Ethics").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of new users who launch the app successfully complete the onboarding flow.
- **SC-002**: At least 40% of users opt-in to push notifications during the onboarding flow.
- **SC-003**: The topic selection screen renders and becomes interactive in under 1 second.
- **SC-004**: Users successfully save at least one topic of interest (if mandatory) or proceed smoothly (if optional).

## Assumptions

- The app does not require a backend user account for topic preferences; preferences are stored locally first.
- The two intermediate screens contain static informational copy/images explaining the app's value.
- "Suggestions or recommendations screen" refers to a list of predefined AI topics which are hardcoded in the app for the initial version.
