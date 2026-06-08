import { getOnboardingCompleted, setOnboardingCompleted, getSelectedTopics, setSelectedTopics } from '../../src/lib/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

describe('Storage wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets onboarding completed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');
    const result = await getOnboardingCompleted();
    expect(result).toBe(true);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@onboarding_completed');
  });

  it('sets onboarding completed', async () => {
    await setOnboardingCompleted(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@onboarding_completed', 'true');
  });

  it('gets selected topics', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('["AI", "Robotics"]');
    const result = await getSelectedTopics();
    expect(result).toEqual(['AI', 'Robotics']);
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('@selected_topics');
  });

  it('sets selected topics', async () => {
    await setSelectedTopics(['AI']);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@selected_topics', '["AI"]');
  });
});
