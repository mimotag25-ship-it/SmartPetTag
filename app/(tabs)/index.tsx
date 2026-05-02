import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Animated, RefreshControl, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, spacing, shadows } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

const { width } = Dimensions.get('window');

const PARKS = [
  { name: 'Parque España', dogs: 8, energy: 4, friendly: 7, reactive: 1, status: 'medium', emoji: '🌳', lat: 19.4150, lng: -99.1714 },
  { name: 'Parque México', dogs: 14, energy: 5, friendly: 10, reactive: 4, status: 'high', emoji: '🌲', lat: 19.4119, lng: -99.1691 },
  { name: 'Parque Hundido', dogs: 3, energy: 2, friendly: 3, reactive: 0, status: 'low', emoji: '🌿', lat: 19.3782, lng: -99.1793 },
  { name: 'Jardín Pushkin', dogs: 5, energy: 3, friendly: 5, reactive: 0, status: 'low', emoji: '🍃', lat: 19.4186, lng: -99.1580 },
  { name: 'Bosque de Chapultepec', dogs: 22, energy: 4, friendly: 18, reactive: 4, status: 'high', emoji: '🌲', lat: 19.4204, lng: -99.1892 },
  { name: 'Parque Lincoln', dogs: 9, energy: 3, friendly: 8, reactive: 1, status: 'medium', emoji: '🌳', lat: 19.4322, lng: -99.1944 },
  { name: 'Parque Caninas Roma', dogs: 6, energy: 4, friendly: 6, reactive: 0, status: 'medium', emoji: '🐕', lat: 19.4155, lng: -99.1603 },
  { name: 'Parque Coyoacán', dogs: 11, energy: 3, friendly: 10, reactive: 1, status: 'medium', emoji: '🌳', lat: 19.3509, lng: -99.1618 },
  { name: 'Parque Viveros', dogs: 7, energy: 2, friendly: 7, reactive: 0, status: 'low', emoji: '🌿', lat: 19.3545, lng: -99.1751 },
  { name: 'Parque Masayoshi Ohira', dogs: 4, energy: 3, friendly: 4, reactive: 0, status: 'low', emoji: '🍃', lat: 19.3891, lng: -99.1734 },
];

const STATUS_CONFIG = {
  low: { color: '#10B981', label: 'Perfect time', bg: '#ECFDF5' },
  medium: { color: '#F59E0B', label: 'Busy now', bg: '#FEF3C7' },
  high: { color: '#EF4444', label: 'Very crowded', bg: '#FFF1F1' },
};

const ENERGY_COLORS = ['#6366F1', '#6366F1', '#10B981', '#F59E0B', '#F97316', '#EF4444'];


function ParkCard({ park }) {
  const config = STATUS_CONFIG[park.status];
  const pulseRef = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (park.status !== 'low') {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseRef, { toValue: 1.3, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseRef, { toValue: 1, duration: 800, useNativeDriver: false }),
      ])).start();
    }
  }, []);
  return (
    <TouchableOpacity style={[s.parkCard, { borderColor: config.color + '50', backgroundColor: config.bg }]} onPress={() => router.push({ pathname: '/(tabs)/map', params: { park: park.name, lat: park.lat, lng: park.lng } })}>
      <View style={s.parkCardTop}>
        <Text style={s.parkEmoji}>{park.emoji}</Text>
        <View style={[s.parkCountBadge, { backgroundColor: config.color + '20' }]}>
          <Text style={[s.parkCount, { color: config.color }]}>{park.dogs}</Text>
          <Text style={[s.parkCountSub, { color: config.color }]}>dogs</Text>
        </View>
      </View>
      <Text style={s.parkName}>{park.name}</Text>
      <View style={s.parkStatusRow}>
        <Animated.View style={[s.parkDot, { backgroundColor: config.color, transform: [{ scale: pulseRef }] }]} />
        <Text style={[s.parkStatus, { color: config.color }]}>{config.label}</Text>
      </View>
      <View style={s.parkMeta}>
        <Text style={s.parkMetaText}>😊 {park.friendly} friendly</Text>
        {park.reactive > 0 && <Text style={[s.parkMetaText, { color: colors.amber }]}>⚠️ {park.reactive} reactive</Text>}
      </View>
          <Text style={{ fontSize: 10, color: config.color, marginTop: 8, textAlign: 'right', fontWeight: '600' }}>View on map →</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingAlert, setPendingAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ alerts: 0, found: 0, sightings: 0, posts: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function profileCompletion(dog) {
    if (!dog) return 0;
    const fields = ['photo_url', 'breed', 'age', 'colour', 'size', 'neighbourhood', 'owner_phone', 'personality', 'behaviour_notes', 'if_found_instructions'];
    const filled = fields.filter(f => dog[f] && String(dog[f]).trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }
  const [userLat, setUserLat] = useState(19.4136);
  const [userLng, setUserLng] = useState(-99.1716);
  const { t, lang, setLang } = useLanguage();

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  const nearbyParks = PARKS
    .map(p => ({ ...p, distance: distanceKm(userLat, userLng, p.lat, p.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  // Animations
  const shimmerAnim = useRef(new Animated.Value(-width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const cardEntryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAll();
    startAnimations();
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {}
      );
    }
  }, []);

  function startAnimations() {
    // Shimmer sweep
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: width * 2, duration: 2400, useNativeDriver: false })
    ).start();
    // Emergency pulse
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 900, useNativeDriver: false }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
    ])).start();
    // Glow breathe
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.8, duration: 1800, useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0.4, duration: 1800, useNativeDriver: false }),
    ])).start();
    // Card entry
    Animated.spring(cardEntryAnim, { toValue: 1, tension: 50, friction: 10, useNativeDriver: false }).start();
  }

  async function loadAll() {
    await Promise.all([loadDog(), loadPendingAlerts(), loadAlerts()]);
    setLoading(false);
  }

  async function resolveMyAlert() {
    if (!pendingAlert) return;
    await supabase.from('lost_alerts').update({ status: 'found' }).eq('id', pendingAlert.id);
    setPendingAlert(null);
    alert('Alert resolved — welcome home ' + dog?.name + '! 🎉');
  }

  async function loadDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); router.replace('/guest'); return; }
    // Try up to 3 times with delay — onboarding DB write may still be in progress
    let data = null;
    for (let i = 0; i < 3; i++) {
      const { data: result } = await supabase.from('dogs').select('*').eq('owner_email', user.email).single();
      if (result) { data = result; break; }
      if (i < 2) await new Promise(r => setTimeout(r, 1000));
    }
    if (!data) {
      router.replace('/onboarding');
      return;
    }
    setDog(data);
    loadStats(data);
    checkActiveAlertForDog(data);
    checkOutsideZone(data);
  }

  async function checkOutsideZone(dogData) {
    if (!dogData?.safe_zone_active) return;
    const { data } = await supabase.from('dog_locations')
      .select('lat,lng,outside_zone')
      .eq('dog_name', dogData.name)
      .single();
    if (data?.outside_zone) {
      const msg = lang === 'es'
        ? `⚠️ ${dogData.name} está fuera de su zona segura`
        : `⚠️ ${dogData.name} is outside their safe zone`;
      if (typeof window !== 'undefined') {
        const sendAlert = window.confirm(
          (lang === 'es'
            ? `${dogData.name} ha salido de su zona segura. ¿Quieres enviar una alerta a toda la comunidad?`
            : `${dogData.name} has left their safe zone. Send a full community alert?`)
        );
        if (sendAlert) router.push('/emergency');
      }
    }
  }

  async function checkActiveAlertForDog(dogData) {
    if (!dogData) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('lost_alerts')
      .select('*')
      .eq('dog_name', dogData.name)
      .eq('status', 'lost')
      .single();
    if (data) setPendingAlert(data);
  }

  async function loadStats(dogData) {
    const { data: alertData } = await supabase.from('lost_alerts').select('id, status').eq('owner_name', dogData?.owner_name || '');
    setStats({
      alerts: alertData?.length || 0,
      found: alertData?.filter(a => a.status === 'found').length || 0,
      sightings: 3,
      posts: 5,
    });
  }

  async function loadPendingAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status_pending_owner', true).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) setPendingAlert(data[0]);
  }

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost').order('created_at', { ascending: false }).limit(3);
    if (data) setAlerts(data);
  }

  async function uploadDogPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const fileName = `dog-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
        await supabase.from('dogs').update({ photo_url: data.publicUrl }).eq('id', dog.id);
        await supabase.from('dog_locations').update({ photo_url: data.publicUrl }).eq('dog_name', dog.name);
        setDog(d => ({ ...d, photo_url: data.publicUrl }));
      }
    } catch (e) {}
    setUploadingPhoto(false);
  }

  function getTimeAgo(ts) {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  const tags = dog?.personality?.split(',').map(t => t.trim()).filter(Boolean) || [];

  if (loading) return (
    <View style={s.loader}>
      <Text style={s.loaderEmoji}>🐾</Text>
    </View>
  );

  if (!dog) return (
    <View style={s.loader}>
      <Text style={s.loaderEmoji}>🐾</Text>
    </View>
  );

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadAll(); setRefreshing(false); }} tintColor={colors.amber} />}
    >
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.topBarLogo}>
          <View style={s.topBarLogoMark}>
            <View style={s.topBarShield}>
              <View style={s.topBarPaw} />
            </View>
          </View>
          <View>
            <Text style={s.appName}>SmartPet Tag</Text>
            <Text style={s.appSub}>{lang === 'es' ? 'Red de seguridad' : 'Safety Network'}</Text>
          </View>
        </View>
        <View style={s.topBarActions}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/chat')}>
            <Text style={s.iconBtnText}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, s.iconBtnAlert]} onPress={() => router.push('/edit-profile')}>
            <Text style={s.iconBtnText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pending alert banner */}
      {pendingAlert && (
        <TouchableOpacity style={s.pendingBanner} onPress={() => router.push({ pathname: '/confirm-found', params: { alertId: pendingAlert.id } })}>
          <View style={s.pendingBannerDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.pendingBannerTitle}>Someone found {pendingAlert.dog_name}!</Text>
            <Text style={s.pendingBannerSub}>Tap to confirm — you have final say</Text>
          </View>
          <Text style={s.pendingBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* POKEMON CARD */}
      {dog && (
        <Animated.View style={[s.petCard, { opacity: cardEntryAnim, transform: [{ scale: cardEntryAnim.interpolate({ inputRange: [0,1], outputRange: [0.97, 1] }) }] }]}>
          {/* Card header */}
          <View style={s.petCardHeader}>
            <View style={s.petCardBadge}>
              <View style={s.petCardBadgeDot} />
              <Text style={s.petCardBadgeText}>{lang === 'es' ? 'PROTEGIDO' : 'PROTECTED'}</Text>
            </View>
            <Text style={s.petCardDays}>{Math.floor((new Date() - new Date(dog.created_at || Date.now())) / 86400000) || 1} {lang === 'es' ? 'días' : 'days'}</Text>
          </View>

          {/* Hero section — photo + info side by side */}
          <View style={s.petCardHero}>
            <TouchableOpacity onPress={uploadDogPhoto} style={s.petCardPhotoWrap}>
              {dog.photo_url ? (
                <Image source={{ uri: dog.photo_url }} style={s.petCardPhoto} resizeMode="cover" />
              ) : (
                <View style={s.petCardPhotoEmpty}>
                  <Text style={{ fontSize: 48 }}>{dog.emoji || '🐾'}</Text>
                  <Text style={s.petCardPhotoHint}>{uploadingPhoto ? '...' : lang === 'es' ? 'Agregar foto' : 'Add photo'}</Text>
                </View>
              )}
              <View style={s.petCardOnline} />
            </TouchableOpacity>

            <View style={s.petCardInfo}>
              <Text style={s.petCardName}>{dog.name}</Text>
              <Text style={s.petCardBreed}>{dog.breed}</Text>
              {dog.age && <Text style={s.petCardDetail}>🎂 {dog.age} {lang === 'es' ? 'años' : 'yrs'}</Text>}
              {dog.neighbourhood && <Text style={s.petCardDetail}>📍 {dog.neighbourhood}</Text>}
              <View style={s.petCardTagsRow}>
                {tags.slice(0, 2).map((tag, i) => (
                  <View key={i} style={s.petCardTag}>
                    <Text style={s.petCardTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={s.petCardDivider} />

          {/* Stats row */}
          <View style={s.petCardStats}>
            <View style={s.petCardStat}>
              <Text style={s.petCardStatNum}>{Math.floor((new Date() - new Date(dog.created_at || Date.now())) / 86400000) || 1}</Text>
              <Text style={s.petCardStatLabel}>{lang === 'es' ? 'Días' : 'Days'}</Text>
            </View>
            <View style={s.petCardStatLine} />

            <View style={s.petCardStat}>
              <View style={s.petCardLiveDot} />
              <Text style={s.petCardStatLabel}>{lang === 'es' ? 'En vivo' : 'Live'}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={s.petCardActions}>
            <TouchableOpacity style={s.petCardAction} onPress={() => router.push({ pathname: '/pet-profile', params: { dogName: dog.name } })}>
              <Text style={s.petCardActionIcon}>👤</Text>
              <Text style={s.petCardActionText}>{lang === 'es' ? 'Ver perfil' : 'Profile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.petCardAction} onPress={() => router.push('/edit-profile')}>
              <Text style={s.petCardActionIcon}>✏️</Text>
              <Text style={s.petCardActionText}>{lang === 'es' ? 'Editar' : 'Edit'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.petCardAction} onPress={async () => { try { const { Share } = require('react-native'); await Share.share({ message: `🐾 Meet ${dog?.name}! smartpettag.vercel.app/public-profile?dogName=${dog?.name}` }); } catch(e) {} }}>
              <Text style={s.petCardActionIcon}>🔗</Text>
              <Text style={s.petCardActionText}>{lang === 'es' ? 'Compartir' : 'Share'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.petCardAction, s.petCardActionAlert]} onPress={() => router.push('/emergency')}>
              <Text style={s.petCardActionIcon}>🚨</Text>
              <Text style={[s.petCardActionText, { color: '#EF4444' }]}>{lang === 'es' ? 'Alerta' : 'Alert'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}



      {/* Active alerts */}
      {alerts.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionAlertDot} />
            <Text style={s.sectionTitle}>ACTIVE ALERTS NEARBY</Text>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>{alerts.length}</Text></View>
          </View>
          {alerts.map(alert => (
            <TouchableOpacity key={alert.id} style={s.alertRow} onPress={() => router.push('/(tabs)/explore')}>
              <View style={s.alertRowAvatar}>
                {alert.dog_photo
                  ? <Image source={{ uri: alert.dog_photo }} style={s.alertRowPhoto} />
                  : <Text style={{ fontSize: 20 }}>🐕</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertRowName}>{alert.dog_name}</Text>
                <Text style={s.alertRowLoc}>📍 {alert.neighbourhood} · {getTimeAgo(alert.created_at)}</Text>
              </View>
              <TouchableOpacity style={s.alertHelpBtn} onPress={() => router.push({ pathname: '/found', params: { alertId: alert.id, dogName: alert.dog_name, ownerName: alert.owner_name, ownerPhone: alert.owner_phone, neighbourhood: alert.neighbourhood } })}>
                <Text style={s.alertHelpBtnText}>Help</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Park Intelligence */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionIcon}>🌳</Text>
          <Text style={s.sectionTitle}>PARK INTELLIGENCE</Text>
        </View>
        <Text style={s.sectionSub}>Live dog activity — updated every 5 min</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {nearbyParks.map((park, i) => <ParkCard key={i} park={park} />)}
        </ScrollView>
      </View>

      {/* Bottom links */}
      <View style={s.footer}>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={s.footerLink}>{t('privacyPolicy')}</Text>
        </TouchableOpacity>
        <Text style={s.footerDot}>·</Text>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={s.footerLink}>About SmartPet Tag</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.langToggle}
          onPress={() => {
            const newLang = lang === 'es' ? 'en' : 'es';
            setLang(newLang);
            if (typeof localStorage !== 'undefined') localStorage.setItem('spt_lang', newLang);
          }}
        >
          <Text style={s.langToggleText}>{lang === 'es' ? '🇺🇸 English' : '🇲🇽 Español'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loaderEmoji: { fontSize: 48 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  appName: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5, fontStyle: 'italic' },
  appSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  topBarActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.bgBorder },
  iconBtnAlert: { backgroundColor: '#FFF1F1', borderColor: colors.emergency + '60' },
  iconBtnText: { fontSize: 17 },

  foundMyselfBtn: { backgroundColor: '#ECFDF5', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 0.5, borderTopWidth: 0, borderColor: '#10B981', marginBottom: 8 },
  foundMyselfBtnText: { color: '#10B981', fontSize: 12, fontWeight: '700' },
  pendingBanner: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#FEF3C7', borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.amber, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingBannerDot: { width: 8, height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.amber },
  pendingBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 1 },
  pendingBannerSub: { fontSize: 11, color: colors.amber },
  pendingBannerArrow: { color: colors.amber, fontSize: 16 },

  // POKEMON CARD
  pokemonCardOld: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#0F172A',
    borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.amber + '60',
    padding: 20, overflow: 'hidden',
    shadowColor: colors.amber, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  petCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  petCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  petCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  petCardBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  petCardBadgeText: { fontSize: 10, fontWeight: '800', color: '#10B981', letterSpacing: 1 },
  petCardDays: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  petCardHero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  petCardPhotoWrap: { position: 'relative', flexShrink: 0 },
  petCardPhoto: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#F59E0B' },
  petCardPhotoEmpty: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#E2E8F0', backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', gap: 4 },
  petCardPhotoHint: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
  petCardOnline: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2.5, borderColor: '#FFFFFF' },
  petCardInfo: { flex: 1, gap: 3 },
  petCardName: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  petCardBreed: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  petCardDetail: { fontSize: 12, color: '#94A3B8' },
  petCardTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  petCardTag: { backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  petCardTagText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  petCardDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 20 },
  petCardStats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  petCardStat: { flex: 1, alignItems: 'center', gap: 2 },
  petCardStatNum: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  petCardStatLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
  petCardStatLine: { width: 1, height: 28, backgroundColor: '#E2E8F0' },
  petCardLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginBottom: 2 },
  petCardActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  petCardAction: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4, borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  petCardActionAlert: { borderRightWidth: 0 },
  petCardActionIcon: { fontSize: 18 },
  petCardActionText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  shimmerStrip: { position: 'absolute', top: 0, left: 0, width: 120, height: '100%', backgroundColor: 'rgba(245,158,11,0.06)', transform: [{ skewX: '-20deg' }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTypeBadge: { backgroundColor: colors.amberDim, borderWidth: 0.5, borderColor: colors.amber, borderRadius: 6, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  cardTypeText: { fontSize: 9, color: colors.amber, fontWeight: '800', letterSpacing: 1 },
  cardHpWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHpLabel: { fontSize: 9, color: colors.textMuted, fontWeight: '700', letterSpacing: 1 },
  cardHpBars: { flexDirection: 'row', gap: 3 },
  hpBar: { width: 18, height: 6, borderRadius: 3 },
  cardName: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, letterSpacing: -1, marginBottom: 2 },
  cardSubName: { fontSize: 12, color: colors.textMuted, marginBottom: 16 },

  cardPhotoWrap: { alignItems: 'center', marginBottom: 16, position: 'relative' },
  cardPhotoGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, overflow: 'hidden', backgroundColor: colors.amber, top: -10, alignSelf: 'center', zIndex: 0 },
  cardPhoto: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', borderWidth: 3, borderColor: colors.amber, zIndex: 1 },
  cardPhotoPlaceholder: { width: 160, height: 160, borderRadius: 80, overflow: 'hidden', borderWidth: 3, borderColor: colors.amber, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', zIndex: 1, gap: 8 },
  cardPhotoEmoji: { fontSize: 64 },
  cardPhotoHint: { fontSize: 11, color: colors.amber },
  cardPhotoOnline: { position: 'absolute', bottom: 8, right: '28%', width: 16, height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: '#10B981', borderWidth: 2.5, borderColor: '#0F172A', zIndex: 2 },

  cardTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  cardTag: { backgroundColor: '#E2E8F0', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: '#E2E8F0' },
  cardTagText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  cardStats: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 14, overflow: 'hidden', padding: 14, marginBottom: 14 },
  cardStat: { flex: 1, alignItems: 'center' },
  cardStatNum: { fontSize: 22, fontWeight: '900', color: colors.amber, letterSpacing: -0.5 },
  cardStatLabel: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  cardStatDivider: { width: 0.5, backgroundColor: colors.bgBorder },

  cardActions: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  cardActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4 },
  cardActionDivider: { width: 0.5, backgroundColor: colors.bgBorder },
  cardActionIcon: { fontSize: 18 },
  cardActionText: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },

  // Actions
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  emergencyBtn: { flex: 1, backgroundColor: '#FFF1F1', borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.emergency, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: colors.emergency, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  emergencyBtnIcon: { fontSize: 26 },
  emergencyBtnTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: 1 },
  emergencyBtnSub: { fontSize: 10, color: '#64748B' },
  emergencyBtnArrow: { color: colors.emergency, fontSize: 16 },
  completionWrap: { backgroundColor: colors.amberDim, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 0.5, borderColor: colors.amber },
  completionLabel: { fontSize: 12, color: colors.amber, fontWeight: '600' },
  completionCta: { fontSize: 11, color: colors.amber },
  completionTrack: { height: 4, backgroundColor: colors.bgBorder, borderRadius: 2 },
  completionBar: { height: 4, backgroundColor: colors.amber, borderRadius: 2 },
  editBtn: { width: 64, backgroundColor: colors.bgCard, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.bgBorder, alignItems: 'center', justifyContent: 'center', gap: 4 },
  editBtnIcon: { fontSize: 18 },
  editBtnText: { fontSize: 10, color: colors.textMuted },

  // Section
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  sectionAlertDot: { width: 6, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: colors.emergency },
  sectionIcon: { fontSize: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 1.5, flex: 1 },
  sectionBadge: { width: 18, height: 18, borderRadius: 9, overflow: 'hidden', backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  sectionBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '700' },
  sectionSub: { fontSize: 11, color: '#64748B', marginBottom: 12 },

  // Alert row
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF1F1', borderRadius: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.emergency + '40', padding: 12, marginBottom: 8 },
  alertRowAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.emergency },
  alertRowPhoto: { width: 40, height: 40, borderRadius: 20 },
  alertRowName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  alertRowLoc: { fontSize: 11, color: '#64748B' },
  alertHelpBtn: { backgroundColor: colors.emergency, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6 },
  alertHelpBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // Park cards
  parkCard: { width: 200, borderRadius: 18, overflow: 'hidden', borderWidth: 0.5, padding: 14 },
  parkCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  parkEmoji: { fontSize: 28 },
  parkCountBadge: { borderRadius: 10, overflow: 'hidden', padding: 8, alignItems: 'center', minWidth: 48 },
  parkCount: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  parkCountSub: { fontSize: 9, fontWeight: '700' },
  parkName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  parkDistance: { fontSize: 10, color: colors.textMuted, marginBottom: 6 },
  parkStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  parkDot: { width: 6, height: 6, borderRadius: 3 },
  parkStatus: { fontSize: 11, fontWeight: '700' },
  parkMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  parkMetaText: { fontSize: 11, color: '#64748B' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  footerLink: { fontSize: 11, color: '#64748B' },
  footerDot: { fontSize: 11, color: '#E2E8F0' },
});
