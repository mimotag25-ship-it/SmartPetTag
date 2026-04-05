import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const BREEDS = ['Labrador Retriever', 'Golden Retriever', 'French Bulldog', 'German Shepherd', 'Poodle', 'Chihuahua', 'Schnauzer', 'Beagle', 'Husky', 'Dachshund', 'Shih Tzu', 'Mixed breed'];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [dogName, setDogName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [personality, setPersonality] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  function nextStep() {
    Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(width);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    });
  }

  function prevStep() {
    Animated.timing(slideAnim, { toValue: width, duration: 250, useNativeDriver: true }).start(() => {
      setStep(s => s - 1);
      slideAnim.setValue(-width);
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    });
  }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) { setError(authError.message); setLoading(false); return; }

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
      router.replace('/');
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  const steps = [

    // ── STEP 0: Welcome ──
    <View style={styles.slide}>
      <View style={styles.welcomeHero}>
        <Text style={styles.welcomeEmoji}>🐾</Text>
        <Text style={styles.welcomeTitle}>SmartPet Tag</Text>
        <Text style={styles.welcomeSub}>The smart collar ecosystem for dog owners in Mexico City</Text>
      </View>
      <View style={styles.featureList}>
        {[
          { icon: '📡', text: 'BLE collar tag — found without scanning' },
          { icon: '🚨', text: 'Lost dog alerts to your whole neighbourhood' },
          { icon: '🗺️', text: 'Live map of nearby dogs, parks & vets' },
          { icon: '📸', text: 'Social feed for the dog community' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
        <Text style={styles.primaryBtnText}>Get started 🐾</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 16 }}>
        <Text style={styles.secondaryLink}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 1: Dog name ──
    <View style={styles.slide}>
      <Text style={styles.stepEmoji}>🐕</Text>
      <Text style={styles.stepTitle}>What's your dog's name?</Text>
      <Text style={styles.stepSub}>This appears on their SmartPet Tag profile</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Athena, Mango, Rocky..."
        placeholderTextColor="#555"
        value={dogName}
        onChangeText={setDogName}
        autoFocus
      />
      <TouchableOpacity
        style={[styles.primaryBtn, !dogName.trim() && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!dogName.trim()}
      >
        <Text style={styles.primaryBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 2: Breed ──
    <View style={styles.slide}>
      <Text style={styles.stepEmoji}>🦮</Text>
      <Text style={styles.stepTitle}>What breed is {dogName}?</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Labrador Retriever..."
        placeholderTextColor="#555"
        value={breed}
        onChangeText={setBreed}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breedPills}>
        {BREEDS.map((b, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.breedPill, breed === b && styles.breedPillActive]}
            onPress={() => setBreed(b)}
          >
            <Text style={[styles.breedPillText, breed === b && styles.breedPillTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={[styles.primaryBtn, !breed.trim() && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!breed.trim()}
      >
        <Text style={styles.primaryBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 3: Age + personality ──
    <View style={styles.slide}>
      <Text style={styles.stepEmoji}>🎂</Text>
      <Text style={styles.stepTitle}>Tell us about {dogName}</Text>
      <Text style={styles.inputLabel}>Age (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3"
        placeholderTextColor="#555"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />
      <Text style={styles.inputLabel}>Personality</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        placeholder="e.g. Loves fetch, gentle with kids, friendly..."
        placeholderTextColor="#555"
        value={personality}
        onChangeText={setPersonality}
        multiline
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!age.trim() || !personality.trim()) && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!age.trim() || !personality.trim()}
      >
        <Text style={styles.primaryBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 4: Neighbourhood ──
    <View style={styles.slide}>
      <Text style={styles.stepEmoji}>📍</Text>
      <Text style={styles.stepTitle}>Where are you based?</Text>
      <Text style={styles.stepSub}>Used to show {dogName} on the local map</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breedPills}>
        {['Condesa', 'Roma Norte', 'Roma Sur', 'Polanco', 'Portales', 'Coyoacán', 'Del Valle', 'Narvarte', 'Doctores', 'Centro'].map((n, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.breedPill, neighbourhood === n && styles.breedPillActive]}
            onPress={() => setNeighbourhood(n + ', CDMX')}
          >
            <Text style={[styles.breedPillText, neighbourhood === n + ', CDMX' && styles.breedPillTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        placeholder="Or type your neighbourhood..."
        placeholderTextColor="#555"
        value={neighbourhood}
        onChangeText={setNeighbourhood}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, !neighbourhood.trim() && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!neighbourhood.trim()}
      >
        <Text style={styles.primaryBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 5: Account ──
    <View style={styles.slide}>
      <Text style={styles.stepEmoji}>🔐</Text>
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepSub}>Almost done — just your email and password</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#555"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.primaryBtn, (!email.trim() || password.length < 6) && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!email.trim() || password.length < 6}
      >
        <Text style={styles.primaryBtnText}>Continue →</Text>
      </TouchableOpacity>
    </View>,

    // ── STEP 6: All set ──
    <View style={styles.slide}>
      <View style={styles.successWrap}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>All set, {dogName}!</Text>
        <Text style={styles.successSub}>Your SmartPet Tag profile is ready. Welcome to the Condesa dog community.</Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Dog</Text>
          <Text style={styles.summaryVal}>{dogName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Breed</Text>
          <Text style={styles.summaryVal}>{breed}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Age</Text>
          <Text style={styles.summaryVal}>{age} yrs</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Area</Text>
          <Text style={styles.summaryVal}>{neighbourhood}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>Account</Text>
          <Text style={styles.summaryVal}>{email}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={finish}
        disabled={loading}
      >
        <Text style={styles.primaryBtnText}>{loading ? 'Creating your profile...' : 'Take me to SmartPet Tag 🐾'}</Text>
      </TouchableOpacity>
    </View>,
  ];

  return (
    <View style={styles.container}>

      {/* Progress dots */}
      {step > 0 && step < steps.length - 1 && (
        <View style={styles.progress}>
          {steps.slice(1, -1).map((_, i) => (
            <View key={i} style={[styles.dot, i + 1 <= step && styles.dotActive]} />
          ))}
        </View>
      )}

      {/* Back button */}
      {step > 0 && step < steps.length - 1 && (
        <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      )}

      {/* Slide content */}
      <Animated.View style={[styles.slideWrap, { transform: [{ translateX: slideAnim }] }]}>
        {steps[step]}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: 16, paddingBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  dotActive: { backgroundColor: '#E8640A', width: 20 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 8 },
  backBtnText: { color: '#aaa', fontSize: 14 },
  slideWrap: { flex: 1 },
  slide: { flex: 1, paddingHorizontal: 28, paddingVertical: 20, justifyContent: 'center' },
  welcomeHero: { alignItems: 'center', marginBottom: 32 },
  welcomeEmoji: { fontSize: 64, marginBottom: 12 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 8, fontStyle: 'italic' },
  welcomeSub: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  featureList: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  featureIcon: { fontSize: 24, width: 36, textAlign: 'center' },
  featureText: { fontSize: 14, color: '#ccc', flex: 1, lineHeight: 20 },
  stepEmoji: { fontSize: 52, marginBottom: 16, textAlign: 'center' },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  stepSub: { fontSize: 14, color: '#aaa', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  inputLabel: { fontSize: 13, color: '#aaa', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#333', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 14 },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  breedPills: { marginBottom: 16, maxHeight: 44 },
  breedPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: '#333', backgroundColor: '#111', marginRight: 8 },
  breedPillActive: { backgroundColor: '#E8640A', borderColor: '#E8640A' },
  breedPillText: { fontSize: 13, color: '#aaa' },
  breedPillTextActive: { color: '#fff', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#E8640A', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryLink: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  errorText: { color: '#ff4444', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  successWrap: { alignItems: 'center', marginBottom: 28 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  summaryCard: { backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 24, borderWidth: 0.5, borderColor: '#262626' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  summaryKey: { fontSize: 13, color: '#aaa' },
  summaryVal: { fontSize: 13, color: '#fff', fontWeight: '500' },
});
