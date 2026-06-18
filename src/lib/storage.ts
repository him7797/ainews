import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const SELECTED_TOPICS_KEY = '@selected_topics';
const JWT_KEY = '@brief_jwt';

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
    return value ? (JSON.parse(value) as string[]) : [];
  } catch (error) {
    console.warn('Fallback to memory store for selected topics due to:', error);
    const value = memoryStore[SELECTED_TOPICS_KEY];
    return value ? (JSON.parse(value) as string[]) : [];
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

export const saveJwt = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_KEY, token);
  } catch {
    memoryStore[JWT_KEY] = token;
  }
};

export const getJwt = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(JWT_KEY);
  } catch {
    return memoryStore[JWT_KEY] ?? null;
  }
};

export const clearJwt = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(JWT_KEY);
  } catch {
    delete memoryStore[JWT_KEY];
  }
};
