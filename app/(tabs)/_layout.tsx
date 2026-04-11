import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

export default function TabLayout() {
  const { t, lang } = useLanguage();
  return (
    <Tabs
      key={lang}
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.amber,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.bgBorder,
          borderTopWidth: 0.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('map'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🗺️</Text>,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('community'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🐾</Text>,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{ href: null }}
      />
    </Tabs>
  );
}
