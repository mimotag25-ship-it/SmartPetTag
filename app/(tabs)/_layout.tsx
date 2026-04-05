import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#E8640A',
        headerShown: false,
        tabBarStyle: { backgroundColor: '#000', borderTopColor: '#262626' },
        tabBarInactiveTintColor: '#555',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🐾</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Feed',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📸</Text>,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📡</Text>,
        }}
      />
    </Tabs>
  );
}