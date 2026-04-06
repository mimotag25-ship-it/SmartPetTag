import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDog() {
      const { data, error } = await supabase.from('dogs').select('*').single();
      if (error) console.log('Error:', error.message);
      else setDog(data);
      setLoading(false);
    }
    loadDog();
  }, []);

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#C0392B" />
    </View>
  );

  if (!dog) return (
    <View style={styles.loader}>
      <Text style={styles.emptyText}>No dog found.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerGlow} />
      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <View style={styles.onlineDot} />
      </View>
      <View style={styles.avatarSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarEmoji}>🐕</Text>
          </View>
        </View>
        <Text style={styles.dogName}>{dog.name}</Text>
        <Text style={styles.dogBreed}>{dog.breed}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>🐾 {dog.age} yrs</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>📍 {dog.neighbourhood}</Text></View>
          <View style={[styles.badge, styles.badgeGreen]}><Text style={[styles.badgeText, { color: '#1D9E75' }]}>✓ Vaccinated</Text></View>
        </View>
      </View>

      <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/emergency')}>
        <Text style={styles.emergencyBtnEmoji}>🚨</Text>
        <View>
          <Text style={styles.emergencyBtnTitle}>{dog.name} Is Lost</Text>
          <Text style={styles.emergencyBtnSub}>Tap to instantly alert the community</Text>
        </View>
        <Text style={styles.emergencyBtnArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>12</Text>
          <Text style={styles.statLabel}>Park visits</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNum}>8</Text>
          <Text style={styles.statLabel}>Dog friends</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCard}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Profile</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{dog.owner_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{dog.owner_phone || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🐾</Text>
          <Text style={styles.infoLabel}>Personality</Text>
          <Text style={styles.infoValue}>{dog.personality}</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoLabel}>Area</Text>
          <Text style={styles.infoValue}>{dog.neighbourhood}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Badges</Text>
        <View style={styles.badgesGrid}>
          {[
            { icon: '🌳', name: 'Park Explorer', earned: true },
            { icon: '📸', name: 'Social Pup', earned: true },
            { icon: '🦸', name: 'Lost Dog Hero', earned: false },
            { icon: '🏆', name: 'Top Walker', earned: false },
          ].map((b, i) => (
            <View key={i} style={[styles.badgeCard, !b.earned && styles.badgeCardLocked]}>
              <Text style={styles.badgeCardIcon}>{b.icon}</Text>
              <Text style={styles.badgeCardName}>{b.name}</Text>
              {!b.earned && <Text style={styles.badgeCardLock}>🔒</Text>}
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  loader: { flex: 1, backgroundColor: '#050508', alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#aaa', fontSize: 14 },
  headerGlow: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 200, backgroundColor: '#C0392B', opacity: 0.05, borderRadius: 100 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic', letterSpacing: -0.5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D9E75' },
  avatarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#C0392B', padding: 4, marginBottom: 16 },
  avatarInner: { flex: 1, borderRadius: 50, backgroundColor: '#1a0505', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 48 },
  dogName: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  dogBreed: { fontSize: 14, color: '#666', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeGreen: { borderColor: '#0F6E56', backgroundColor: '#051a14' },
  badgeText: { fontSize: 11, color: '#888', fontWeight: '500' },
  emergencyBtn: { marginHorizontal: 16, backgroundColor: '#1a0505', borderRadius: 16, borderWidth: 1.5, borderColor: '#C0392B', padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 },
  emergencyBtnEmoji: { fontSize: 32 },
  emergencyBtnTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2, letterSpacing: 0.3 },
  emergencyBtnSub: { fontSize: 12, color: '#555' },
  emergencyBtnArrow: { color: '#C0392B', fontSize: 20, marginLeft: 'auto' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#C0392B', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#555' },
  statDivider: { width: 0.5, backgroundColor: '#1a1a1a', marginHorizontal: 8 },
  infoCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#444', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#141414' },
  infoIcon: { fontSize: 14, width: 24 },
  infoLabel: { fontSize: 13, color: '#555', width: 90 },
  infoValue: { fontSize: 13, color: '#ccc', flex: 1, textAlign: 'right' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 12, borderWidth: 0.5, borderColor: '#222', padding: 14, alignItems: 'center', gap: 6 },
  badgeCardLocked: { opacity: 0.35 },
  badgeCardIcon: { fontSize: 28 },
  badgeCardName: { fontSize: 11, color: '#888', fontWeight: '500', textAlign: 'center' },
  badgeCardLock: { fontSize: 10 },
});
