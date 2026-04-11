import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, RefreshControl } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, spacing, radius, typography, shadows, energyConfig, parkStatus } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

const PARKS = [
  { name: 'Parque España', dogs: 8, energy: 4, friendly: 7, reactive: 1, peak: '6pm', status: 'medium', lat: 19.4148, lng: -99.1762 },
  { name: 'Parque México', dogs: 14, energy: 3, friendly: 12, reactive: 2, peak: '7pm', status: 'high', lat: 19.4162, lng: -99.1748 },
  { name: 'Parque Hundido', dogs: 3, energy: 2, friendly: 3, reactive: 0, peak: '5pm', status: 'low', lat: 19.3892, lng: -99.1728 },
  { name: 'Parque Pushkin', dogs: 5, energy: 3, friendly: 5, reactive: 0, peak: '7pm', status: 'low', lat: 19.4122, lng: -99.1705 },
];

function EnergyBar({ level, size = 'md' }) {
  const barW = size === 'sm' ? 10 : 14;
  const barH = size === 'sm' ? 4 : 6;
  const config = energyConfig[level] || energyConfig[3];
  return (
    <View style={{ flexDirection: 'row', gap: 3, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={{
          width: barW, height: barH, borderRadius: 2,
          backgroundColor: i <= level ? config.color : colors.bgBorder,
        }} />
      ))}
    </View>
  );
}

function ParkCard({ park }) {
  const status = parkStatus[park.status];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (park.status === 'medium' || park.status === 'high') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])).start();
    }
  }, []);

  return (
    <TouchableOpacity style={[styles.parkCard, { borderColor: status.color + '40' }]}>
      <View style={styles.parkCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.parkName}>{park.name}</Text>
          <View style={styles.parkStatusRow}>
            <Animated.View style={[styles.parkDot, { backgroundColor: status.color, transform: [{ scale: pulseAnim }] }]} />
            <Text style={[styles.parkStatusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <View style={[styles.parkCountBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.parkCount, { color: status.color }]}>{park.dogs}</Text>
          <Text style={[styles.parkCountLabel, { color: status.color }]}>dogs</Text>
        </View>
      </View>
      <View style={styles.parkStats}>
        <View style={styles.parkStat}>
          <Text style={styles.parkStatIcon}>😊</Text>
          <Text style={styles.parkStatText}>{park.friendly} friendly</Text>
        </View>
        {park.reactive > 0 && (
          <View style={styles.parkStat}>
            <Text style={styles.parkStatIcon}>⚠️</Text>
            <Text style={[styles.parkStatText, { color: colors.amber }]}>{park.reactive} reactive</Text>
          </View>
        )}
        <View style={styles.parkStat}>
          <Text style={styles.parkStatIcon}>🕐</Text>
          <Text style={styles.parkStatText}>Peak: {park.peak}</Text>
        </View>
      </View>
      <EnergyBar level={park.energy} size="sm" />
    </TouchableOpacity>
  );
}

function PetCard({ dog, onEmergency, pendingAlert }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return (
    <View style={styles.petCard}>
      {/* Holographic shimmer */}
      <Animated.View style={[styles.shimmer, { opacity: shimmerOpacity }]} />

      <View style={styles.petCardContent}>
        <TouchableOpacity onPress={() => router.push('/edit-profile')}>
          <View style={styles.petPhotoWrap}>
            {dog.photo_url ? (
              <Image source={{ uri: dog.photo_url }} style={styles.petPhoto} />
            ) : (
              <View style={styles.petPhotoPlaceholder}>
                <Text style={styles.petEmoji}>{dog.emoji || '🐾'}</Text>
              </View>
            )}
            <View style={styles.petOnlineDot} />
          </View>
        </TouchableOpacity>

        <View style={styles.petInfo}>
          <View style={styles.petNameRow}>
            <Text style={styles.petName}>{dog.name}</Text>
            <View style={styles.petSpeciesBadge}>
              <Text style={styles.petSpeciesText}>{dog.breed?.split(' ')[0]}</Text>
            </View>
          </View>
          <Text style={styles.petOwner}>by {dog.owner_name}</Text>
          <EnergyBar level={5} />
          <View style={styles.petTagsRow}>
            {dog.personality?.split(',').slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.petTag}>
                <Text style={styles.petTagText}>{tag.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.petCardFooter}>
        <View style={styles.petStats}>
          <View style={styles.petStat}>
            <Text style={styles.petStatNum}>📍</Text>
            <Text style={styles.petStatLabel}>{dog.neighbourhood}</Text>
          </View>
          <View style={styles.petStat}>
            <Text style={styles.petStatNum}>{dog.age}</Text>
            <Text style={styles.petStatLabel}>years</Text>
          </View>
          {dog.vaccinated !== false && (
            <View style={styles.petStat}>
              <Text style={styles.petStatNum}>💉</Text>
              <Text style={styles.petStatLabel}>Vaccinated</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [stats, setStats] = useState({ alerts: 0, found: 0, sightings: 0, posts: 0 });
  const { t } = useLanguage();

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadPendingAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadAll() {
    await Promise.all([loadDog(), loadPendingAlerts(), loadAlerts(), loadStats()]);
    setLoading(false);
  }

  async function loadDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data } = await supabase.from('dogs').select('*').single();
      if (data) setDog(data);
      return;
    }
    const { data, error } = await supabase.from('dogs').select('*').eq('owner_email', user.email).single();
    if (error) {
      const { data: fallback } = await supabase.from('dogs').select('*').single();
      if (fallback) setDog(fallback);
    } else setDog(data);
  }

  async function loadPendingAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status_pending_owner', true).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) setPendingAlert(data[0]);
    else setPendingAlert(null);
  }

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost').order('created_at', { ascending: false }).limit(3);
    if (data) setAlerts(data);
  }

  async function loadStats() {
    const { data: alertData } = await supabase.from('lost_alerts').select('id, status').eq('owner_name', dog?.owner_name || '');
    const { data: sightingData } = await supabase.from('activity').select('id').eq('type', 'sighting');
    setStats({
      alerts: alertData?.length || 0,
      found: alertData?.filter(a => a.status === 'found').length || 0,
      sightings: sightingData?.length || 0,
      posts: 3,
    });
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  function getTimeAgo(ts) {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  if (loading) return (
    <View style={styles.loader}>
      <Text style={styles.loaderEmoji}>🐾</Text>
      <Text style={styles.loaderText}>Loading...</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋</Text>
          <Text style={styles.headerTitle}>SmartPet Tag</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/chat')}>
            <Text style={styles.headerBtnIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/emergency')}>
            <Text style={styles.headerBtnIcon}>🚨</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending alert banner */}
      {pendingAlert && (
        <TouchableOpacity
          style={styles.pendingBanner}
          onPress={() => router.push({ pathname: '/confirm-found', params: { alertId: pendingAlert.id } })}
        >
          <Text style={styles.pendingBannerEmoji}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingBannerTitle}>Someone found {pendingAlert.dog_name}!</Text>
            <Text style={styles.pendingBannerSub}>Tap to review and confirm — you have final say</Text>
          </View>
          <Text style={styles.pendingBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Pet card */}
      {dog && (
        <View style={styles.section}>
          <PetCard dog={dog} pendingAlert={pendingAlert} />
          <View style={styles.petActions}>
            <TouchableOpacity style={styles.emergencyBtn} onPress={() => router.push('/emergency')}>
              <Text style={styles.emergencyBtnEmoji}>🚨</Text>
              <View>
                <Text style={styles.emergencyBtnTitle}>{dog.name} Is Lost</Text>
                <Text style={styles.emergencyBtnSub}>Alert the community instantly</Text>
              </View>
              <Text style={styles.emergencyBtnArrow}>→</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
              <Text style={styles.editBtnText}>✏️ Edit profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Active alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>ACTIVE ALERTS NEARBY</Text>
            <Text style={styles.sectionCount}>{alerts.length}</Text>
          </View>
          {alerts.map(alert => (
            <TouchableOpacity key={alert.id} style={styles.alertCard} onPress={() => router.push('/(tabs)/explore')}>
              <View style={styles.alertAvatar}>
                {alert.dog_photo ? (
                  <Image source={{ uri: alert.dog_photo }} style={styles.alertPhoto} />
                ) : (
                  <Text style={{ fontSize: 22 }}>🐕</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertDogName}>{alert.dog_name}</Text>
                <Text style={styles.alertLocation}>📍 {alert.neighbourhood}</Text>
                <Text style={styles.alertTime}>{getTimeAgo(alert.created_at)}</Text>
              </View>
              <TouchableOpacity
                style={styles.alertHelpBtn}
                onPress={() => router.push({ pathname: '/found', params: { alertId: alert.id, dogName: alert.dog_name, ownerName: alert.owner_name, ownerPhone: alert.owner_phone, neighbourhood: alert.neighbourhood } })}
              >
                <Text style={styles.alertHelpBtnText}>Help</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Park intelligence */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🌳</Text>
          <Text style={styles.sectionTitle}>PARKS NEAR YOU</Text>
        </View>
        <Text style={styles.sectionSub}>Live dog activity — updated every 5 minutes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {PARKS.map((park, i) => <ParkCard key={i} park={park} />)}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>YOUR ACTIVITY</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: '🚨', value: stats.alerts, label: t('alertsTriggered') },
            { icon: '🐕', value: stats.found, label: t('dogsFound') },
            { icon: '👀', value: stats.sightings, label: t('sightingsReported') },
            { icon: '📸', value: stats.posts, label: t('postsMade') },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom links */}
      <View style={styles.bottomLinks}>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={styles.bottomLink}>{t('privacyPolicy')}</Text>
        </TouchableOpacity>
        <Text style={styles.bottomDot}>·</Text>
        <View style={styles.langRow}>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.bottomLink}>🇲🇽 ES</Text>
          </TouchableOpacity>
          <Text style={styles.bottomDot}>·</Text>
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.bottomLink}>🇺🇸 EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderEmoji: { fontSize: 48 },
  loaderText: { fontSize: 14, color: colors.textMuted },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 16 },
  headerGreeting: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, fontStyle: 'italic' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.bgBorder },
  headerBtnIcon: { fontSize: 18 },

  pendingBanner: { marginHorizontal: spacing.xl, marginBottom: 16, backgroundColor: '#1C1407', borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.amber, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadows.amber },
  pendingBannerEmoji: { fontSize: 24 },
  pendingBannerTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  pendingBannerSub: { fontSize: 11, color: colors.amber },
  pendingBannerArrow: { color: colors.amber, fontSize: 18 },

  section: { paddingHorizontal: spacing.xl, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emergency },
  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, flex: 1 },
  sectionCount: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.emergency, color: colors.white, fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginBottom: 12, marginTop: -8 },

  // Pet card
  petCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.amber + '40', padding: 16, marginBottom: 12, overflow: 'hidden', ...shadows.amber },
  shimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: colors.amber },
  petCardContent: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  petPhotoWrap: { position: 'relative' },
  petPhoto: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: colors.amber },
  petPhotoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.amber },
  petEmoji: { fontSize: 40 },
  petOnlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.safe, borderWidth: 2, borderColor: colors.bgCard },
  petInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  petNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  petSpeciesBadge: { backgroundColor: colors.amberDim, borderWidth: 0.5, borderColor: colors.amber, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2 },
  petSpeciesText: { fontSize: 10, color: colors.amber, fontWeight: '700' },
  petOwner: { fontSize: 11, color: colors.textMuted },
  petTagsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  petTag: { backgroundColor: colors.bgBorder, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  petTagText: { fontSize: 10, color: colors.textSecondary },
  petCardFooter: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, paddingTop: 12 },
  petStats: { flexDirection: 'row', gap: 16 },
  petStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  petStatNum: { fontSize: 13 },
  petStatLabel: { fontSize: 11, color: colors.textMuted },

  petActions: { gap: 8 },
  emergencyBtn: { backgroundColor: colors.emergencyDim, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.emergency, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyBtnEmoji: { fontSize: 28 },
  emergencyBtnTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  emergencyBtnSub: { fontSize: 11, color: colors.textMuted },
  emergencyBtnArrow: { color: colors.emergency, fontSize: 18, marginLeft: 'auto' },
  editBtn: { backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 10, alignItems: 'center' },
  editBtnText: { fontSize: 13, color: colors.textSecondary },

  // Alerts
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.emergencyDim, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.emergency + '60', padding: 12, marginBottom: 8 },
  alertAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.emergencyDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.emergency },
  alertPhoto: { width: 44, height: 44, borderRadius: 22 },
  alertDogName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  alertLocation: { fontSize: 11, color: colors.textMuted, marginBottom: 1 },
  alertTime: { fontSize: 10, color: colors.textMuted },
  alertHelpBtn: { backgroundColor: colors.emergency, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  alertHelpBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },

  // Parks
  parkCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 0.5, padding: 14, width: 200 },
  parkCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  parkName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  parkStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  parkDot: { width: 6, height: 6, borderRadius: 3 },
  parkStatusText: { fontSize: 11, fontWeight: '600' },
  parkCountBadge: { borderRadius: radius.md, padding: 8, alignItems: 'center', minWidth: 44 },
  parkCount: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  parkCountLabel: { fontSize: 9, fontWeight: '600' },
  parkStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  parkStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  parkStatIcon: { fontSize: 12 },
  parkStatText: { fontSize: 11, color: colors.textSecondary },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 22 },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.amber },
  statLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

  bottomLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: spacing.xl, marginBottom: 8 },
  bottomLink: { fontSize: 11, color: colors.textMuted },
  bottomDot: { fontSize: 11, color: colors.textMuted },
  langRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
