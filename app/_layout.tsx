import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.auth.getSession().then(() => setLoading(false)); }, []);
  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#050508', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#C0392B" />
    </View>
  );
  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="emergency" options={{ headerShown: false }} />
        <Stack.Screen name="found" options={{ headerShown: false }} />
        <Stack.Screen name="confirm-found" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="message" options={{ headerShown: false }} />
        <Stack.Screen name="sighting" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
