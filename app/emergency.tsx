import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, TextInput } from 'react-native';
import { supabase } from '../lib/supabase';
import { sendLostDogAlert } from '../lib/notifications';
import { router } from 'expo-router';

export default function Emergency() {
  const [dog, setDog] = useState(null);
  const [step, setStep] = useState('confirm');
  const [lastSeen, setLastSeen] = useState('');
  const [description, setDescription] = useState('');
  const [alerting, setAlerting] = useState(false);
  const [notified, setNotified] = useState(0);
  const [responses, setResponses] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function loadDog() {
      const { data } = await supabase.from('dogs').select('*').single();
      if (data) {
        setDog(data);
        setLastSeen(data.neighbourhood || '');
        setDescription(`${data.breed}, ${data.age} years old. ${data.personality}`);
      }
    }
    loadDog();
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(pulseAnim2, { toValue: 2.0, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim2, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }

  function stopPulse() {
    pulseAnim.stopAnimation();
    pulseAnim2.stopAnimation();
    pulseAnim.setValue(1);
    pulseAnim2.setValue(1);
  }

  function simulateResponses() {
    const RESPONSES = [
      { time: 2000, count: 8, msg: 'Alert sent to 8 nearby users', icon: '📡' },
      { time: 4000, count: 23, msg: '23 users notified in 1km radius', icon: '🔔' },
      { time: 7000, count: 47, msg: '47 users notified in 5km radius', icon: '📣' },
      { time: 10000, count: 3, msg: '3 people are actively looking', icon: '👀' },
      { time: 14000, count: 1, msg: 'Someone spotted a dog near Parque España!', icon: '🐕', urgent: true },
    ];

    RESPONSES.forEach(r => {
      setTimeout(() => {
        setNotified(r.count);
        setResponses(prev => [r, ...prev]);
      }, r.time);
    });
  }

  async function triggerAlert() {
    if (!dog) return;
    setAlerting(true);
    setStep('active');
    startPulse();
    simulateResponses();

    const { error } = await supabase.from('lost_alerts').insert({
      dog_id: dog.id,
      dog_name: dog.name,
      owner_name: dog.owner_name,
      owner_phone: dog.owner_phone,
      neighbourhood: lastSeen,
      status: 'lost',
    });

    if (!error) await sendLostDogAlert(dog);
  }

  async function cancelAlert() {
    if (!dog) return;
    await supabase
      .from('lost_alerts')
      .update({ status: 'found' })
      .eq('dog_name', dog.name)
      .eq('status', 'lost');
    stopPulse();
    setStep('found');
  }

  if (!dog) return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {/* CONFIRM STEP */}
      {step === 'confirm' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmSection}>
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>⚠️ EMERGENCY ALERT</Text>
            </View>
            <Text style={styles.confirmTitle}>Report {dog.name} as lost?</Text>
            <Text style={styles.confirmSub}>This will instantly notify nearby SmartPet Tag users and show {dog.name} on the map as missing.</Text>
          </View>

          {/* Dog card */}
          <View style={styles.dogCard}>
            <View style={styles.dogCardLeft}>
              <View style={styles.dogAvatar}>
                <Text style={styles.dogAvatarEmoji}>{dog.emoji || '🐕'}</Text>
              </View>
              <View>
                <Text style={styles.dogCardName}>{dog.name}</Text>
                <Text style={styles.dogCardBreed}>{dog.breed} · {dog.age} yrs</Text>
              </View>
            </View>
            <View style={styles.autoFillBadge}>
              <Text style={styles.autoFillText}>Auto-filled ✓</Text>
            </View>
          </View>

          {/* Last seen */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>📍 Last seen location</Text>
            <TextInput
              style={styles.fieldInput}
              value={lastSeen}
              onChangeText={setLastSeen}
              placeholder="e.g. Parque España, Condesa"
              placeholderTextColor="#333"
            />
          </View>

          {/* Description */}
          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>📋 Description for finders</Text>
            <TextInput
              style={[styles.fieldInput, { height: 80, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your dog..."
              placeholderTextColor="#333"
              multiline
            />
          </View>

          {/* What happens */}
          <View style={styles.whatHappens}>
            <Text style={styles.whatHappensTitle}>What happens when you tap the button:</Text>
            {[
              { icon: '📡', text: 'Push notification to all users within 5km' },
              { icon: '🗺️', text: 'Red pin appears on the Dog Map instantly' },
              { icon: '📸', text: 'Emergency post pinned at top of feed' },
              { icon: '📞', text: 'Your contact shared with finders' },
            ].map((item, i) => (
              <View key={i} style={styles.whatRow}>
                <Text style={styles.whatIcon}>{item.icon}</Text>
                <Text style={styles.whatText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* THE BIG BUTTON */}
          <TouchableOpacity style={styles.emergencyBtn} onPress={triggerAlert}>
            <Text style={styles.emergencyBtnEmoji}>🚨</Text>
            <Text style={styles.emergencyBtnText}>{dog.name} IS LOST</Text>
            <Text style={styles.emergencyBtnSub}>Tap to alert the community</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ACTIVE ALERT STEP */}
      {step === 'active' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.activeSection}>

            {/* Pulsing radar */}
            <View style={styles.radarWrap}>
              <Animated.View style={[styles.radarRing, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]} />
              <Animated.View style={[styles.radarRing, { transform: [{ scale: pulseAnim2 }], opacity: 0.08 }]} />
              <View style={styles.radarCenter}>
                <Text style={styles.radarEmoji}>🚨</Text>
                <Text style={styles.radarLabel}>ALERT ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.activeTitle}>{dog.name} is reported missing</Text>
            <Text style={styles.activeSub}>Last seen: {lastSeen}</Text>

            {/* Live counter */}
            <View style={styles.counterCard}>
              <Text style={styles.counterNum}>{notified}</Text>
              <Text style={styles.counterLabel}>users notified nearby</Text>
            </View>

            {/* Live feed */}
            <View style={styles.liveFeed}>
              <View style={styles.liveFeedHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.liveFeedTitle}>Live updates</Text>
              </View>
              {responses.length === 0 && (
                <Text style={styles.liveFeedEmpty}>Sending alerts...</Text>
              )}
              {responses.map((r, i) => (
                <View key={i} style={[styles.liveRow, r.urgent && styles.liveRowUrgent]}>
                  <Text style={styles.liveRowIcon}>{r.icon}</Text>
                  <Text style={[styles.liveRowText, r.urgent && styles.liveRowTextUrgent]}>{r.msg}</Text>
                </View>
              ))}
            </View>

            {/* Dog info reminder */}
            <View style={styles.dogInfoReminder}>
              <Text style={styles.dogInfoTitle}>Share this with people nearby:</Text>
              <Text style={styles.dogInfoLine}>🐕 {dog.name} — {dog.breed}</Text>
              <Text style={styles.dogInfoLine}>📍 Last seen: {lastSeen}</Text>
              <Text style={styles.dogInfoLine}>📞 {dog.owner_phone || 'Contact via app'}</Text>
              <Text style={styles.dogInfoLine}>📋 {description}</Text>
            </View>

            {/* Found button */}
            <TouchableOpacity style={styles.foundBtn} onPress={cancelAlert}>
              <Text style={styles.foundBtnText}>✅ {dog.name} has been found!</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      )}

      {/* FOUND STEP */}
      {step === 'found' && (
        <View style={styles.foundSection}>
          <Text style={styles.foundEmoji}>🎉</Text>
          <Text style={styles.foundTitle}>{dog.name} is safe!</Text>
          <Text style={styles.foundSub}>The alert has been cancelled. The community has been notified that {dog.name} was found.</Text>
          <View style={styles.foundStats}>
            <Text style={styles.foundStatsText}>🦸 {notified} people helped search</Text>
          </View>
          <TouchableOpacity style={styles.shareFoundBtn} onPress={() => router.back()}>
            <Text style={styles.shareFoundBtnText}>Back to SmartPet Tag</Text>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 100 },
  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtnText: { color: '#555', fontSize: 14 },
  scroll: { flex: 1 },

  confirmSection: { alignItems: 'center', padding: 24, paddingTop: 8 },
  warningBadge: { backgroundColor: '#1a0505', borderWidth: 0.5, borderColor: '#C0392B', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16 },
  warningBadgeText: { color: '#C0392B', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  confirmTitle: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  confirmSub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },

  dogCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#C0392B', padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dogCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dogAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a0505', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C0392B' },
  dogAvatarEmoji: { fontSize: 24 },
  dogCardName: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 2 },
  dogCardBreed: { fontSize: 12, color: '#555' },
  autoFillBadge: { backgroundColor: '#0a1a0a', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  autoFillText: { fontSize: 10, color: '#1D9E75', fontWeight: '600' },

  fieldWrap: { marginHorizontal: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  fieldInput: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff' },

  whatHappens: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 20 },
  whatHappensTitle: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  whatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  whatIcon: { fontSize: 16, width: 24 },
  whatText: { fontSize: 13, color: '#666', flex: 1 },

  emergencyBtn: { marginHorizontal: 16, backgroundColor: '#C0392B', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#ff6b6b' },
  emergencyBtnEmoji: { fontSize: 36, marginBottom: 8 },
  emergencyBtnText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 4 },
  emergencyBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  activeSection: { padding: 20, alignItems: 'center' },
  radarWrap: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  radarRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#C0392B' },
  radarCenter: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a0505', borderWidth: 2, borderColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  radarEmoji: { fontSize: 32, marginBottom: 4 },
  radarLabel: { fontSize: 9, color: '#C0392B', fontWeight: '700', letterSpacing: 1 },
  activeTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6, textAlign: 'center' },
  activeSub: { fontSize: 13, color: '#555', marginBottom: 20 },

  counterCard: { backgroundColor: '#1a0505', borderWidth: 1, borderColor: '#C0392B', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20, width: '100%' },
  counterNum: { fontSize: 48, fontWeight: '800', color: '#C0392B', lineHeight: 52 },
  counterLabel: { fontSize: 13, color: '#666', marginTop: 4 },

  liveFeed: { width: '100%', backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 16 },
  liveFeedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C0392B' },
  liveFeedTitle: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  liveFeedEmpty: { fontSize: 12, color: '#333', fontStyle: 'italic' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  liveRowUrgent: { backgroundColor: '#1a0e00', marginHorizontal: -14, paddingHorizontal: 14, borderRadius: 8 },
  liveRowIcon: { fontSize: 16, width: 24 },
  liveRowText: { fontSize: 12, color: '#555', flex: 1 },
  liveRowTextUrgent: { color: '#F5A623', fontWeight: '600' },

  dogInfoReminder: { width: '100%', backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#333', padding: 14, marginBottom: 20 },
  dogInfoTitle: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  dogInfoLine: { fontSize: 13, color: '#666', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#111' },

  foundBtn: { width: '100%', backgroundColor: '#051a10', borderWidth: 1, borderColor: '#1D9E75', borderRadius: 14, padding: 16, alignItems: 'center' },
  foundBtnText: { color: '#1D9E75', fontSize: 15, fontWeight: '700' },

  foundSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  foundEmoji: { fontSize: 72, marginBottom: 20 },
  foundTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  foundSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  foundStats: { backgroundColor: '#051a10', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 12, padding: 14, marginBottom: 24, width: '100%', alignItems: 'center' },
  foundStatsText: { fontSize: 14, color: '#1D9E75', fontWeight: '600' },
  shareFoundBtn: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#333', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  shareFoundBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
