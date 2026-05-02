import { Text, Platform, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { colors, shadows } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

function WebBottomNav({ lang }) {
  const pathname = usePathname();
  const NAV = [
    { icon: '🏠', label: lang === 'es' ? 'Inicio' : 'Home', route: '/(tabs)/' },
    { icon: '🗺️', label: lang === 'es' ? 'Mapa' : 'Map', route: '/(tabs)/map' },
    { icon: '🐾', label: lang === 'es' ? 'Comunidad' : 'Community', route: '/(tabs)/explore' },
    { icon: '💬', label: lang === 'es' ? 'Mensajes' : 'Messages', route: '/chat' },
  ];
  return (
    <View style={bn.bar}>
      {NAV.map((item, i) => {
        const active = pathname === item.route || (item.route !== '/(tabs)/' && pathname.startsWith(item.route.replace('/(tabs)', '')));
        return (
          <TouchableOpacity key={i} style={bn.item} onPress={() => router.push(item.route)}>
            <View style={[bn.iconWrap, active && bn.iconWrapActive]}>
              <Text style={bn.icon}>{item.icon}</Text>
            </View>
            <Text style={[bn.label, active && bn.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const bn = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 8, paddingBottom: 12, shadowColor: '#0F172A', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: { width: 44, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#FFFBEB' },
  icon: { fontSize: 20 },
  label: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  labelActive: { color: '#F59E0B' },
});


function WebSidebar() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();

  const NAV = [
    { icon: '🏠', label: lang === 'es' ? 'Inicio' : 'Home', route: '/(tabs)/' },
    { icon: '🗺️', label: lang === 'es' ? 'Mapa' : 'Map', route: '/(tabs)/map' },
    { icon: '🐾', label: lang === 'es' ? 'Comunidad' : 'Community', route: '/(tabs)/explore' },
    { icon: '💬', label: lang === 'es' ? 'Mensajes' : 'Messages', route: '/chat' },
    { icon: '✏️', label: lang === 'es' ? 'Editar perfil' : 'Edit Profile', route: '/edit-profile' },
    { icon: '🔒', label: lang === 'es' ? 'Privacidad' : 'Privacy', route: '/privacy' },
  ];

  return (
    <View style={wb.sidebar}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/')} style={wb.logoWrap}>
        <Text style={wb.logoPaw}>🐾</Text>
        <View>
          <Text style={wb.logoText}>SmartPet Tag</Text>
          <Text style={wb.logoSub}>{lang === 'es' ? 'Red de seguridad' : 'Safety Network'}</Text>
        </View>
      </TouchableOpacity>

      <View style={wb.divider} />

      <View style={wb.nav}>
        {NAV.map((item, i) => {
          const active = pathname === item.route || (item.route !== '/(tabs)/' && pathname.startsWith(item.route.replace('/(tabs)', '')));
          return (
            <TouchableOpacity key={i} style={[wb.navItem, active && wb.navItemActive]} onPress={() => router.push(item.route)}>
              <Text style={wb.navIcon}>{item.icon}</Text>
              <Text style={[wb.navLabel, active && wb.navLabelActive]}>{item.label}</Text>
              {active && <View style={wb.navActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={wb.emergencyBtn} onPress={() => router.push('/emergency')}>
        <Text style={wb.emergencyIcon}>🚨</Text>
        <Text style={wb.emergencyText}>{lang === 'es' ? 'Alerta de emergencia' : 'Emergency Alert'}</Text>
      </TouchableOpacity>

      <Text style={wb.footer}>© 2026 SmartPet Tag</Text>
    </View>
  );
}

const wb = StyleSheet.create({
  sidebar: { width: 240, height: '100%', backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 20, justifyContent: 'flex-start', ...shadows.card },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 8 },
  logoPaw: { fontSize: 28 },
  logoText: { fontSize: 16, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  logoSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 16 },
  nav: { gap: 2 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  navItemActive: { backgroundColor: '#FFFBEB' },
  navIcon: { fontSize: 17, width: 26 },
  navLabel: { fontSize: 14, color: '#64748B', fontWeight: '500', flex: 1 },
  navLabelActive: { color: '#D97706', fontWeight: '700' },
  navActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  emergencyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF1F1', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', paddingVertical: 12, paddingHorizontal: 14, marginBottom: 12 },
  emergencyIcon: { fontSize: 16 },
  emergencyText: { color: '#EF4444', fontWeight: '700', fontSize: 13, flex: 1 },
  footer: { fontSize: 10, color: '#CBD5E1', textAlign: 'center' },
});

export default function TabLayout() {
  const { lang } = useLanguage();

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <Tabs key={lang} screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
              <Tabs.Screen name="index" />
              <Tabs.Screen name="map" />
              <Tabs.Screen name="explore" />
              </Tabs>
          </View>
          <WebBottomNav lang={lang} />
        </View>
      </View>
    );
  }

  return (
    <Tabs
      key={lang}
      initialRouteName="index"
      screenOptions={{
        tabBarActiveTintColor: colors.amber,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
          ...shadows.sm,
        },
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: lang === 'es' ? 'Inicio' : 'Home', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
      <Tabs.Screen name="map" options={{ title: lang === 'es' ? 'Mapa' : 'Map', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🗺️</Text> }} />
      <Tabs.Screen name="explore" options={{ title: lang === 'es' ? 'Comunidad' : 'Community', tabBarIcon: () => <Text style={{ fontSize: 22 }}>🐾</Text> }} />
    </Tabs>
  );
}
// build trigger
