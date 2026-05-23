import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    // First check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)/');
      } else {
        // No session yet — listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            router.replace('/(tabs)/');
          } else if (event === 'SIGNED_OUT') {
            router.replace('/guest');
          }
        });
        // If still no session after 2s, go to guest
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) router.replace('/guest');
          });
        }, 2000);
        return () => subscription.unsubscribe();
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#F59E0B" />
    </View>
  );
}
