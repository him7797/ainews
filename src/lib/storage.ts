import AsyncStorage from '@react-native-async-storage/async-storage';
import type * as SecureStoreType from 'expo-secure-store';

// expo-secure-store requires a native build — unavailable in Expo Go
function loadSecureStore(): typeof SecureStoreType | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-secure-store') as typeof SecureStoreType;
  } catch {
    return null;
  }
}
const SecureStore = loadSecureStore();

const ONBOARDING_COMPLETED_KEY = '@onboarding_completed';
const SELECTED_TOPICS_KEY = '@selected_topics';
const JWT_KEY = 'brief_jwt';

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
    if (SecureStore) {
      await SecureStore.setItemAsync(JWT_KEY, token);
    } else {
      await AsyncStorage.setItem(JWT_KEY, token);
    }
  } catch {
    memoryStore[JWT_KEY] = token;
  }
};

export const getJwt = async (): Promise<string | null> => {
  try {
    if (SecureStore) {
      return await SecureStore.getItemAsync(JWT_KEY);
    }
    return await AsyncStorage.getItem(JWT_KEY);
  } catch {
    return memoryStore[JWT_KEY] ?? null;
  }
};

export const clearJwt = async (): Promise<void> => {
  try {
    if (SecureStore) {
      await SecureStore.deleteItemAsync(JWT_KEY);
    } else {
      await AsyncStorage.removeItem(JWT_KEY);
    }
  } catch {
    delete memoryStore[JWT_KEY];
  }
};
