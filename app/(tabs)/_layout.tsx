import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';
import { useLanguage } from '../../lib/i18n';

export default function TabLayout() {
  const { lang, t } = useLanguage();
  return (
    <Tabs
      key={lang}
      initialRouteName="explore"
      screenOptions={{
        tabBarActiveTintColor: '#00D4AA',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050508',
          borderTopColor: '#111',
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
        },
        tabBarInactiveTintColor: '#333',
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: t('feed'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📸</Text>,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🐾</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('map'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
        }}
      />
    </Tabs>
  );
}
