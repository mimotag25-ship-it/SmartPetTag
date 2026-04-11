import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Dimensions, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { useLanguage, t } from '../lib/i18n';

const { width, height } = Dimensions.get('window');

const BREEDS = [
  { name: 'Labrador', energy: 5, emoji: '🦮' },
  { name: 'Golden Retriever', energy: 5, emoji: '🐕' },
  { name: 'French Bulldog', energy: 3, emoji: '🐶' },
  { name: 'Poodle', energy: 4, emoji: '🐩' },
  { name: 'German Shepherd', energy: 5, emoji: '🐕‍🦺' },
  { name: 'Husky', energy: 5, emoji: '🐕' },
  { name: 'Chihuahua', energy: 4, emoji: '🐶' },
  { name: 'Dachshund', energy: 3, emoji: '🐕' },
  { name: 'Schnauzer', energy: 4, emoji: '🐕' },
  { name: 'Beagle', energy: 4, emoji: '🐕' },
  { name: 'Rottweiler', energy: 4, emoji: '🐕' },
  { name: 'Shih Tzu', energy: 2, emoji: '🐶' },
  { name: 'Mixed breed', energy: 3, emoji: '🐕' },
  { name: 'Other', energy: 3, emoji: '🐾' },
];

const PERSONALITY_TAGS = [
  '⚡ Energetic', '😴 Chill', '🐾 Playful', '🤗 Friendly',
  '🛡️ Protective', '😊 Gentle', '🔊 Loud', '🤫 Quiet',
  '👶 Loves kids', '🐕 Good with dogs', '😰 Anxious', '❤️ Affectionate',
];

const NEIGHBOURHOODS = [
  'Condesa', 'Roma Norte', 'Roma Sur', 'Polanco', 'Coyoacán',
  'Del Valle', 'Narvarte', 'Portales', 'Juárez', 'Santa Fe',
  'Pedregal', 'Xochimilco', 'Tlalpan', 'Other',
];

const DOG_EMOJIS = ['🐕', '🐶', '🦮', '🐕‍🦺', '🐩'];

const NEARBY_DOGS = [
  { emoji: '🐩', name: 'Luna', x: 0.2, y: 0.3 },
  { emoji: '🐾', name: 'Rocky', x: 0.7, y: 0.25 },
  { emoji: '🐕', name: 'Coco', x: 0.5, y: 0.6 },
  { emoji: '🦮', name: 'Max', x: 0.15, y: 0.65 },
  { emoji: '🐶', name: 'Bella', x: 0.8, y: 0.55 },
  { emoji: '🐕‍🦺', name: 'Thor', x: 0.4, y: 0.2 },
];

function EnergyBar({ level, animated }) {
  const anims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (animated) {
      anims.forEach((a, i) => {
        Animated.timing(a, {
          toValue: i < level ? 1 : 0,
          duration: 300,
          delay: i * 80,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [level, animated]);

  return (
    <View style={ebStyles.wrap}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[ebStyles.bar, {
            backgroundColor: animated
              ? a.interpolate({ inputRange: [0, 1], outputRange: ['#1a1a1a', '#00D4AA'] })
              : i < level ? '#00D4AA' : '#1a1a1a'
          }]}
        />
      ))}
    </View>
  );
}

const ebStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 3 },
  bar: { width: 16, height: 6, borderRadius: 3 },
});

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [dogName, setDogName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐕');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [neighbourhood, setNeighbourhood] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dogDropAnim = useRef(new Animated.Value(-200)).current;
  const dogScaleAnim = useRef(new Animated.Value(0)).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(NEARBY_DOGS.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnims = useRef([...Array(12)].map(() => ({
    y: new Animated.Value(-50),
    x: new Animated.Value(Math.random() * width),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (step === 0) {
      // Animate city dots appearing
      dotAnims.forEach((anim, i) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: i * 300,
          useNativeDriver: true,
        }).start();
      });
      // Counter animation
      Animated.timing(counterAnim, {
        toValue: 47,
        duration: 2000,
        useNativeDriver: false,
      }).start();
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
    if (step === 6) {
      // Dog drop animation
      Animated.sequence([
        Animated.spring(dogDropAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(dogScaleAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
      // Confetti
      confettiAnims.forEach((c, i) => {
        Animated.parallel([
          Animated.timing(c.y, { toValue: height, duration: 2000 + Math.random() * 1000, delay: i * 100, useNativeDriver: true }),
          Animated.timing(c.opacity, { toValue: 0, duration: 2000, delay: i * 100 + 1000, useNativeDriver: true }),
          Animated.timing(c.rotate, { toValue: 360, duration: 1500, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [step]);

  function animateToStep(direction) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: direction === 'next' ? -30 : 30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + (direction === 'next' ? 1 : -1));
      slideAnim.setValue(direction === 'next' ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function canProceed() {
    if (step === 1) return dogName.trim().length > 0;
    if (step === 2) return breed !== null;
    if (step === 3) return selectedTags.length > 0;
    if (step === 4) return neighbourhood.length > 0;
    return true;
  }

  async function finish() {
    if (!email.trim() || !password.trim() || !ownerName.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError && !signUpError.message.includes('already')) {
        setError(signUpError.message); setLoading(false); return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }

      await supabase.from('dogs').insert({
        name: dogName, breed: breed?.name || '', age: parseInt(age) || 0,
        personality: selectedTags.join(', '), neighbourhood,
        owner_name: ownerName, owner_phone: phone, emoji: selectedEmoji,
        owner_email: email,
      });
      await supabase.from('dog_locations').insert({
        dog_name: dogName, owner_name: ownerName, breed: breed?.name || '',
        personality: selectedTags.join(', '), lat: 19.4136, lng: -99.1716,
        visibility: 'public', is_moving: false, emoji: selectedEmoji,
        owner_email: email,
      });
      setLoading(false);
      animateToStep('next');
    } catch (e) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const CONFETTI_COLORS = ['#00D4AA', '#C0392B', '#F5A623', '#5856D6', '#fff', '#FFD700'];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.stepWrap, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>

        {/* ── STEP 0 — CITY ALIVE ── */}
        {step === 0 && (
          <View style={styles.heroScreen}>
            {/* Dark city background */}
            <View style={styles.cityBg}>
              {/* Grid lines */}
              {[...Array(8)].map((_, i) => (
                <View key={`h${i}`} style={[styles.gridLineH, { top: `${i * 14}%` }]} />
              ))}
              {[...Array(6)].map((_, i) => (
                <View key={`v${i}`} style={[styles.gridLineV, { left: `${i * 20}%` }]} />
              ))}

              {/* Animated dog dots */}
              {NEARBY_DOGS.map((dog, i) => (
                <Animated.View
                  key={i}
                  style={[styles.cityDot, {
                    left: `${dog.x * 100}%`,
                    top: `${dog.y * 100}%`,
                    opacity: dotAnims[i],
                    transform: [{ scale: dotAnims[i] }],
                  }]}
                >
                  <Animated.View style={[styles.cityDotPulse, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
                  <View style={styles.cityDotInner}>
                    <Text style={styles.cityDotEmoji}>{dog.emoji}</Text>
                  </View>
                </Animated.View>
              ))}

              {/* Center marker */}
              <View style={styles.centerMarker}>
                <View style={styles.centerMarkerInner}>
                  <Text style={{ fontSize: 20 }}>📍</Text>
                </View>
              </View>
            </View>

            {/* Content overlay */}
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🐾 SMARTPET TAG</Text>
              </View>

              <Animated.Text style={[styles.heroCounter]}>
                {counterAnim.interpolate
                  ? <AnimatedCounter anim={counterAnim} />
                  : '47'
                }
              </Animated.Text>
              <Text style={styles.heroCounterLabel}>dogs protected near you right now</Text>

              <Text style={styles.heroTitle}>Your dog deserves{'\n'}a safety network</Text>
              <Text style={styles.heroSub}>Join the community keeping dogs safe across Ciudad de México</Text>

              <TouchableOpacity style={styles.heroBtn} onPress={() => animateToStep('next')}>
                <Text style={styles.heroBtnText}>Protect my dog →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroLoginBtn} onPress={() => router.push('/login')}>
                <Text style={styles.heroLoginText}>Already a member? Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── STEP 1 — DOG IDENTITY ── */}
        {step === 1 && (
          <KeyboardAvoidingView style={styles.stepScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepNum}>01 / 05</Text>

              {/* Live dog preview */}
              <View style={styles.dogPreviewWrap}>
                <View style={styles.dogPreviewRing}>
                  <Text style={styles.dogPreviewEmoji}>{selectedEmoji}</Text>
                </View>
                <Text style={styles.dogPreviewName}>{dogName || 'Your dog'}</Text>
                <Text style={styles.dogPreviewSub}>tap an emoji to choose</Text>
              </View>

              <View style={styles.emojiRow}>
                {DOG_EMOJIS.map(e => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.emojiBtn, selectedEmoji === e && styles.emojiBtnActive]}
                    onPress={() => setSelectedEmoji(e)}
                  >
                    <Text style={styles.emojiBtnText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>What's your dog's name? *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Athena, Rocky, Luna..."
                placeholderTextColor="#333"
                value={dogName}
                onChangeText={setDogName}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Age (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 3"
                placeholderTextColor="#333"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── STEP 2 — BREED + ENERGY ── */}
        {step === 2 && (
          <View style={styles.stepScreen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepNum}>02 / 05</Text>
              <Text style={styles.stepTitle}>What breed is {dogName}?</Text>
              <Text style={styles.stepSub}>Each breed has its own energy level — tap to reveal</Text>

              {breed && (
                <View style={styles.breedSelectedCard}>
                  <Text style={styles.breedSelectedEmoji}>{breed.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.breedSelectedName}>{breed.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Text style={styles.breedEnergyLabel}>Energy</Text>
                      <EnergyBar level={breed.energy} animated={true} />
                    </View>
                  </View>
                  <Text style={styles.breedSelectedCheck}>✓</Text>
                </View>
              )}

              <View style={styles.breedGrid}>
                {BREEDS.map(b => (
                  <TouchableOpacity
                    key={b.name}
                    style={[styles.breedCard, breed?.name === b.name && styles.breedCardActive]}
                    onPress={() => setBreed(b)}
                  >
                    <Text style={styles.breedCardEmoji}>{b.emoji}</Text>
                    <Text style={[styles.breedCardName, breed?.name === b.name && styles.breedCardNameActive]}>{b.name}</Text>
                    <EnergyBar level={b.energy} animated={false} />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── STEP 3 — PERSONALITY ── */}
        {step === 3 && (
          <View style={styles.stepScreen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepNum}>03 / 05</Text>
              <Text style={styles.stepTitle}>{dogName}'s personality</Text>
              <Text style={styles.stepSub}>This is their character card — other owners will see this</Text>

              <View style={styles.tagCloud}>
                {PERSONALITY_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.personalityTag, selectedTags.includes(tag) && styles.personalityTagActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.personalityTagText, selectedTags.includes(tag) && styles.personalityTagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedTags.length > 0 && (
                <View style={styles.vibeCard}>
                  <Text style={styles.vibeCardLabel}>{dogName}'s vibe ✨</Text>
                  <Text style={styles.vibeCardText}>{selectedTags.join('  ·  ')}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── STEP 4 — NEIGHBOURHOOD MAP ── */}
        {step === 4 && (
          <View style={styles.stepScreen}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepNum}>04 / 05</Text>
              <Text style={styles.stepTitle}>Where does {dogName} roam?</Text>
              <Text style={styles.stepSub}>Connect with dog owners in your colonia</Text>

              {neighbourhood && (
                <View style={styles.neighbourhoodSelected}>
                  <Text style={styles.neighbourhoodSelectedIcon}>📍</Text>
                  <View>
                    <Text style={styles.neighbourhoodSelectedName}>{neighbourhood}</Text>
                    <Text style={styles.neighbourhoodSelectedSub}>6 dogs already walk here</Text>
                  </View>
                  <View style={styles.activeDot} />
                </View>
              )}

              <View style={styles.neighbourhoodGrid}>
                {NEIGHBOURHOODS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.neighbourhoodBtn, neighbourhood === n && styles.neighbourhoodBtnActive]}
                    onPress={() => setNeighbourhood(n)}
                  >
                    <Text style={[styles.neighbourhoodBtnText, neighbourhood === n && styles.neighbourhoodBtnTextActive]}>
                      {neighbourhood === n ? '📍 ' : ''}{n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* ── STEP 5 — ACCOUNT ── */}
        {step === 5 && (
          <KeyboardAvoidingView style={styles.stepScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepNum}>05 / 05</Text>

              <View style={styles.accountDogPreview}>
                <Text style={styles.accountDogEmoji}>{selectedEmoji}</Text>
                <View>
                  <Text style={styles.accountDogName}>{dogName}</Text>
                  <Text style={styles.accountDogBreed}>{breed?.name} · {neighbourhood}</Text>
                </View>
              </View>

              <Text style={styles.stepTitle}>Almost there</Text>
              <Text style={styles.stepSub}>Your contact is only shared if {dogName} goes missing</Text>

              <Text style={styles.fieldLabel}>Your name *</Text>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#333" value={ownerName} onChangeText={setOwnerName} />

              <Text style={styles.fieldLabel}>Phone number</Text>
              <TextInput style={styles.input} placeholder="+52 55 XXXX XXXX" placeholderTextColor="#333" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor="#333" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.fieldLabel}>Password *</Text>
              <TextInput style={styles.input} placeholder="Min 6 characters" placeholderTextColor="#333" value={password} onChangeText={setPassword} secureTextEntry />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.privacyBadge}>
                <Text style={styles.privacyBadgeIcon}>🔒</Text>
                <Text style={styles.privacyBadgeText}>Your data is never sold. Phone only visible to verified finders.</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* ── STEP 6 — WELCOME ── */}
        {step === 6 && (
          <View style={styles.doneScreen}>
            {/* Confetti */}
            {confettiAnims.map((c, i) => (
              <Animated.View
                key={i}
                style={[styles.confetti, {
                  left: c.x,
                  transform: [
                    { translateY: c.y },
                    { rotate: c.rotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }
                  ],
                  opacity: c.opacity,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }]}
              />
            ))}

            <Animated.View style={[styles.doneAvatarWrap, { transform: [{ translateY: dogDropAnim }] }]}>
              <View style={styles.doneAvatarRing}>
                <Text style={styles.doneAvatarEmoji}>{selectedEmoji}</Text>
              </View>
              <Animated.View style={[styles.donePulse, { transform: [{ scale: dogScaleAnim }] }]} />
            </Animated.View>

            <Text style={styles.doneTitle}>{dogName} is protected 🎉</Text>
            <Text style={styles.doneSub}>Welcome to SmartPet Tag, {ownerName.split(' ')[0]}. {dogName} is now part of the {neighbourhood} dog network.</Text>

            <View style={styles.doneStats}>
              {[
                { icon: '🐕', value: '6+', label: 'Nearby dogs' },
                { icon: '🛡️', value: '24/7', label: 'Protection' },
                { icon: '🚨', value: '< 1 min', label: 'Alert speed' },
              ].map((s, i) => (
                <View key={i} style={styles.doneStat}>
                  <Text style={styles.doneStatIcon}>{s.icon}</Text>
                  <Text style={styles.doneStatValue}>{s.value}</Text>
                  <Text style={styles.doneStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.doneChecklist}>
              {[
                `${dogName}'s profile created`,
                `Added to ${neighbourhood} dog map`,
                'Emergency alert ready in 1 tap',
                'Community network activated',
              ].map((item, i) => (
                <View key={i} style={styles.doneCheckRow}>
                  <View style={styles.doneCheckIcon}><Text style={{ fontSize: 10, color: '#050508' }}>✓</Text></View>
                  <Text style={styles.doneCheckText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/explore')}>
              <Text style={styles.doneBtnText}>Enter SmartPet Tag 🐾</Text>
            </TouchableOpacity>
          </View>
        )}

      </Animated.View>

      {/* Navigation */}
      {step > 0 && step < 6 && (
        <View style={styles.bottomNav}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => animateToStep('back')}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}

          <View style={styles.stepDots}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[styles.stepDot, step === i && styles.stepDotActive]} />
            ))}
          </View>

          {step < 5 ? (
            <TouchableOpacity
              style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
              onPress={() => canProceed() && animateToStep('next')}
              disabled={!canProceed()}
            >
              <Text style={styles.nextBtnText}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
              onPress={finish}
              disabled={loading}
            >
              <Text style={styles.nextBtnText}>{loading ? '...' : '✓'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function AnimatedCounter({ anim }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setVal(Math.floor(value)));
    return () => anim.removeListener(id);
  }, []);
  return <Text style={styles.heroCounter}>{val}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  stepWrap: { flex: 1 },

  // Hero screen
  heroScreen: { flex: 1 },
  cityBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: '#0a0a14' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 0.5, backgroundColor: '#0a0a14' },
  cityDot: { position: 'absolute' },
  cityDotPulse: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#00D4AA', top: -10, left: -10 },
  cityDotInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#003d30', borderWidth: 1.5, borderColor: '#00D4AA', alignItems: 'center', justifyContent: 'center' },
  cityDotEmoji: { fontSize: 14 },
  centerMarker: { position: 'absolute', top: '45%', left: '45%' },
  centerMarkerInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a0505', borderWidth: 2, borderColor: '#C0392B', alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 28, paddingBottom: 48, backgroundColor: 'rgba(5,5,8,0.7)' },
  heroBadge: { backgroundColor: 'rgba(0,212,170,0.15)', borderWidth: 0.5, borderColor: '#00D4AA', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20 },
  heroBadgeText: { color: '#00D4AA', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  heroCounter: { fontSize: 64, fontWeight: '900', color: '#fff', lineHeight: 68 },
  heroCounterLabel: { fontSize: 14, color: '#555', marginBottom: 20 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#fff', lineHeight: 42, marginBottom: 10, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: '#555', lineHeight: 22, marginBottom: 28 },
  heroBtn: { backgroundColor: '#00D4AA', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 14 },
  heroBtnText: { color: '#050508', fontWeight: '800', fontSize: 17 },
  heroLoginBtn: { alignItems: 'center', paddingVertical: 8 },
  heroLoginText: { color: '#444', fontSize: 13 },

  // Step screens
  stepScreen: { flex: 1 },
  stepContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  stepNum: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 2, marginBottom: 8 },
  stepTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8, letterSpacing: -0.5 },
  stepSub: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 14 },

  // Dog preview
  dogPreviewWrap: { alignItems: 'center', marginBottom: 24 },
  dogPreviewRing: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#003d30', borderWidth: 3, borderColor: '#00D4AA', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dogPreviewEmoji: { fontSize: 52 },
  dogPreviewName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  dogPreviewSub: { fontSize: 12, color: '#444' },
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  emojiBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1a1a1a' },
  emojiBtnActive: { borderColor: '#00D4AA', backgroundColor: '#003d30' },
  emojiBtnText: { fontSize: 26 },

  // Breed
  breedSelectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#003d30', borderRadius: 14, borderWidth: 1, borderColor: '#00D4AA', padding: 14, marginBottom: 16 },
  breedSelectedEmoji: { fontSize: 28 },
  breedSelectedName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  breedEnergyLabel: { fontSize: 11, color: '#00D4AA' },
  breedSelectedCheck: { color: '#00D4AA', fontSize: 20, fontWeight: '700' },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  breedCard: { width: (width - 72) / 3, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 10, alignItems: 'center', gap: 4 },
  breedCardActive: { backgroundColor: '#003d30', borderColor: '#00D4AA' },
  breedCardEmoji: { fontSize: 22 },
  breedCardName: { fontSize: 10, color: '#555', textAlign: 'center', fontWeight: '500' },
  breedCardNameActive: { color: '#fff' },

  // Personality
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  personalityTag: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a' },
  personalityTagActive: { backgroundColor: '#003d30', borderColor: '#00D4AA' },
  personalityTagText: { fontSize: 13, color: '#555', fontWeight: '500' },
  personalityTagTextActive: { color: '#00D4AA' },
  vibeCard: { backgroundColor: '#003d30', borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#00D4AA' },
  vibeCardLabel: { fontSize: 11, color: '#00D4AA', fontWeight: '700', marginBottom: 6 },
  vibeCardText: { fontSize: 13, color: '#ccc', lineHeight: 20 },

  // Neighbourhood
  neighbourhoodSelected: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#003d30', borderRadius: 14, borderWidth: 1, borderColor: '#00D4AA', padding: 14, marginBottom: 16 },
  neighbourhoodSelectedIcon: { fontSize: 24 },
  neighbourhoodSelectedName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  neighbourhoodSelectedSub: { fontSize: 12, color: '#00D4AA', marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D4AA', marginLeft: 'auto' },
  neighbourhoodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  neighbourhoodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a' },
  neighbourhoodBtnActive: { backgroundColor: '#003d30', borderColor: '#00D4AA' },
  neighbourhoodBtnText: { fontSize: 13, color: '#555', fontWeight: '500' },
  neighbourhoodBtnTextActive: { color: '#00D4AA' },

  // Account
  accountDogPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 20 },
  accountDogEmoji: { fontSize: 32 },
  accountDogName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  accountDogBreed: { fontSize: 12, color: '#555', marginTop: 2 },
  errorText: { color: '#C0392B', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  privacyBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#0d0d14', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#222', marginTop: 8 },
  privacyBadgeIcon: { fontSize: 16 },
  privacyBadgeText: { fontSize: 12, color: '#444', lineHeight: 18, flex: 1 },

  // Done screen
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, overflow: 'hidden' },
  confetti: { position: 'absolute', width: 10, height: 10, borderRadius: 2 },
  doneAvatarWrap: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  doneAvatarRing: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#003d30', borderWidth: 3, borderColor: '#00D4AA', alignItems: 'center', justifyContent: 'center' },
  doneAvatarEmoji: { fontSize: 58 },
  donePulse: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: '#00D4AA', opacity: 0.1, top: -15, left: -15 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  doneSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneStats: { flexDirection: 'row', width: '100%', backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a', marginBottom: 16, overflow: 'hidden' },
  doneStat: { flex: 1, alignItems: 'center', padding: 14, borderRightWidth: 0.5, borderRightColor: '#111' },
  doneStatIcon: { fontSize: 18, marginBottom: 4 },
  doneStatValue: { fontSize: 16, fontWeight: '700', color: '#00D4AA', marginBottom: 2 },
  doneStatLabel: { fontSize: 9, color: '#444', textAlign: 'center' },
  doneChecklist: { alignSelf: 'stretch', backgroundColor: '#003d30', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: '#00D4AA', gap: 8 },
  doneCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneCheckIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#00D4AA', alignItems: 'center', justifyContent: 'center' },
  doneCheckText: { fontSize: 13, color: '#ccc' },
  doneBtn: { backgroundColor: '#00D4AA', borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%' },
  doneBtnText: { color: '#050508', fontWeight: '800', fontSize: 17 },

  // Bottom nav
  bottomNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 0.5, borderTopColor: '#111' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#ccc', fontSize: 18 },
  stepDots: { flexDirection: 'row', gap: 8 },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#222' },
  stepDotActive: { width: 20, backgroundColor: '#00D4AA' },
  nextBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00D4AA', alignItems: 'center', justifyContent: 'center' },
  nextBtnDisabled: { opacity: 0.3 },
  nextBtnText: { color: '#050508', fontSize: 18, fontWeight: '700' },
});
