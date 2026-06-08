import { Platform, Alert, Linking } from 'react-native';

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  // Ignore
}

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Notifications) {
    Alert.alert('Notifications', 'Push notifications are simulated in Expo Go.');
    return true;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus, canAskAgain } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive AI updates.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  } catch (error) {
    return true; // proceed anyway in dev
  }
};

export const checkNotificationPermissions = async (): Promise<boolean> => {
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};
