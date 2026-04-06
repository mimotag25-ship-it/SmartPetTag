import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a real device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('lost-dog-alerts', {
      name: 'Lost Dog Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8640A',
    });
  }

  return token;
}

export async function savePushToken(token) {
  if (!token) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('push_tokens').upsert({
    user_id: user.id,
    token,
    platform: Platform.OS,
  }, { onConflict: 'user_id' });
}

export async function sendLostDogAlert(dog) {
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token');

  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map(({ token }) => ({
    to: token,
    sound: 'default',
    title: `🚨 Lost Dog Alert — ${dog.name}!`,
    body: `${dog.breed} last seen near ${dog.neighbourhood}. Tap to help find them.`,
    data: { dogId: dog.id, type: 'lost_dog_alert' },
    priority: 'high',
  }));

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });
}
