import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

// Function to register for push notifications
export async function registerForPushNotificationsAsync(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Push notifications permission is required.');
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('profiles').update({ push_token: token }).eq('user_id', userId);
  return token;
}

// Function to send a push notification
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
