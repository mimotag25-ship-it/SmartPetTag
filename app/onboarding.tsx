import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const BREEDS = ['Labrador Retriever', 'Golden Retriever', 'French Bulldog', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'German Shepherd', 'Husky', 'Chihuahua', 'Dachshund', 'Schnauzer', 'Shih Tzu', 'Mixed breed', 'Other'];
const DOG_EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [personality, setPersonality] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐕');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function nextStep() {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -40, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  function prevStep() {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setStep(s => s - 1);
      slideAnim.setValue(-40);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  async function finish() {
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setLoading(false); return; }

    const { error: dogError } = await supabase.from('dogs').insert({
      name: dogName,
      breed,
      age: parseInt(age) || 0,
      personality,
      neighbourhood,
      owner_name: email.split('@')[0],
      owner_phone: '',
    });

    if (dogError) { setError(dogError.message); setLoading(false); return; }
    setLoading(false);
    nextStep();
  }

  const steps = [

    // Step 0 — Welcome
    <View style={styles.screen} key="welcome">
      <View style={styles.welcomeGlow} />
      <View style={styles.welcomeHero}>
        <View style={styles.logoRing}>
          <Text style={styles.logoEmoji}>🐾</Text>
        </View>
        <Text style={styles.welcomeTitle}>SmartPet Tag</Text>
        <Text style={styles.welcomeTagline}>The connected ecosystem for dog owners</Text>
        <View style={styles.locationPill}>
          <Text style={styles.locationPillText}>📍 Mexico City</Text>
        </View>
      </View>
      <View style={styles.featureGrid}>
        {[
          { icon: '📡', title: 'BLE Tags', desc: 'Smart collar technology' },
          { icon: '🚨', title: 'Lost Alerts', desc: 'Instant notifications' },
          { icon: '🗺️', title: 'Dog Map', desc: 'Real-time location' },
          { icon: '📸', title: 'Social Feed', desc: 'Connect with owners' },
        ].map((f, i) => (
          <View key={i} style={styles.featureCard}>
            <Text style={styles.featureCardIcon}>{f.icon}</Text>
            <Text style={styles.featureCardTitle}>{f.title}</Text>
            <Text style={styles.featureCardDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
        <Text style={styles.primaryBtnText}>Get started</Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/login')}>
        <Text style={styles.ghostBtnText}>I already have an account</Text>
      </TouchableOpacity>
    </View>,

    // Step 1 — Dog name
    <View style={styles.screen} key="dogname">
      <View style={styles.stepHeader}>
        <Text style={styles.stepChip}>Step 1 of 4</Text>
        <Text style={styles.stepTitle}>Your dog's profile</Text>
        <Text style={styles.stepSub}>This creates their SmartPet Tag identity</Text>
      </View>
      <View style={styles.emojiPickerWrap}>
        <Text style={styles.inputLabel}>Choose an avatar</Text>
        <View style={styles.emojiPicker}>
          {DOG_EMOJIS.map(e => (
            <TouchableOpacity
              key={e}
              style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}
              onPress={() => setSelectedEmoji(e)}
            >
              <Text style={styles.emojiOption}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.avatarPreview}>
        <Text style={styles.avatarPreviewEmoji}>{selectedEmoji}</Text>
      </View>
      <Text style={styles.inputLabel}>Dog's name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Athena"
        placeholderTextColor="#333"
        value={dogName}
        onChangeText={setDogName}
        autoFocus
      />
      <TouchableOpacity
        style={[styles.primaryBtn, !dogName.trim() && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!dogName.trim()}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </TouchableOpacity>
    </View>,

    // Step 2 — Breed + age
    <View style={styles.screen} key="breed">
      <View style={styles.stepHeader}>
        <Text style={styles.stepChip}>Step 2 of 4</Text>
        <Text style={styles.stepTitle}>{selectedEmoji} {dogName}'s details</Text>
        <Text style={styles.stepSub}>Help neighbours recognise your dog</Text>
      </View>
      <Text style={styles.inputLabel}>Breed</Text>
      <ScrollView style={styles.breedList} showsVerticalScrollIndicator={false}>
        {BREEDS.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.breedRow, breed === b && styles.breedRowActive]}
            onPress={() => setBreed(b)}
          >
            <Text style={[styles.breedText, breed === b && styles.breedTextActive]}>{b}</Text>
            {breed === b && <Text style={{ color: '#E8640A', fontSize: 14 }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.inputLabel}>Age (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3"
        placeholderTextColor="#333"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!breed || !age) && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!breed || !age}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </TouchableOpacity>
    </View>,

    // Step 3 — Personality
    <View style={styles.screen} key="personality">
      <View style={styles.stepHeader}>
        <Text style={styles.stepChip}>Step 3 of 4</Text>
        <Text style={styles.stepTitle}>Tell us about {dogName}</Text>
        <Text style={styles.stepSub}>Shown on their tag when scanned by strangers</Text>
      </View>
      <Text style={styles.inputLabel}>Personality</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        placeholder="e.g. Friendly, loves fetch, gentle with kids"
        placeholderTextColor="#333"
        value={personality}
        onChangeText={setPersonality}
        multiline
      />
      <Text style={styles.inputLabel}>Your neighbourhood</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Condesa, CDMX"
        placeholderTextColor="#333"
        value={neighbourhood}
        onChangeText={setNeighbourhood}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!personality || !neighbourhood) && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!personality || !neighbourhood}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </TouchableOpacity>
    </View>,

    // Step 4 — Account
    <View style={styles.screen} key="account">
      <View style={styles.stepHeader}>
        <Text style={styles.stepChip}>Step 4 of 4</Text>
        <Text style={styles.stepTitle}>Create your account</Text>
        <Text style={styles.stepSub}>Almost there — set up your owner profile</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryEmoji}>{selectedEmoji}</Text>
        <View>
          <Text style={styles.summaryName}>{dogName}</Text>
          <Text style={styles.summaryBreed}>{breed} · {age} yrs · {neighbourhood}</Text>
        </View>
      </View>
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="your@email.com"
        placeholderTextColor="#333"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 6 characters"
        placeholderTextColor="#333"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.primaryBtn, (!email || !password || loading) && styles.btnDisabled]}
        onPress={finish}
        disabled={!email || !password || loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? 'Creating...' : 'Create account'}</Text>
        {!loading && <Text style={styles.primaryBtnArrow}>→</Text>}
      </TouchableOpacity>
    </View>,

    // Step 5 — Done
    <View style={styles.screen} key="done">
      <View style={styles.doneGlow} />
      <View style={styles.doneWrap}>
        <View style={styles.doneAvatarRing}>
          <Text style={styles.doneAvatar}>{selectedEmoji}</Text>
        </View>
        <Text style={styles.doneTitle}>You're all set!</Text>
        <Text style={styles.doneSub}>{dogName}'s SmartPet Tag profile is live in Mexico City.</Text>
        <View style={styles.doneChecks}>
          {[
            'Dog profile created',
            'Account created',
            'BLE tag ready to scan',
            'Lost dog alerts active',
            'Dog map visibility on',
          ].map((item, i) => (
            <View key={i} style={styles.doneCheckRow}>
              <View style={styles.doneCheckDot} />
              <Text style={styles.doneCheckText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>Enter SmartPet Tag</Text>
          <Text style={styles.primaryBtnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>,

  ];

  return (
    <View style={styles.container}>

      {step > 0 && step < 5 && (
        <View style={styles.navBar}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{step}/4</Text>
        </View>
      )}

      {step === 0 && (
        <View style={styles.navBarSimple}>
          <Text style={styles.appNameNav}>SmartPet Tag</Text>
        </View>
      )}

      <Animated.View style={[styles.stepWrap, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        {steps[step]}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  navBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  navBarSimple: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appNameNav: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic' },
  backBtn: { padding: 4 },
  backBtnText: { color: '#fff', fontSize: 20 },
  progressTrack: { flex: 1, height: 2, backgroundColor: '#1a1a1a', borderRadius: 1 },
  progressFill: { height: 2, backgroundColor: '#E8640A', borderRadius: 1 },
  progressLabel: { fontSize: 11, color: '#444', width: 24, textAlign: 'right' },
  stepWrap: { flex: 1 },
  screen: { flex: 1, padding: 24 },

  welcomeGlow: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 300, backgroundColor: '#E8640A', opacity: 0.04, borderRadius: 150 },
  welcomeHero: { alignItems: 'center', paddingTop: 20, paddingBottom: 32 },
  logoRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 1.5, borderColor: '#E8640A', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#120800' },
  logoEmoji: { fontSize: 40 },
  welcomeTitle: { fontSize: 34, fontWeight: '700', color: '#fff', fontStyle: 'italic', letterSpacing: -1, marginBottom: 8 },
  welcomeTagline: { fontSize: 14, color: '#555', marginBottom: 14, textAlign: 'center' },
  locationPill: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  locationPillText: { fontSize: 12, color: '#666' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  featureCard: { flex: 1, minWidth: '45%', backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14 },
  featureCardIcon: { fontSize: 22, marginBottom: 8 },
  featureCardTitle: { fontSize: 13, fontWeight: '600', color: '#ccc', marginBottom: 2 },
  featureCardDesc: { fontSize: 11, color: '#444' },

  stepHeader: { marginBottom: 24, paddingTop: 8 },
  stepChip: { fontSize: 11, color: '#E8640A', fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  stepTitle: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  stepSub: { fontSize: 13, color: '#444', lineHeight: 20 },

  inputLabel: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff' },
  inputMulti: { height: 80, textAlignVertical: 'top' },

  emojiPickerWrap: { marginBottom: 8 },
  emojiPicker: { flexDirection: 'row', gap: 10, marginTop: 8 },
  emojiBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: '#E8640A', backgroundColor: '#120800' },
  emojiOption: { fontSize: 24 },
  avatarPreview: { alignItems: 'center', paddingVertical: 16 },
  avatarPreviewEmoji: { fontSize: 72 },

  breedList: { maxHeight: 180, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', marginBottom: 4 },
  breedRow: { paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#111', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breedRowActive: { backgroundColor: '#120800' },
  breedText: { fontSize: 14, color: '#444' },
  breedTextActive: { color: '#E8640A', fontWeight: '600' },

  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#E8640A', padding: 14, marginBottom: 8 },
  summaryEmoji: { fontSize: 36 },
  summaryName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  summaryBreed: { fontSize: 12, color: '#555' },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#E8640A', borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  btnDisabled: { opacity: 0.25 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  primaryBtnArrow: { color: '#fff', fontSize: 18 },
  ghostBtn: { alignItems: 'center', marginTop: 14 },
  ghostBtnText: { color: '#444', fontSize: 14 },
  errorText: { color: '#ed4956', fontSize: 13, marginTop: 8, textAlign: 'center' },

  doneGlow: { position: 'absolute', top: 0, left: '20%', right: '20%', height: 300, backgroundColor: '#E8640A', opacity: 0.05, borderRadius: 150 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  doneAvatarRing: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#E8640A', alignItems: 'center', justifyContent: 'center', backgroundColor: '#120800', marginBottom: 24 },
  doneAvatar: { fontSize: 52 },
  doneTitle: { fontSize: 30, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginBottom: 10 },
  doneSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 20 },
  doneChecks: { alignSelf: 'stretch', backgroundColor: '#0d0d0d', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: '#1a1a1a' },
  doneCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  doneCheckDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8640A' },
  doneCheckText: { fontSize: 13, color: '#ccc' },
});
