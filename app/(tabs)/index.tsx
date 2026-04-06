import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { sendLostDogAlert } from '../../lib/notifications';

export default function Index() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLost, setIsLost] = useState(false);
  const [alerting, setAlerting] = useState(false);

  useEffect(() => {
    async function loadDog() {
      const { data, error } = await supabase.from('dogs').select('*').single();
      if (error) console.log('Error:', error.message);
      else setDog(data);
      setLoading(false);
    }
    loadDog();
  }, []);

  async function toggleLostAlert() {
    if (!dog) return;
    setAlerting(true);
    if (!isLost) {
      const { error } = await supabase.from('lost_alerts').insert({
        dog_id: dog.id,
        dog_name: dog.name,
        owner_name: dog.owner_name,
        owner_phone: dog.owner_phone,
        neighbourhood: dog.neighbourhood,
        status: 'lost',
      });
      if (error) console.log('Alert error:', error.message);
      else { setIsLost(true); await sendLostDogAlert(dog); }
    } else {
      const { error } = await supabase.from('lost_alerts')
        .update({ status: 'found' })
        .eq('dog_name', dog.name)
        .eq('status', 'lost');
      if (error) console.log('Cancel error:', error.message);
      else setIsLost(false);
    }
    setAlerting(false);
  }

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#E8640A" />
    </View>
  );

  if (!dog) return (
    <View style={styles.loader}>
      <Text style={styles.emptyText}>No dog found.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header glow */}
      <View style={styles.headerGlow} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <View style={styles.onlineDot} />
      </View>

      {/* Avatar section */}
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

      {/* Stats row */}
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

      {/* Info card */}
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
          <Text style={styles.infoValue}>{dog.owner_phone}</Text>
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

      {/* Lost dog alert button */}
      <TouchableOpacity
        style={[styles.alertBtn, isLost && styles.alertBtnActive]}
        onPress={toggleLostAlert}
        disabled={alerting}
      >
        {alerting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.alertBtnInner}>
            <Text style={styles.alertBtnIcon}>{isLost ? '✅' : '🚨'}</Text>
            <View>
              <Text style={styles.alertBtnTitle}>{isLost ? 'Cancel Lost Alert' : 'My Dog Is Lost!'}</Text>
              <Text style={styles.alertBtnSub}>{isLost ? 'Tap to mark as found' : 'Instantly alert nearby users'}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {isLost && (
        <View style={styles.alertActive}>
          <View style={styles.alertActiveDot} />
          <Text style={styles.alertActiveText}>Alert active — nearby users are being notified</Text>
        </View>
      )}

      {/* Gamification badges */}
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
  headerGlow: { position: 'absolute', top: 0, left: '25%', right: '25%', height: 200, backgroundColor: '#E8640A', opacity: 0.06, borderRadius: 100 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic', letterSpacing: -0.5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1D9E75' },
  avatarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#E8640A', padding: 4, marginBottom: 16 },
  avatarInner: { flex: 1, borderRadius: 50, backgroundColor: '#1a0e00', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 48 },
  dogName: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  dogBreed: { fontSize: 14, color: '#666', marginBottom: 14 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeGreen: { borderColor: '#0F6E56', backgroundColor: '#051a14' },
  badgeText: { fontSize: 11, color: '#888', fontWeight: '500' },
  statsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16, marginBottom: 12 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '700', color: '#E8640A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#555' },
  statDivider: { width: 0.5, backgroundColor: '#1a1a1a', marginHorizontal: 8 },
  infoCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#444', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#141414' },
  infoIcon: { fontSize: 14, width: 24 },
  infoLabel: { fontSize: 13, color: '#555', width: 90 },
  infoValue: { fontSize: 13, color: '#ccc', flex: 1, textAlign: 'right' },
  alertBtn: { marginHorizontal: 16, backgroundColor: '#1a0505', borderRadius: 16, borderWidth: 1, borderColor: '#C0392B', padding: 18, marginBottom: 12 },
  alertBtnActive: { backgroundColor: '#051a10', borderColor: '#0F6E56' },
  alertBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  alertBtnIcon: { fontSize: 28 },
  alertBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  alertBtnSub: { fontSize: 12, color: '#555' },
  alertActive: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  alertActiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C0392B' },
  alertActiveText: { fontSize: 12, color: '#C0392B' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 12, borderWidth: 0.5, borderColor: '#222', padding: 14, alignItems: 'center', gap: 6 },
  badgeCardLocked: { opacity: 0.35 },
  badgeCardIcon: { fontSize: 28 },
  badgeCardName: { fontSize: 11, color: '#888', fontWeight: '500', textAlign: 'center' },
  badgeCardLock: { fontSize: 10 },
});