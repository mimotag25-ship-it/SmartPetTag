import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stats, setStats] = useState({ alerts: 0, found: 0, sightings: 0, posts: 0 });

  useEffect(() => {
    loadDog();
    loadPendingAlerts();
    loadStats();
    const interval = setInterval(loadPendingAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data, error } = await supabase.from('dogs').select('*').single();
      if (!error) setDog(data);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('dogs').select('*').eq('owner_email', user.email).single();
    if (error) {
      const { data: fallback } = await supabase.from('dogs').select('*').single();
      if (fallback) setDog(fallback);
    } else setDog(data);
    setLoading(false);
  }

  async function uploadDogPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const fileName = `dog-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
      await supabase.from('dogs').update({ photo_url: data.publicUrl }).eq('id', dog.id);
      await supabase.from('dog_locations').update({ photo_url: data.publicUrl }).eq('dog_name', dog.name);
      setDog(d => ({ ...d, photo_url: data.publicUrl }));
    } catch (e) { console.log('Photo error:', e.message); }
    setUploadingPhoto(false);
  }

  async function loadStats() {
    const { data: alertData } = await supabase.from('lost_alerts').select('id, status').eq('owner_name', dog?.owner_name || '');
    const { data: sightingData } = await supabase.from('activity').select('id').eq('type', 'sighting');
    const alerts = alertData?.length || 0;
    const found = alertData?.filter(a => a.status === 'found').length || 0;
    const sightings = sightingData?.length || 0;
    setStats({ alerts, found, sightings, posts: 3 });
  }

  async function loadPendingAlerts() {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('lost_alerts')
      .select('*')
      .eq('status_pending_owner', true)
      .eq('owner_name', user?.email ? user.email : '')
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) setPendingAlert(data[0]);
    else setPendingAlert(null);
  }

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

      {/* PENDING CONFIRMATION BANNER */}
      {pendingAlert && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push({ pathname: '/confirm-found', params: { alertId: pendingAlert.id } })}
        >
          <View style={styles.pendingBannerLeft}>
            <Text style={styles.pendingBannerEmoji}>🔔</Text>
            <View>
              <Text style={styles.pendingBannerTitle}>Someone found {pendingAlert.dog_name}!</Text>
              <Text style={styles.pendingBannerSub}>Tap to review and confirm → you have final say</Text>
            </View>
          </View>
          <Text style={styles.pendingBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarRing} onPress={uploadDogPhoto}>
          {dog.photo_url ? (
            <Image source={{ uri: dog.photo_url }} style={styles.avatarPhoto} />
          ) : (
            <View style={styles.avatarInner}>
              <Text style={styles.avatarEmoji}>🐕</Text>
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditText}>{uploadingPhoto ? '...' : '📷'}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.dogName}>{dog.name}</Text>
        <Text style={styles.dogBreed}>{dog.breed}</Text>
        <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/edit-profile')}>
          <Text style={styles.editProfileBtnText}>✏️ Edit full profile</Text>
        </TouchableOpacity>
        <View style={styles.badgeRow}>
          <View style={styles.badge}><Text style={styles.badgeText}>🐾 {dog.age} yrs</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>📍 {dog.neighbourhood}</Text></View>
          <View style={[styles.badge, styles.badgeGreen]}><Text style={[styles.badgeText, { color: '#1D9E75' }]}>✓ Vaccinated</Text></View>
        </View>
      </View>

      <TouchableOpacity style={styles.chatBtn} onPress={() => router.push('/chat')}>
        <Text style={styles.chatBtnEmoji}>💬</Text>
        <View>
          <Text style={styles.chatBtnTitle}>Messages</Text>
          <Text style={styles.chatBtnSub}>Chat with nearby dog owners</Text>
        </View>
        <Text style={styles.chatBtnArrow}>→</Text>
      </TouchableOpacity>

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
        <Text style={styles.cardTitle}>Activity</Text>
        <View style={styles.activityGrid}>
          {[
            { icon: '🚨', value: stats.alerts, label: 'Alerts triggered' },
            { icon: '🐕', value: stats.found, label: 'Dogs found' },
            { icon: '👀', value: stats.sightings, label: 'Sightings reported' },
            { icon: '📸', value: stats.posts, label: 'Posts made' },
          ].map((s, i) => (
            <View key={i} style={styles.activityCard}>
              <Text style={styles.activityCardIcon}>{s.icon}</Text>
              <Text style={styles.activityCardValue}>{s.value}</Text>
              <Text style={styles.activityCardLabel}>{s.label}</Text>
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
  pendingBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1200', borderRadius: 16, borderWidth: 1.5, borderColor: '#F5A623', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pendingBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pendingBannerEmoji: { fontSize: 28 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  pendingBannerSub: { fontSize: 11, color: '#F5A623' },
  pendingBannerArrow: { color: '#F5A623', fontSize: 18 },
  avatarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
  avatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#C0392B', padding: 4, marginBottom: 16 },
  avatarInner: { flex: 1, borderRadius: 50, backgroundColor: '#1a0505', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarPhoto: { width: 102, height: 102, borderRadius: 51 },
  avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: '#00D4AA', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#050508' },
  avatarEditText: { fontSize: 11 },
  avatarEmoji: { fontSize: 48 },
  dogName: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  dogBreed: { fontSize: 14, color: '#666', marginBottom: 10 },
  editProfileBtn: { backgroundColor: '#0d0d0d', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 0.5, borderColor: '#1a1a1a', marginBottom: 14 },
  editProfileBtnText: { fontSize: 12, color: '#555', fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeGreen: { borderColor: '#0F6E56', backgroundColor: '#051a14' },
  badgeText: { fontSize: 11, color: '#888', fontWeight: '500' },
  chatBtn: { marginHorizontal: 16, backgroundColor: '#003d30', borderRadius: 16, borderWidth: 1, borderColor: '#00D4AA', padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  chatBtnEmoji: { fontSize: 26 },
  chatBtnTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  chatBtnSub: { fontSize: 12, color: '#00D4AA' },
  chatBtnArrow: { color: '#00D4AA', fontSize: 18, marginLeft: 'auto' },
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
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityCard: { flex: 1, minWidth: '45%', backgroundColor: '#111', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, alignItems: 'center', gap: 4 },
  activityCardIcon: { fontSize: 24, marginBottom: 4 },
  activityCardValue: { fontSize: 26, fontWeight: '800', color: '#00D4AA' },
  activityCardLabel: { fontSize: 10, color: '#555', textAlign: 'center', fontWeight: '500' },
});
