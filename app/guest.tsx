import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useLanguage, t } from '../lib/i18n';

export default function GuestScreen() {
  const [alerts, setAlerts] = useState([]);
  const [dogCount, setDogCount] = useState(0);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadData();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const { t } = useLanguage();

  async function loadData() {
    const { data: alertData } = await supabase
      .from('lost_alerts')
      .select('*')
      .eq('status', 'lost')
      .order('created_at', { ascending: false });
    if (alertData) setAlerts(alertData);
    const { count } = await supabase
      .from('dog_locations')
      .select('*', { count: 'exact', head: true })
      .neq('visibility', 'private');
    if (count) setDogCount(count);
  }

  function getTimeAgo(timestamp) {
    const mins = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.logo}>🐾 SmartPet Tag</Text>
          <Text style={styles.tagline}>The safety network for dogs in CDMX</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
            <Text style={styles.statNum}>{dogCount}</Text>
            <Text style={styles.statLabel}>Dogs protected nearby</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, alerts.length > 0 && { color: '#C0392B' }]}>{alerts.length}</Text>
            <Text style={[styles.statLabel, alerts.length > 0 && { color: '#C0392B' }]}>
              {alerts.length > 0 ? t('activeAlerts') + ' 🚨' : t('activeAlerts')}
            </Text>
          </View>
        </View>

        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Active alerts near you</Text>
            <Text style={styles.sectionSub}>Sign up to help find these dogs</Text>
            {alerts.map(alert => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertAvatar}>
                  <Text style={styles.alertEmoji}>🐕</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertDogName}>{alert.dog_name}</Text>
                  <Text style={styles.alertLocation}>📍 {alert.neighbourhood}</Text>
                  <Text style={styles.alertTime}>{getTimeAgo(alert.created_at)}</Text>
                </View>
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>LOST</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why dog owners in CDMX use SmartPet Tag</Text>
          {[
            { icon: '🚨', title: 'One tap lost alert', desc: 'Notify your entire neighbourhood in seconds. No flyers needed.' },
            { icon: '🗺️', title: 'Live dog map', desc: 'See dogs moving near you in real time.' },
            { icon: '🔗', title: 'Works without the app', desc: 'Anyone can report a sighting — even without downloading the app.' },
            { icon: '💬', title: 'Direct chat', desc: 'Coordinate directly with finders when your dog goes missing.' },
            { icon: '🖨️', title: 'Auto-generated poster', desc: 'Print a professional lost dog poster in 30 seconds.' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Protect your dog for free</Text>
          <Text style={styles.ctaSub}>Join {dogCount + 47} dog owners already on SmartPet Tag in CDMX</Text>
          <TouchableOpacity style={styles.signupBtn} onPress={() => router.push('/onboarding')}>
            <Text style={styles.signupBtnText}>Create free account 🐾</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 28, paddingBottom: 16, alignItems: 'center' },
  logo: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', fontStyle: 'italic', marginBottom: 8 },
  tagline: { fontSize: 15, color: '#555', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16, alignItems: 'center', position: 'relative' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D4AA', position: 'absolute', top: 12, right: 12 },
  statNum: { fontSize: 32, fontWeight: '800', color: '#00D4AA', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#555', textAlign: 'center' },
  section: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#444', marginBottom: 14 },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  alertAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a0505', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C0392B' },
  alertEmoji: { fontSize: 22 },
  alertDogName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  alertLocation: { fontSize: 12, color: '#555', marginBottom: 2 },
  alertTime: { fontSize: 11, color: '#444' },
  alertBadge: { backgroundColor: '#C0392B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  alertBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '800', letterSpacing: 1 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  featureIcon: { fontSize: 22, width: 32 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#555', lineHeight: 18 },
  ctaSection: { marginHorizontal: 16, backgroundColor: '#003d30', borderRadius: 16, borderWidth: 1, borderColor: '#00D4AA', padding: 20, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, textAlign: 'center' },
  ctaSub: { fontSize: 13, color: '#00D4AA', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  signupBtn: { backgroundColor: '#00D4AA', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10 },
  signupBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  loginBtn: { paddingVertical: 8 },
  loginBtnText: { color: '#555', fontSize: 13 },
});
