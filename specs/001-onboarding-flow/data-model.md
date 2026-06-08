# Data Model: Onboarding Flow

## Entities

### User Preferences
Stores local user configuration related to onboarding.

- `onboardingCompleted` (boolean): Flag indicating if the user has finished the onboarding flow. Default: `false`.
- `notificationsEnabled` (boolean): Flag indicating if the user opted into push notifications during onboarding. Default: `false`.
- `selectedTopics` (array of strings): List of AI topics the user follows. Default: `[]`.

**Validation Rules:**
- `selectedTopics` must contain at least one item before `onboardingCompleted` can be set to `true`.

**Storage Details:**
- Stored in local device storage via `@react-native-async-storage/async-storage`.
