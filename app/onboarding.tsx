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

  function nextStep() {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep(s => s + 1);
  }

  function prevStep() {
    setStep(s => s - 1);
  }

  async function finish() {
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

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

    <View style={styles.screen} key="welcome">
      <View style={styles.welcomeHero}>
        <Text style={styles.welcomeEmoji}>🐾</Text>
        <Text style={styles.welcomeTitle}>SmartPet Tag</Text>
        <Text style={styles.welcomeSub}>The connected ecosystem for dog owners in Mexico City</Text>
      </View>
      <View style={styles.featureList}>
        {[
          { icon: '📡', text: 'BLE smart collar tags' },
          { icon: '🚨', text: 'Instant lost dog alerts' },
          { icon: '🗺️', text: 'Real-time dog map' },
          { icon: '📸', text: 'Dog social feed' },
          { icon: '🏥', text: 'Find nearby vets & groomers' },
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
      <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.replace('/login')}>
        <Text style={styles.secondaryBtnText}>I already have an account</Text>
      </TouchableOpacity>
    </View>,

    <View style={styles.screen} key="dogname">
      <Text style={styles.stepTitle}>First, tell us about your dog</Text>
      <Text style={styles.stepSub}>This creates their SmartPet Tag profile</Text>
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
      <View style={styles.selectedAvatarWrap}>
        <Text style={styles.selectedAvatar}>{selectedEmoji}</Text>
      </View>
      <Text style={styles.inputLabel}>Dog's name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Athena"
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
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>,

    <View style={styles.screen} key="breed">
      <Text style={styles.stepTitle}>{selectedEmoji} {dogName}'s details</Text>
      <Text style={styles.stepSub}>Help neighbours recognise your dog</Text>
      <Text style={styles.inputLabel}>Breed</Text>
      <ScrollView style={styles.breedList} showsVerticalScrollIndicator={false}>
        {BREEDS.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.breedRow, breed === b && styles.breedRowActive]}
            onPress={() => setBreed(b)}
          >
            <Text style={[styles.breedText, breed === b && styles.breedTextActive]}>{b}</Text>
            {breed === b && <Text style={{ color: '#E8640A' }}>✓</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.inputLabel}>Age (years)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 3"
        placeholderTextColor="#555"
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
      </TouchableOpacity>
    </View>,

    <View style={styles.screen} key="personality">
      <Text style={styles.stepTitle}>Tell us more about {dogName}</Text>
      <Text style={styles.stepSub}>This shows on their tag profile when scanned</Text>
      <Text style={styles.inputLabel}>Personality</Text>
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="e.g. Friendly, loves fetch, gentle with kids"
        placeholderTextColor="#555"
        value={personality}
        onChangeText={setPersonality}
        multiline
      />
      <Text style={styles.inputLabel}>Your neighbourhood</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Condesa, CDMX"
        placeholderTextColor="#555"
        value={neighbourhood}
        onChangeText={setNeighbourhood}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!personality || !neighbourhood) && styles.btnDisabled]}
        onPress={nextStep}
        disabled={!personality || !neighbourhood}
      >
        <Text style={styles.primaryBtnText}>Continue</Text>
      </TouchableOpacity>
    </View>,

    <View style={styles.screen} key="account">
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepSub}>Almost done — set up your owner profile</Text>
      <Text style={styles.inputLabel}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="your@email.com"
        placeholderTextColor="#555"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 6 characters"
        placeholderTextColor="#555"
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
        <Text style={styles.primaryBtnText}>{loading ? 'Creating account...' : 'Create account & save dog'}</Text>
      </TouchableOpacity>
    </View>,

    <View style={styles.screen} key="done">
      <View style={styles.doneWrap}>
        <Text style={styles.doneEmoji}>{selectedEmoji}</Text>
        <Text style={styles.doneTitle}>You're all set!</Text>
        <Text style={styles.doneSub}>{dogName}'s SmartPet Tag profile is live. You can now trigger lost dog alerts, appear on the map, and connect with the dog community in your area.</Text>
        <View style={styles.doneFeatures}>
          <Text style={styles.doneFeature}>✅ Dog profile created</Text>
          <Text style={styles.doneFeature}>✅ Account created</Text>
          <Text style={styles.doneFeature}>✅ Ready to scan BLE tags</Text>
          <Text style={styles.doneFeature}>✅ Lost dog alerts active</Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.primaryBtnText}>Take me to SmartPet Tag 🐾</Text>
        </TouchableOpacity>
      </View>
    </View>,

  ];

  return (
    <View style={styles.container}>
      {step < 5 && (
        <View style={styles.progressWrap}>
          {step > 0 && (
            <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View style={styles.dots}>
            {[0,1,2,3,4].map(i => (
              <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
            ))}
          </View>
        </View>
      )}
      <Animated.View style={[styles.stepWrap, { transform: [{ translateX: slideAnim }] }]}>
        {steps[step]}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, marginRight: 8 },
  backBtnText: { color: '#fff', fontSize: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#333' },
  dotActive: { backgroundColor: '#E8640A', width: 20 },
  stepWrap: { flex: 1 },
  screen: { flex: 1, padding: 24 },
  welcomeHero: { alignItems: 'center', paddingTop: 40, paddingBottom: 40 },
  welcomeEmoji: { fontSize: 64, marginBottom: 16 },
  welcomeTitle: { fontSize: 32, fontWeight: '700', color: '#fff', fontStyle: 'italic', marginBottom: 8 },
  welcomeSub: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  featureList: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  featureIcon: { fontSize: 22, width: 32 },
  featureText: { fontSize: 14, color: '#fff' },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6, marginTop: 16 },
  stepSub: { fontSize: 14, color: '#aaa', marginBottom: 24, lineHeight: 20 },
  inputLabel: { fontSize: 12, color: '#aaa', marginBottom: 6, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  input: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#333', borderRadius: 10, padding: 14, fontSize: 14, color: '#fff', marginBottom: 4 },
  emojiPicker: { flexDirection: 'row', gap: 12, marginBottom: 16, justifyContent: 'center' },
  emojiBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111', borderWidth: 0.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  emojiBtnActive: { borderColor: '#E8640A', backgroundColor: '#1a0e00' },
  emojiOption: { fontSize: 26 },
  selectedAvatarWrap: { alignItems: 'center', marginBottom: 16 },
  selectedAvatar: { fontSize: 64 },
  breedList: { maxHeight: 200, marginBottom: 8, backgroundColor: '#111', borderRadius: 10, borderWidth: 0.5, borderColor: '#333' },
  breedRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breedRowActive: { backgroundColor: '#1a0e00' },
  breedText: { fontSize: 14, color: '#aaa' },
  breedTextActive: { color: '#E8640A', fontWeight: '600' },
  primaryBtn: { backgroundColor: '#E8640A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.35 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', marginTop: 14 },
  secondaryBtnText: { color: '#aaa', fontSize: 14 },
  errorText: { color: '#ed4956', fontSize: 13, marginTop: 8, textAlign: 'center' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneEmoji: { fontSize: 80, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  doneSub: { fontSize: 14, color: '#aaa', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneFeatures: { alignSelf: 'stretch', backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 24 },
  doneFeature: { fontSize: 14, color: '#fff', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
});
