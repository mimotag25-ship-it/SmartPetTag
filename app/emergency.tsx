import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, Linking, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { colors, shadows } from '../lib/design';

const { width, height } = Dimensions.get('window');

export default function Emergency() {
  const [dog, setDog] = useState(null);
  const [step, setStep] = useState(0);
  const [lastSeen, setLastSeen] = useState('');
  const [description, setDescription] = useState('');
  const [additionalPhoto, setAdditionalPhoto] = useState(null);
  const [additionalPhotoUrl, setAdditionalPhotoUrl] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sightings, setSightings] = useState([]);
  const [notifiedCount, setNotifiedCount] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDog();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (step === 1) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])).start();
      Animated.timing(countAnim, { toValue: 47, duration: 3000, useNativeDriver: false }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])).start();
      const interval = setInterval(loadSightings, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  async function loadDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('dogs').select('*, photo_url, photos').eq('owner_email', user.email).single();
    if (data) setDog(data);
  }

  async function loadSightings() {
    if (!alertId) return;
    const { data } = await supabase.from('lost_alerts').select('found_message, finder_name, found_location').eq('id', alertId);
    if (data) setSightings(data.filter(d => d.found_message));
  }

  async function pickExtraPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setAdditionalPhoto(result.assets[0].uri);
  }

  async function triggerAlert() {
    if (!dog) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Send emergency alert for ${dog.name}? This will notify all nearby users immediately.`);
      if (!confirmed) return;
    }
    setLoading(true);
    let extraPhotoUrl = null;
    if (additionalPhoto) {
      try {
        const response = await fetch(additionalPhoto);
        const blob = await response.blob();
        const fileName = `alert-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!error) {
          const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
          extraPhotoUrl = data.publicUrl;
        }
      } catch(e) {}
    }
    const { data } = await supabase.from('lost_alerts').insert({
      dog_id: dog.id, dog_name: dog.name, owner_name: dog.owner_name,
      owner_phone: dog.owner_phone,
      neighbourhood: lastSeen || dog.neighbourhood || 'CDMX',
      status: 'lost',
      dog_photo: extraPhotoUrl || dog.photo_url || null,
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

  const ringScale = ringAnim.interpolate({ inputRange: [0,1], outputRange: [1, 2.8] });
  const ringOpacity = ringAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.15, 0] });
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://smartpettag.app'}/public-profile?dogName=${dog?.name}`;
  const sightingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://smartpettag.app'}/sighting?alertId=${alertId}`;
  const whatsappMsg = `🚨 PERRO PERDIDO — ${dog?.name}!\n\nRaza: ${dog?.breed}\nÚltima ubicación: ${lastSeen || dog?.neighbourhood}\nDueño: ${dog?.owner_name} · ${dog?.owner_phone}\n\n¿Lo viste? Reporta aquí → ${sightingUrl}`;

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim }]}>

      {/* STEP 0 — PREPARE */}
      {step === 0 && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={s.confirmHeader}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Text style={s.backBtnText}>‹ Back</Text>
            </TouchableOpacity>
            <View style={s.confirmTitleWrap}>
              <Text style={s.confirmIcon}>🚨</Text>
              <Text style={s.confirmTitle}>Report a lost pet</Text>
              <Text style={s.confirmSub}>Take a deep breath. We'll alert your entire neighbourhood in seconds.</Text>
            </View>
          </View>

          {/* Pet card */}
          <View style={s.petAlertCard}>
            <View style={s.petAlertPhotoWrap}>
              {dog?.photo_url
                ? <Image source={{ uri: dog.photo_url }} style={s.petAlertPhoto} resizeMode="contain" />
                : <Text style={{ fontSize: 40 }}>{dog?.emoji || '🐕'}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.petAlertName}>{dog?.name}</Text>
              <Text style={s.petAlertBreed}>{dog?.breed}</Text>
              {dog?.colour && <Text style={s.petAlertDetail}>🎨 {dog.colour} · {dog.size}</Text>}
              {dog?.responds_to && <Text style={s.petAlertDetail}>👂 Responds to: {dog.responds_to}</Text>}
              {dog?.markings && <Text style={s.petAlertDetail}>🔍 {dog.markings}</Text>}
            </View>
          </View>

          {/* Last seen */}
          <View style={s.formSection}>
            <Text style={s.formLabel}>📍 Where was {dog?.name} last seen? *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Parque España, Condesa — near the fountain"
              placeholderTextColor={colors.textMuted}
              value={lastSeen}
              onChangeText={setLastSeen}
            />

            <Text style={s.formLabel}>📝 Any details that help finders identify them</Text>
            <TextInput
              style={[s.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder={`e.g. ${dog?.name} was wearing a blue collar, heading towards the park exit`}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text style={s.formLabel}>📷 Add a current photo (optional)</Text>
            <TouchableOpacity style={s.photoPickerBtn} onPress={pickExtraPhoto}>
              {additionalPhoto ? (
                <Image source={{ uri: additionalPhoto }} style={s.pickedPhoto} resizeMode="contain" />
              ) : (
                <View style={s.photoPickerPlaceholder}>
                  {dog?.photo_url
                    ? <Image source={{ uri: dog.photo_url }} style={s.existingPhoto} resizeMode="contain" />
                    : <Text style={{ fontSize: 32 }}>📷</Text>}
                  <Text style={s.photoPickerText}>{dog?.photo_url ? 'Tap to add a different photo' : 'Add a photo'}</Text>
                  <Text style={s.photoPickerSub}>Profile photo will be used if none added</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* What happens */}
          <View style={s.whatHappensCard}>
            <Text style={s.whatHappensTitle}>What happens when you alert:</Text>
            {[
              { icon: '🔔', text: 'Push notification sent to all nearby users instantly' },
              { icon: '🗺️', text: 'Red alert dot appears on the live community map' },
              { icon: '🔗', text: 'Public sighting link created — shareable without the app' },
              { icon: '💬', text: 'Chat opens automatically when someone reports finding them' },
              { icon: '🖨️', text: 'Printable poster ready with QR code' },
            ].map((item, i) => (
              <View key={i} style={s.whatHappensRow}>
                <Text style={s.whatHappensIcon}>{item.icon}</Text>
                <Text style={s.whatHappensText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[s.alertBtn, loading && { opacity: 0.6 }]}
            onPress={triggerAlert}
            disabled={loading || !lastSeen.trim()}
          >
            <Text style={s.alertBtnText}>{loading ? 'Sending alert...' : `🚨 Alert the community — ${dog?.name} is missing`}</Text>
          </TouchableOpacity>
          {!lastSeen.trim() && <Text style={s.alertBtnHint}>Add last seen location to continue</Text>}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* STEP 1 — ACTIVE */}
      {step === 1 && (
        <View style={s.activeContainer}>
          <Animated.View style={[s.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.activeContent}>

            <View style={s.activeStatus}>
              <Animated.View style={[s.activeStatusDot, { transform: [{ scale: pulseAnim }] }]} />
              <Text style={s.activeStatusText}>ALERT ACTIVE</Text>
            </View>

            <View style={s.activeDogCard}>
              {dog?.photo_url
                ? <Image source={{ uri: dog.photo_url }} style={s.activeDogPhoto} resizeMode="contain" />
                : <View style={s.activeDogPhotoPlaceholder}><Text style={{ fontSize: 52 }}>{dog?.emoji || '🐕'}</Text></View>}
              <Text style={s.activeDogName}>{dog?.name}</Text>
              <Text style={s.activeDogBreed}>{dog?.breed}</Text>
              <Text style={s.activeDogLocation}>📍 Last seen: {lastSeen || dog?.neighbourhood}</Text>
            </View>

            <View style={s.notifiedCard}>
              <Text style={s.notifiedNum}>47+</Text>
              <Text style={s.notifiedLabel}>people notified nearby</Text>
            </View>

            {/* What to do while waiting */}
            <View style={s.whileWaitingCard}>
              <Text style={s.whileWaitingTitle}>💡 While you wait</Text>
              <Text style={s.whileWaitingText}>• Walk the route {dog?.name} usually takes</Text>
              <Text style={s.whileWaitingText}>• Call their name and whistle if they respond to it</Text>
              <Text style={s.whileWaitingText}>• Check favourite spots: {dog?.favourite_spots || 'nearby parks'}</Text>
              <Text style={s.whileWaitingText}>• Ask neighbours and local shops to keep watch</Text>
            </View>

            {/* Live sightings */}
            <Text style={s.sectionLabel}>LIVE UPDATES</Text>
            {sightings.length === 0 ? (
              <View style={s.waitingCard}>
                <View style={s.waitingDot} />
                <Text style={s.waitingText}>Waiting for community sightings...</Text>
              </View>
            ) : (
              sightings.map((sig, i) => (
                <View key={i} style={s.sightingCard}>
                  <Text style={s.sightingName}>{sig.finder_name}</Text>
                  <Text style={s.sightingMsg}>{sig.found_message}</Text>
                  {sig.found_location && <Text style={s.sightingLoc}>📍 {sig.found_location}</Text>}
                </View>
              ))
            )}

            {/* Share */}
            <Text style={s.sectionLabel}>SPREAD THE WORD</Text>
            <TouchableOpacity style={s.whatsappShareBtn} onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`)}>
              <View style={s.whatsappLogo}><Text style={s.whatsappLogoText}>W</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.whatsappShareTitle}>Share to WhatsApp groups</Text>
                <Text style={s.whatsappShareSub}>Pre-written message + sighting link. No app needed.</Text>
              </View>
              <Text style={{ color: '#10B981', fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.posterBtn} onPress={() => router.push({ pathname: '/poster', params: { alertId, dogName: dog?.name, breed: dog?.breed, neighbourhood: lastSeen || dog?.neighbourhood, ownerName: dog?.owner_name, ownerPhone: dog?.owner_phone } })}>
              <Text style={{ fontSize: 22 }}>🖨️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.posterTitle}>Print emergency poster</Text>
                <Text style={s.posterSub}>With QR code. Print and post around the neighbourhood.</Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.foundBtn} onPress={resolveAlert}>
              <Text style={s.foundBtnText}>✓ {dog?.name} has been found!</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* STEP 2 — FOUND */}
      {step === 2 && (
        <View style={s.foundScreen}>
          {[...Array(16)].map((_, i) => (
            <Text key={i} style={[s.confettiPiece, { left: `${6 * i}%`, top: `${5 + (i % 4) * 18}%`, fontSize: 20 + (i % 3) * 8 }]}>
              {['🎉','🐾','⭐','🎊','💛'][i % 5]}
            </Text>
          ))}
          <View style={s.foundContent}>
            <View style={s.foundAvatarWrap}>
              {dog?.photo_url
                ? <Image source={{ uri: dog.photo_url }} style={s.foundPhoto} resizeMode="contain" />
                : <Text style={{ fontSize: 80 }}>{dog?.emoji || '🐾'}</Text>}
            </View>
            <Text style={s.foundTitle}>{dog?.name} is home safe! 🎉</Text>
            <Text style={s.foundSub}>Share this moment — every reunion inspires others to help.</Text>
            <TouchableOpacity style={s.foundShareBtn} onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`🐾 ${dog?.name} fue encontrado gracias a la comunidad de SmartPet Tag! 🎉\n\nSmartPet Tag protege a las mascotas en CDMX. Únete gratis: smartpettag.app`)}`)}>
              <View style={s.whatsappLogo}><Text style={s.whatsappLogoText}>W</Text></View>
              <Text style={s.foundShareBtnText}>Share the story on WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.backHomeBtn} onPress={() => router.replace('/(tabs)/explore')}>
              <Text style={s.backHomeBtnText}>Back to SmartPet Tag</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  backBtn: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  backBtnText: { color: colors.textMuted, fontSize: 15 },
  confirmHeader: { padding: 24, paddingTop: 56 },
  confirmTitleWrap: { alignItems: 'center', marginTop: 8 },
  confirmIcon: { fontSize: 48, marginBottom: 8 },
  confirmTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 },
  confirmSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  petAlertCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, marginBottom: 16, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 1, borderColor: colors.amber + '60', padding: 14 },
  petAlertPhotoWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: colors.amber, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center' },
  petAlertPhoto: { width: '100%', height: '100%' },
  petAlertName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  petAlertBreed: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  petAlertDetail: { fontSize: 12, color: colors.textSecondary, marginBottom: 1 },
  formSection: { paddingHorizontal: 20, marginBottom: 16 },
  formLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder, borderRadius: 12, padding: 14, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  photoPickerBtn: { height: 120, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder },
  pickedPhoto: { width: '100%', height: '100%' },
  existingPhoto: { width: 64, height: 64, borderRadius: 32 },
  photoPickerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPickerText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  photoPickerSub: { fontSize: 11, color: colors.textMuted },
  whatHappensCard: { marginHorizontal: 20, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 16, marginBottom: 16 },
  whatHappensTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  whatHappensRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  whatHappensIcon: { fontSize: 16, width: 24 },
  whatHappensText: { fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 },
  alertBtn: { marginHorizontal: 20, backgroundColor: colors.emergency, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: colors.emergency, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  alertBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, textAlign: 'center' },
  alertBtnHint: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8 },
  activeContainer: { flex: 1, backgroundColor: '#0D0808' },
  ring: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.emergency, top: height * 0.22, alignSelf: 'center', zIndex: 0 },
  activeContent: { padding: 24, paddingTop: 60, alignItems: 'center' },
  activeStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1C0707', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.emergency, marginBottom: 24 },
  activeStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency },
  activeStatusText: { fontSize: 12, fontWeight: '800', color: colors.emergency, letterSpacing: 1 },
  activeDogCard: { alignItems: 'center', marginBottom: 20 },
  activeDogPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.emergency, marginBottom: 12 },
  activeDogPhotoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1C0707', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.emergency, marginBottom: 12 },
  activeDogName: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  activeDogBreed: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  activeDogLocation: { fontSize: 13, color: colors.textSecondary },
  notifiedCard: { backgroundColor: '#1C0707', borderRadius: 16, borderWidth: 1, borderColor: colors.emergency + '60', paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center', marginBottom: 20, width: '100%' },
  notifiedNum: { fontSize: 48, fontWeight: '900', color: colors.emergency, letterSpacing: -2 },
  notifiedLabel: { fontSize: 12, color: colors.textMuted },
  whileWaitingCard: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 16, marginBottom: 20, width: '100%', borderWidth: 0.5, borderColor: colors.bgBorder },
  whileWaitingTitle: { fontSize: 13, fontWeight: '700', color: colors.amber, marginBottom: 10 },
  whileWaitingText: { fontSize: 12, color: colors.textSecondary, lineHeight: 22 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, alignSelf: 'flex-start', marginBottom: 10, marginTop: 4 },
  waitingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, width: '100%', marginBottom: 16 },
  waitingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  waitingText: { fontSize: 13, color: colors.textMuted },
  sightingCard: { backgroundColor: '#052016', borderRadius: 12, borderWidth: 0.5, borderColor: '#10B981' + '60', padding: 14, width: '100%', marginBottom: 8 },
  sightingName: { fontSize: 13, fontWeight: '700', color: '#10B981', marginBottom: 2 },
  sightingMsg: { fontSize: 13, color: colors.textSecondary },
  sightingLoc: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  whatsappShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#052016', borderRadius: 14, borderWidth: 1, borderColor: '#10B981' + '60', padding: 14, width: '100%', marginBottom: 10 },
  whatsappLogo: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  whatsappLogoText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  whatsappShareTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  whatsappShareSub: { fontSize: 11, color: colors.textMuted },
  posterBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, width: '100%', marginBottom: 16 },
  posterTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  posterSub: { fontSize: 11, color: colors.textMuted },
  foundBtn: { backgroundColor: '#052016', borderRadius: 14, borderWidth: 1, borderColor: '#10B981', paddingVertical: 14, alignItems: 'center', width: '100%' },
  foundBtnText: { color: '#10B981', fontWeight: '700', fontSize: 14 },
  foundScreen: { flex: 1, backgroundColor: '#052016', alignItems: 'center', justifyContent: 'center', padding: 28 },
  confettiPiece: { position: 'absolute' },
  foundContent: { alignItems: 'center' },
  foundAvatarWrap: { width: 140, height: 140, borderRadius: 70, overflow: 'hidden', borderWidth: 3, borderColor: '#10B981', marginBottom: 20, backgroundColor: '#073d1a', alignItems: 'center', justifyContent: 'center' },
  foundPhoto: { width: '100%', height: '100%' },
  foundTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  foundSub: { fontSize: 14, color: '#10B981', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  foundShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: '100%', justifyContent: 'center', marginBottom: 10 },
  foundShareBtnText: { color: '#052016', fontWeight: '800', fontSize: 15 },
  backHomeBtn: { paddingVertical: 12 },
  backHomeBtnText: { color: '#6B7280', fontSize: 13 },
});
