import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  useEffect(() => {
    let redirected = false;

    // Check localStorage session directly
    const stored = typeof localStorage !== 'undefined' 
      ? localStorage.getItem('smartpettag-auth') 
      : null;
    
    if (stored) {
      // Session exists in storage — go to app immediately
      router.replace('/(tabs)/');
      return;
    }

    // No stored session — listen for auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (redirected) return;
      if (session) {
        redirected = true;
        router.replace('/(tabs)/');
      }
    });

    // Fallback — go to guest after 1.5s if no session
    const timer = setTimeout(() => {
      if (!redirected) {
        redirected = true;
        router.replace('/guest');
      }
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#F59E0B" />
    </View>
  );
}
