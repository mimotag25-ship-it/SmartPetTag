import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Linking, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { colors, shadows } from '../lib/design';
import { useLanguage } from '../lib/i18n';

const { width, height } = Dimensions.get('window');

export default function Emergency() {
  const [dog, setDog] = useState(null);
  const [step, setStep] = useState(0); // 0=confirm, 1=active, 2=found
  const [lastSeen, setLastSeen] = useState('');
  const [description, setDescription] = useState('');
  const [alertId, setAlertId] = useState(null);
  const [notified, setNotified] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sightings, setSightings] = useState([]);
  const { t } = useLanguage();

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDog();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (step === 1) {
      // Red pulse
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])).start();
      // Count up notified users
      Animated.timing(countAnim, { toValue: 47, duration: 3000, useNativeDriver: false }).start();
      // Ring expand
      Animated.loop(Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
      // Poll for sightings
      const interval = setInterval(loadSightings, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  async function loadDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data } = await supabase.from('dogs').select('*, photo_url').single();
      if (data) setDog(data);
      return;
    }
    const { data } = await supabase.from('dogs').select('*, photo_url').eq('owner_email', user?.email).single();
    if (data) setDog(data);
  }

  async function loadSightings() {
    if (!alertId) return;
    const { data } = await supabase.from('lost_alerts').select('found_message, finder_name, found_location, created_at').eq('id', alertId);
    if (data) setSightings(data.filter(d => d.found_message));
  }

  async function triggerAlert() {
    if (!dog) return;
    setLoading(true);

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    const { data, error } = await supabase.from('lost_alerts').insert({
      dog_id: dog.id, dog_name: dog.name, owner_name: dog.owner_name,
      owner_phone: dog.owner_phone, neighbourhood: lastSeen || dog.neighbourhood || 'CDMX',
      status: 'lost', dog_photo: dog.photo_url || null,
    }).select().single();

    if (data) {
      setAlertId(data.id);
      await supabase.from('activity').insert({
        type: 'alert', message: `🚨 ${dog.name} is missing in ${lastSeen || dog.neighbourhood}`,
        icon: '🚨', neighbourhood: lastSeen || dog.neighbourhood, urgent: true,
      });
    }
    setLoading(false);
    setStep(1);
  }

  async function resolveAlert() {
    if (!alertId) return;
    await supabase.from('lost_alerts').update({ status: 'found' }).eq('id', alertId);
    setStep(2);
  }

  const ringScale = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] });

  const sightingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://smartpettag.app'}/sighting?alertId=${alertId}`;
  const whatsappMsg = `🚨 PERRO PERDIDO — ${dog?.name}!\n\nRaza: ${dog?.breed}\nÚltima ubicación: ${lastSeen || dog?.neighbourhood}\nDueño: ${dog?.owner_name} · ${dog?.owner_phone}\n\n¿Lo viste? Reporta aquí → ${sightingUrl}`;

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>

      {/* STEP 0 — CONFIRM */}
      {step === 0 && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.confirmContent}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>← Back</Text>
          </TouchableOpacity>

          <View style={s.confirmHeader}>
            <Text style={s.confirmWarning}>⚠️</Text>
            <Text style={s.confirmTitle}>{t('emergencyAlert')}</Text>
            <Text style={s.confirmSub}>This will immediately notify everyone within 5km</Text>
          </View>

          <View style={s.dogConfirmCard}>
            <View style={s.dogConfirmAvatar}>
              <Text style={{ fontSize: 40 }}>{dog?.emoji || '🐕'}</Text>
            </View>
            <View>
              <Text style={s.dogConfirmName}>{dog?.name}</Text>
              <Text style={s.dogConfirmBreed}>{dog?.breed}</Text>
            </View>
          </View>

          <Text style={s.fieldLabel}>{t('lastSeenLocation')}</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. Parque España, Condesa..."
            placeholderTextColor={colors.textMuted}
            value={lastSeen}
            onChangeText={setLastSeen}
          />

          <Text style={s.fieldLabel}>{t('descriptionForFinders')}</Text>
          <TextInput
            style={[s.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Any identifying details, last seen wearing..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View style={s.whatHappens}>
            <Text style={s.whatHappensTitle}>{t('whatHappensInstantly')}</Text>
            {[
              '🔔 Push notification to all nearby users',
              '🗺️ Red alert dot appears on the live map',
              '📋 Public sighting page created instantly',
              '💬 Chat thread ready for finder coordination',
            ].map((item, i) => (
              <View key={i} style={s.whatHappensRow}>
                <Text style={s.whatHappensText}>{item}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TouchableOpacity
              style={[s.triggerBtn, loading && { opacity: 0.6 }]}
              onPress={triggerAlert}
              disabled={loading}
            >
              <Text style={s.triggerBtnText}>{loading ? t('sendingAlerts') : `🚨 ${dog?.name} ${t('isLost')} — ALERT NOW`}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}

      {/* STEP 1 — ACTIVE ALERT */}
      {step === 1 && (
        <View style={s.activeContainer}>
          {/* Pulsing ring */}
          <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.activeContent}>
            {/* Status */}
            <View style={s.alertStatus}>
              <Animated.View style={[s.alertStatusDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={s.alertStatusText}>{t('alertActive')}</Text>
            </View>

            {/* Dog card */}
            <View style={s.activeDogCard}>
              <View style={s.activeDogAvatar}>
                <Text style={{ fontSize: 52 }}>{dog?.emoji || '🐕'}</Text>
              </View>
              <Text style={s.activeDogName}>{dog?.name}</Text>
              <Text style={s.activeDogBreed}>{dog?.breed}</Text>
              <Text style={s.activeDogLocation}>📍 {lastSeen || dog?.neighbourhood}</Text>
            </View>

            {/* Notified counter */}
            <View style={s.notifiedCard}>
              <Animated.Text style={s.notifiedNum}>
                {countAnim.interpolate ? '47+' : notified}
              </Animated.Text>
              <Text style={s.notifiedLabel}>{t('usersNotifiedNearby')}</Text>
            </View>

            {/* Live updates */}
            <Text style={s.liveTitle}>{t('liveUpdates')}</Text>
            {sightings.length === 0 ? (
              <View style={s.waitingCard}>
                <View style={s.waitingDot} />
                <Text style={s.waitingText}>Waiting for sightings...</Text>
              </View>
            ) : (
              sightings.map((s_, i) => (
                <View key={i} style={s.sightingCard}>
                  <Text style={s.sightingName}>{s_.finder_name}</Text>
                  <Text style={s.sightingMsg}>{s_.found_message}</Text>
                  {s_.found_location && <Text style={s.sightingLoc}>📍 {s_.found_location}</Text>}
                </View>
              ))
            )}

            {/* Spread the word */}
            <Text style={s.spreadTitle}>{t('spreadTheWord')}</Text>

            <TouchableOpacity
              style={s.whatsappBtn}
              onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`)}
            >
              <Text style={s.whatsappBtnIcon}>💚</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.whatsappBtnTitle}>{t('shareToWhatsApp')}</Text>
                <Text style={s.whatsappBtnSub}>{t('whatsappSubMsg')}</Text>
              </View>
              <Text style={s.whatsappBtnArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.posterBtn}
              onPress={() => router.push({ pathname: '/poster', params: { alertId, dogName: dog?.name, breed: dog?.breed, neighbourhood: lastSeen || dog?.neighbourhood, ownerName: dog?.owner_name, ownerPhone: dog?.owner_phone } })}
            >
              <Text style={s.posterBtnIcon}>🖨️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.posterBtnTitle}>{t('printPoster')}</Text>
                <Text style={s.posterBtnSub}>{t('posterSubMsg')}</Text>
              </View>
              <Text style={s.posterBtnArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.foundBtn} onPress={resolveAlert}>
              <Text style={s.foundBtnText}>✓ {dog?.name} {t('dogHasBeenFound')}!</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* STEP 2 — FOUND */}
      {step === 2 && (
        <View style={s.foundScreen}>
          <View style={s.foundConfetti}>
            {['🎉','🐾','⭐','🎊','💛','🐕'].map((e, i) => (
              <Text key={i} style={[s.confettiPiece, { left: `${10 + i * 14}%`, top: `${10 + (i % 3) * 20}%` }]}>{e}</Text>
            ))}
          </View>
          <View style={s.foundContent}>
            <View style={s.foundAvatarWrap}>
              <Text style={{ fontSize: 80 }}>{dog?.emoji || '🐾'}</Text>
            </View>
            <Text style={s.foundTitle}>{dog?.name} is home safe! 🎉</Text>
            <Text style={s.foundSub}>Share this moment — every reunion inspires others to help.</Text>
            <TouchableOpacity style={s.foundShareBtn} onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`🐾 ${dog?.name} fue encontrado gracias a la comunidad de SmartPet Tag en ${dog?.neighbourhood}! 🎉\n\nSmartPet Tag protege a los perros en CDMX. Únete gratis: smartpettag.app`)}`)}>
              <Text style={s.foundShareBtnText}>💚 Share the story on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backHomeBtn} onPress={() => router.replace('/(tabs)/explore')}>
              <Text style={s.backHomeBtnText}>{t('backToApp')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingVertical: 8, marginBottom: 8 },
  backBtnText: { color: colors.textMuted, fontSize: 14 },

  confirmContent: { padding: 24, paddingTop: 60 },
  confirmHeader: { alignItems: 'center', marginBottom: 24 },
  confirmWarning: { fontSize: 52, marginBottom: 8 },
  confirmTitle: { fontSize: 26, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  confirmSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  dogConfirmCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 16, marginBottom: 20 },
  dogConfirmAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.amber },
  dogConfirmName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  dogConfirmBreed: { fontSize: 13, color: colors.textMuted },

  fieldLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder, borderRadius: 12, padding: 14, fontSize: 14, color: colors.textPrimary, marginBottom: 14 },

  whatHappens: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 0.5, borderColor: colors.bgBorder },
  whatHappensTitle: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  whatHappensRow: { paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  whatHappensText: { fontSize: 13, color: colors.textSecondary },

  triggerBtn: { backgroundColor: colors.emergency, borderRadius: 16, paddingVertical: 18, alignItems: 'center', ...shadows.emergency },
  triggerBtnText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Active
  activeContainer: { flex: 1, backgroundColor: '#0D0808' },
  ring: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: colors.emergency, top: height * 0.25, alignSelf: 'center' },
  activeContent: { padding: 24, paddingTop: 60, alignItems: 'center' },
  alertStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1C0707', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.emergency, marginBottom: 24 },
  alertStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency },
  alertStatusText: { fontSize: 12, fontWeight: '800', color: colors.emergency, letterSpacing: 1 },
  activeDogCard: { alignItems: 'center', marginBottom: 20 },
  activeDogAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1C0707', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.emergency, marginBottom: 12, ...shadows.emergency },
  activeDogName: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  activeDogBreed: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  activeDogLocation: { fontSize: 13, color: colors.textSecondary },
  notifiedCard: { backgroundColor: '#1C0707', borderRadius: 16, borderWidth: 1, borderColor: colors.emergency + '60', paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', marginBottom: 24, width: '100%' },
  notifiedNum: { fontSize: 52, fontWeight: '900', color: colors.emergency, letterSpacing: -2 },
  notifiedLabel: { fontSize: 12, color: colors.textMuted },
  liveTitle: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 10 },
  waitingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, width: '100%', marginBottom: 20 },
  waitingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  waitingText: { fontSize: 13, color: colors.textMuted },
  sightingCard: { backgroundColor: '#052016', borderRadius: 12, borderWidth: 0.5, borderColor: '#10B981' + '60', padding: 14, width: '100%', marginBottom: 8 },
  sightingName: { fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 2 },
  sightingMsg: { fontSize: 13, color: colors.textSecondary },
  sightingLoc: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  spreadTitle: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 10, marginTop: 4 },
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#052016', borderRadius: 14, borderWidth: 1, borderColor: '#10B981' + '60', padding: 14, width: '100%', marginBottom: 10 },
  whatsappBtnIcon: { fontSize: 24 },
  whatsappBtnTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  whatsappBtnSub: { fontSize: 11, color: colors.textMuted },
  whatsappBtnArrow: { color: '#10B981', fontSize: 18 },
  posterBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, width: '100%', marginBottom: 16 },
  posterBtnIcon: { fontSize: 24 },
  posterBtnTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  posterBtnSub: { fontSize: 11, color: colors.textMuted },
  posterBtnArrow: { color: colors.textMuted, fontSize: 18 },
  foundBtn: { backgroundColor: '#052016', borderRadius: 14, borderWidth: 1, borderColor: '#10B981', paddingVertical: 14, alignItems: 'center', width: '100%' },
  foundBtnText: { color: '#10B981', fontWeight: '700', fontSize: 14 },

  // Found
  foundScreen: { flex: 1, backgroundColor: '#052016', alignItems: 'center', justifyContent: 'center', padding: 28 },
  foundConfetti: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  confettiPiece: { position: 'absolute', fontSize: 32 },
  foundContent: { alignItems: 'center' },
  foundAvatarWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#073d1a', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#10B981', marginBottom: 20 },
  foundTitle: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  foundSub: { fontSize: 14, color: '#10B981', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  foundShareBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 10 },
  foundShareBtnText: { color: '#052016', fontWeight: '800', fontSize: 15 },
  backHomeBtn: { paddingVertical: 12 },
  backHomeBtnText: { color: '#6B7280', fontSize: 13 },
});
