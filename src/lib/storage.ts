import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const SELECTED_TOPICS_KEY = '@selected_topics';

// In-memory fallback for Expo Go
const memoryStore: Record<string, string> = {};

export const getOnboardingCompleted = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (error) {
    console.warn('Fallback to memory store for onboarding status due to:', error);
    return memoryStore[ONBOARDING_COMPLETED_KEY] === 'true';
  }
};

export const setOnboardingCompleted = async (completed: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, completed.toString());
  } catch (error) {
    console.warn('Fallback to memory store for onboarding status due to:', error);
    memoryStore[ONBOARDING_COMPLETED_KEY] = completed.toString();
  }
};

export const getSelectedTopics = async (): Promise<string[]> => {
  try {
    const value = await AsyncStorage.getItem(SELECTED_TOPICS_KEY);
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.warn('Fallback to memory store for selected topics due to:', error);
    const value = memoryStore[SELECTED_TOPICS_KEY];
    return value ? JSON.parse(value) : [];
  }
};

export const setSelectedTopics = async (topics: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SELECTED_TOPICS_KEY, JSON.stringify(topics));
  } catch (error) {
    console.warn('Fallback to memory store for selected topics due to:', error);
    memoryStore[SELECTED_TOPICS_KEY] = JSON.stringify(topics);
  }
};
