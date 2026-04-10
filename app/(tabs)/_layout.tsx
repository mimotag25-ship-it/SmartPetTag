import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
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
          title: 'Feed',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📸</Text>,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🐾</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🗺️</Text>,
        }}
      />
    </Tabs>
  );
}
