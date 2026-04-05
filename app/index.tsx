import { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#E8640A" />
    </View>
  );
}
