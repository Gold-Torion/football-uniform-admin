import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { UsersApi } from '../api/users';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return; // simulators don't get push tokens

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Arena dos Mantos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '2a3afaab-ac27-4e04-884f-2664185c0445',
  });

  await UsersApi.updatePushToken(tokenData.data).catch(() => {
    // non-critical — silently ignore
  });
}
