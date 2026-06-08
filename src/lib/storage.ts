let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  // Ignore
}

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const SELECTED_TOPICS_KEY = '@selected_topics';

// In-memory fallback for Expo Go
const memoryStore: Record<string, string> = {};

export const getOnboardingCompleted = async (): Promise<boolean> => {
  try {
    if (!AsyncStorage || !AsyncStorage.getItem) {
      return memoryStore[ONBOARDING_COMPLETED_KEY] === 'true';
    }
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (e) {
    return memoryStore[ONBOARDING_COMPLETED_KEY] === 'true';
  }
};

export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  try {
    if (!AsyncStorage || !AsyncStorage.setItem) {
      memoryStore[ONBOARDING_COMPLETED_KEY] = completed.toString();
      return;
    }
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, completed.toString());
  } catch (e) {
    memoryStore[ONBOARDING_COMPLETED_KEY] = completed.toString();
  }
};

export const getSelectedTopics = async (): Promise<string[]> => {
  try {
    if (!AsyncStorage || !AsyncStorage.getItem) {
      const value = memoryStore[SELECTED_TOPICS_KEY];
      return value ? JSON.parse(value) : [];
    }
    const value = await AsyncStorage.getItem(SELECTED_TOPICS_KEY);
    return value ? JSON.parse(value) : [];
  } catch (e) {
    const value = memoryStore[SELECTED_TOPICS_KEY];
    return value ? JSON.parse(value) : [];
  }
};

export const setSelectedTopics = async (topics: string[]): Promise<void> => {
  try {
    if (!AsyncStorage || !AsyncStorage.setItem) {
      memoryStore[SELECTED_TOPICS_KEY] = JSON.stringify(topics);
      return;
    }
    await AsyncStorage.setItem(SELECTED_TOPICS_KEY, JSON.stringify(topics));
  } catch (e) {
    memoryStore[SELECTED_TOPICS_KEY] = JSON.stringify(topics);
  }
};
