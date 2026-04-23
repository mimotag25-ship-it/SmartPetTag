import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Dimensions, ScrollView, Image, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { colors, shadows } from '../lib/design';
import { useLanguage } from '../lib/i18n';

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
const ENERGY_COLORS = ['#6366F1', '#6366F1', '#10B981', '#F59E0B', '#F97316', '#EF4444'];

const NEARBY_DOTS = [
  { x: 0.15, y: 0.3, emoji: '🐩' }, { x: 0.75, y: 0.2, emoji: '🐕' },
  { x: 0.5, y: 0.55, emoji: '🐶' }, { x: 0.1, y: 0.65, emoji: '🦮' },
  { x: 0.85, y: 0.5, emoji: '🐾' }, { x: 0.4, y: 0.15, emoji: '🐕‍🦺' },
];

export default function Onboarding() {
  const [step, setStep] = useState(-1);
  const [selectedLang, setSelectedLang] = useState('es');
  const [dogName, setDogName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🐕');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState(null);
  const [customBreed, setCustomBreed] = useState('');
  const [showCustomBreed, setShowCustomBreed] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [neighbourhood, setNeighbourhood] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, lang, setLang } = useLanguage();

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(NEARBY_DOTS.map(() => new Animated.Value(0))).current;
  const counterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dogDropAnim = useRef(new Animated.Value(-200)).current;
  const confettiAnims = useRef([...Array(20)].map((_, i) => ({
    y: new Animated.Value(-60 - Math.random() * 100),
    x: new Animated.Value((width / 20) * i + Math.random() * (width / 20)),
    opacity: new Animated.Value(1),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (step === 0) {
      dotAnims.forEach((a, i) => Animated.timing(a, { toValue: 1, duration: 600, delay: i * 250, useNativeDriver: true }).start());
      Animated.timing(counterAnim, { toValue: 47, duration: 2500, useNativeDriver: false }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])).start();
    }
    if (step === 6) {
      Animated.spring(dogDropAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }).start();
      confettiAnims.forEach((c, i) => {
        Animated.parallel([
          Animated.timing(c.y, { toValue: height, duration: 2000 + Math.random() * 1000, delay: i * 80, useNativeDriver: true }),
          Animated.timing(c.opacity, { toValue: 0, duration: 2000, delay: i * 80 + 800, useNativeDriver: true }),
          Animated.timing(c.rotate, { toValue: 360, duration: 1500, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [step]);

  function animateStep(dir) {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir === 'next' ? -28 : 28, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + (dir === 'next' ? 1 : -1));
      slideAnim.setValue(dir === 'next' ? 28 : -28);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    });
  }

  function toggleTag(tag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  function canProceed() {
    if (step === 1) return dogName.trim().length > 0;
    if (step === 2) return breed !== null;
    if (step === 3) return selectedTags.length > 0;
    if (step === 4) return neighbourhood.length > 0;
    return true;
  }

  async function finish() {
    if (!email.trim() || !password.trim() || !ownerName.trim()) { setError('Please fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      // Try sign up first
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      
      // If email exists, just sign in instead
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Could not sign in. Please check your email and password.');
        setLoading(false);
        return;
      }

      let uploadedPhotoUrl = null;
      if (photo) {
        try {
          const response = await fetch(photo);
          const blob = await response.blob();
          const fileName = `dog-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
          if (!uploadError) {
            const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
            uploadedPhotoUrl = data.publicUrl;
          }
        } catch (e) {}
      }

      const { error: dogError } = await supabase.from('dogs').insert({
        name: dogName, breed: breed?.name || '', age: parseInt(age) || 0,
        personality: selectedTags.join(', '), neighbourhood, owner_name: ownerName,
        owner_phone: phone, emoji: selectedEmoji, owner_email: email,
        photo_url: uploadedPhotoUrl,
      });
      if (dogError) { setError('Failed to create profile: ' + dogError.message); setLoading(false); return; }
      
      let gpsLat = 19.4136, gpsLng = -99.1716;
      try {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            pos => { gpsLat = pos.coords.latitude; gpsLng = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 3000 }
          );
        });
      } catch(e) {}

      await supabase.from('dog_locations').insert({
        dog_name: dogName, owner_name: ownerName, breed: breed?.name || '',
        personality: selectedTags.join(', '), lat: gpsLat, lng: gpsLng,
        visibility: 'public', is_moving: false, emoji: selectedEmoji,
        owner_email: email, photo_url: uploadedPhotoUrl,
      });
      setPhotoUrl(uploadedPhotoUrl);
      setLoading(false);
      // Small delay to ensure DB write completes before navigation
      setTimeout(() => animateStep('next'), 500);
    } catch (e) { setError('Something went wrong.'); setLoading(false); }
  }

  const CONFETTI_COLORS = [colors.amber, colors.emergency, '#10B981', '#6366F1', '#fff', '#FBBF24'];
  const progress = Math.max(0, (step - 1) / 5);

  return (
    <View style={s.container}>

      {/* Progress */}
      {step > 0 && step < 6 && (
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={s.progressText}>{step}/5</Text>
        </View>
      )}

      <Animated.View style={[s.stepWrap, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>

        {/* STEP 0 — CITY ALIVE */}
        {step === 0 && (
          <View style={s.heroScreen}>
            <View style={s.cityBg}>
              {[...Array(10)].map((_, i) => <View key={`h${i}`} style={[s.gridH, { top: `${i * 11}%` }]} />)}
              {[...Array(7)].map((_, i) => <View key={`v${i}`} style={[s.gridV, { left: `${i * 16}%` }]} />)}
              {NEARBY_DOTS.map((dot, i) => (
                <Animated.View key={i} style={[s.cityDot, { left: `${dot.x * 100}%`, top: `${dot.y * 100}%`, opacity: dotAnims[i], transform: [{ scale: dotAnims[i] }] }]}>
                  <Animated.View style={[s.cityDotRing, { transform: [{ scale: pulseAnim }], opacity: 0.25 }]} />
                  <View style={s.cityDotInner}><Text style={s.cityDotEmoji}>{dot.emoji}</Text></View>
                </Animated.View>
              ))}
              <View style={s.centerPin}>
                <View style={s.centerPinInner}><Text style={{ fontSize: 18 }}>📍</Text></View>
              </View>
            </View>
            <View style={s.heroOverlay}>
              <View style={s.heroBadge}><Text style={s.heroBadgeText}>🐾 SMARTPET TAG</Text></View>
              <CounterText anim={counterAnim} />
              <Text style={s.heroCounterSub}>pets protected near you right now</Text>
              <Text style={s.heroTitle}>Your pet deserves{'\n'}a safety network</Text>
              <Text style={s.heroSub}>Join the community keeping pets safe across Ciudad de México</Text>
              <TouchableOpacity style={s.heroBtn} onPress={() => animateStep('next')}>
                <Text style={s.heroBtnText}>{'Protect my pet →'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.heroLoginBtn} onPress={() => router.push('/login')}>
                <Text style={s.heroLoginText}>{'Already a member? Sign in'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 1 — PET IDENTITY + PHOTO */}
        {step === 1 && (
          <KeyboardAvoidingView style={s.stepScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
              <Text style={s.stepNum}>01 / 05</Text>
              <Text style={s.stepTitle}>{'Tell us about your pet'}</Text>
              <Text style={s.stepSub}>{'This becomes their profile on SmartPet Tag'}</Text>

              {/* Large photo upload */}
              <TouchableOpacity style={s.photoUploadWrap} onPress={pickPhoto}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.photoUploaded} />
                ) : (
                  <View style={s.photoUploadPlaceholder}>
                    <Text style={s.photoUploadIcon}>📷</Text>
                    <Text style={s.photoUploadTitle}>{t('addPhoto')}</Text>
                    <Text style={s.photoUploadSub}>Tap to upload your pet's photo</Text>
                  </View>
                )}
                <View style={s.photoUploadBadge}>
                  <Text style={s.photoUploadBadgeText}>{photo ? '✓' : '+'}</Text>
                </View>
              </TouchableOpacity>

              <Text style={s.orDivider}>{t('orChooseEmoji')}</Text>

              <View style={s.emojiRow}>
                {DOG_EMOJIS.map(e => (
                  <TouchableOpacity key={e} style={[s.emojiBtn, selectedEmoji === e && s.emojiBtnActive]} onPress={() => setSelectedEmoji(e)}>
                    <Text style={s.emojiBtnText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.fieldLabel}>{'Pet name *'}</Text>
              <TextInput style={s.input} placeholder={'e.g. Athena, Rocky, Luna...'} placeholderTextColor={colors.textMuted} value={dogName} onChangeText={setDogName} autoFocus />

              <Text style={s.fieldLabel}>{'Age (years)'}</Text>
              <TextInput style={s.input} placeholder="e.g. 3" placeholderTextColor={colors.textMuted} value={age} onChangeText={setAge} keyboardType="numeric" />
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* STEP 2 — BREED */}
        {step === 2 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
            <Text style={s.stepNum}>02 / 05</Text>
            <Text style={s.stepTitle}>What breed is {dogName || 'your pet'}?</Text>
            <Text style={s.stepSub}>Each breed has its own energy level</Text>
            {breed && (
              <View style={s.selectedBreedCard}>
                <Text style={s.selectedBreedEmoji}>{breed.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.selectedBreedName}>{breed.name}</Text>
                  <View style={s.energyRow}>
                    <Text style={s.energyLabel}>Energy</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {[1,2,3,4,5].map(i => (
                        <View key={i} style={{ width: 16, height: 6, borderRadius: 2, backgroundColor: i <= breed.energy ? ENERGY_COLORS[breed.energy] : colors.bgBorder }} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={s.checkMark}>✓</Text>
              </View>
            )}
            <View style={s.breedGrid}>
              {BREEDS.map(b => (
                <TouchableOpacity key={b.name} style={[s.breedCard, breed?.name === b.name && s.breedCardActive]} onPress={() => { setBreed(b); if (b.name === 'Other') setShowCustomBreed(true); else setShowCustomBreed(false); }}>
                  <Text style={s.breedCardEmoji}>{b.emoji}</Text>
                  <Text style={[s.breedCardName, breed?.name === b.name && { color: colors.textPrimary }]}>{b.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1,2,3,4,5].map(i => <View key={i} style={{ width: 10, height: 4, borderRadius: 1, backgroundColor: i <= b.energy ? ENERGY_COLORS[b.energy] : colors.bgBorder }} />)}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {showCustomBreed && (
              <View style={{ marginTop: 14 }}>
                <Text style={s.fieldLabel}>Enter your pet's breed</Text>
                <TextInput
                  style={s.input}
                  placeholder="e.g. Xoloitzcuintli, Pitbull mix..."
                  placeholderTextColor={colors.textMuted}
                  value={customBreed}
                  autoFocus
                  onChangeText={(text) => setCustomBreed(text)}
                  onBlur={() => { if (customBreed.trim()) setBreed({ name: customBreed.trim(), energy: 3, emoji: '🐾' }); }}
                  onSubmitEditing={() => { if (customBreed.trim()) setBreed({ name: customBreed.trim(), energy: 3, emoji: '🐾' }); }}
                />
              </View>
            )}
          </ScrollView>
        )}

        {/* STEP 3 — PERSONALITY */}
        {step === 3 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
            <Text style={s.stepNum}>03 / 05</Text>
            <Text style={s.stepTitle}>{dogName}'s personality</Text>
            <Text style={s.stepSub}>This is their character card — other owners will see this</Text>
            <View style={s.tagCloud}>
              {PERSONALITY_TAGS.map(tag => (
                <TouchableOpacity key={tag} style={[s.tagBtn, selectedTags.includes(tag) && s.tagBtnActive]} onPress={() => toggleTag(tag)}>
                  <Text style={[s.tagBtnText, selectedTags.includes(tag) && s.tagBtnTextActive]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTags.length > 0 && (
              <View style={s.vibeCard}>
                <Text style={s.vibeCardLabel}>{dogName}'s vibe ✨</Text>
                <Text style={s.vibeCardText}>{selectedTags.join('  ·  ')}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* STEP 4 — NEIGHBOURHOOD */}
        {step === 4 && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
            <Text style={s.stepNum}>04 / 05</Text>
            <Text style={s.stepTitle}>Where does {dogName} roam?</Text>
            <Text style={s.stepSub}>Connect with pet owners in your colonia</Text>
            <View style={s.gpsCard}>
              <Text style={s.gpsCardIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.gpsCardTitle}>Allow location for live map</Text>
                <Text style={s.gpsCardText}>Your phone GPS shows {dogName} moving on the community map. Without a GPS tag on the collar, the map only updates when you have your phone.</Text>
              </View>
            </View>
            <View style={s.tagWarning}>
              <Text style={s.tagWarningIcon}>🏷️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tagWarningTitle}>Want live tracking without your phone?</Text>
                <Text style={s.tagWarningText}>Attach a Tractive or Tile GPS tag to {dogName}'s collar. Connect it in your profile settings after signup.</Text>
              </View>
            </View>
            <Text style={s.fieldLabel}>Street or neighbourhood name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Parque España, Condesa..."
              placeholderTextColor={colors.textMuted}
              value={neighbourhood}
              onChangeText={setNeighbourhood}
              autoFocus
            />
            {neighbourhood.length > 0 && (
              <View style={s.suggestionsWrap}>
                {NEIGHBOURHOODS.filter(n => n.toLowerCase().includes(neighbourhood.toLowerCase())).slice(0, 4).map(n => (
                  <TouchableOpacity key={n} style={s.suggestionRow} onPress={() => setNeighbourhood(n)}>
                    <Text style={s.suggestionIcon}>📍</Text>
                    <Text style={s.suggestionText}>{n}</Text>
                  </TouchableOpacity>
                ))}
                {!NEIGHBOURHOODS.some(n => n.toLowerCase() === neighbourhood.toLowerCase()) && neighbourhood.length > 2 && (
                  <TouchableOpacity style={[s.suggestionRow, { borderColor: colors.amber }]} onPress={() => setNeighbourhood(neighbourhood)}>
                    <Text style={s.suggestionIcon}>✓</Text>
                    <Text style={[s.suggestionText, { color: colors.amber }]}>Use "{neighbourhood}"</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Text style={s.fieldLabel} >Or choose a popular colonia</Text>
            <View style={s.neighbourhoodGrid}>
              {NEIGHBOURHOODS.slice(0, 8).map(n => (
                <TouchableOpacity key={n} style={[s.neighbourhoodBtn, neighbourhood === n && s.neighbourhoodBtnActive]} onPress={() => setNeighbourhood(n)}>
                  <Text style={[s.neighbourhoodBtnText, neighbourhood === n && s.neighbourhoodBtnTextActive]}>
                    {neighbourhood === n ? '📍 ' : ''}{n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* STEP 5 — ACCOUNT */}
        {step === 5 && (
          <KeyboardAvoidingView style={s.stepScreen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
              <Text style={s.stepNum}>05 / 05</Text>
              <View style={s.accountPreview}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.accountPreviewPhoto} />
                ) : (
                  <Text style={{ fontSize: 36 }}>{selectedEmoji}</Text>
                )}
                <View>
                  <Text style={s.accountPreviewName}>{dogName}</Text>
                  <Text style={s.accountPreviewBreed}>{breed?.name} · {neighbourhood}</Text>
                </View>
              </View>
              <Text style={s.stepTitle}>{'Almost there'}</Text>
              <Text style={s.stepSub}>{'Your contact is only shared if'} {dogName} {'goes missing'}</Text>
              <Text style={s.fieldLabel}>{'Your full name *'}</Text>
              <TextInput style={s.input} placeholder="First and last name" placeholderTextColor={colors.textMuted} value={ownerName} onChangeText={setOwnerName} />
              <Text style={s.fieldLabel}>{'Phone number'}</Text>
              <TextInput style={s.input} placeholder="+52 55 XXXX XXXX" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Text style={s.fieldLabel}>{'Email address *'}</Text>
              <TextInput style={s.input} placeholder="your@email.com" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={s.fieldLabel}>{'Password *'}</Text>
              <TextInput style={s.input} placeholder="Min 6 characters" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
              {error ? <Text style={s.errorText}>{error}</Text> : null}
              <View style={s.privacyNote}>
                <Text style={s.privacyNoteIcon}>🔒</Text>
                <Text style={s.privacyNoteText}>Your data is never sold. Phone only visible to verified finders.</Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        {/* STEP 6 — WELCOME */}
        {step === 6 && (
          <View style={s.doneScreen}>
            {confettiAnims.map((c, i) => (
              <Animated.View key={i} style={[s.confetti, { left: c.x, transform: [{ translateY: c.y }, { rotate: c.rotate.interpolate({ inputRange: [0,360], outputRange: ['0deg','360deg'] }) }], opacity: c.opacity, backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }]} />
            ))}
            <View style={{ alignItems: 'center', width: '100%', zIndex: 1 }}>
            <Animated.View style={[s.doneAvatarWrap, { transform: [{ translateY: dogDropAnim }] }]}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={s.doneAvatarPhoto} />
              ) : (
                <View style={s.doneAvatarPlaceholder}>
                  <Text style={{ fontSize: 64 }}>{selectedEmoji}</Text>
                </View>
              )}
              <View style={s.doneOnlineDot} />
            </Animated.View>
            <Text style={s.doneTitle}>{dogName} {'is protected 🎉'}</Text>
            <Text style={s.doneSub}>{'Welcome to SmartPet Tag,'} {ownerName.split(' ')[0]}. {dogName} is now part of the {neighbourhood} pet network.</Text>
            <View style={s.doneStats}>
              {[{ icon: '🐾', value: '6+', label: 'Nearby pets' }, { icon: '🛡️', value: '24/7', label: 'Protection' }, { icon: '🚨', value: '< 1m', label: 'Alert speed' }].map((stat, i) => (
                <View key={i} style={s.doneStat}>
                  <Text style={s.doneStatIcon}>{stat.icon}</Text>
                  <Text style={s.doneStatValue}>{stat.value}</Text>
                  <Text style={s.doneStatLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
            <View style={s.doneChecklist}>
              {[`${dogName}'s profile created`, `Added to ${neighbourhood} pet map`, 'Emergency alert ready in 1 tap', 'Community network activated'].map((item, i) => (
                <View key={i} style={s.doneCheckRow}>
                  <View style={s.doneCheckDot}><Text style={{ fontSize: 9, color: colors.bg }}>✓</Text></View>
                  <Text style={s.doneCheckText}>{item}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={s.enterBtn} onPress={() => router.replace('/(tabs)/explore')}>
              <Text style={s.enterBtnText}>{'Enter SmartPet Tag 🐾'}</Text>
            </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Nav */}
      {step > 0 && step < 6 && (
        <View style={s.nav}>
          {step > 1 ? (
            <TouchableOpacity style={s.navBack} onPress={() => animateStep('back')}>
              <Text style={s.navBackText}>←</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
          <View style={s.navDots}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.navDot, step === i && s.navDotActive, step > i && s.navDotDone]} />
            ))}
          </View>
          {step < 5 ? (
            <TouchableOpacity style={[s.navNext, !canProceed() && s.navNextDisabled]} onPress={() => canProceed() && animateStep('next')} disabled={!canProceed()}>
              <Text style={s.navNextText}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.navNext, loading && s.navNextDisabled]} onPress={finish} disabled={loading}>
              <Text style={s.navNextText}>{loading ? '...' : '✓'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

function CounterText({ anim }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setVal(Math.floor(value)));
    return () => anim.removeListener(id);
  }, []);
  return <Text style={s.heroCounter}>{val}</Text>;
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  langScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  langTitle: { fontSize: 36, fontWeight: '900', color: colors.textPrimary, fontStyle: 'italic', marginBottom: 8 },
  langSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  langCards: { flexDirection: 'row', gap: 16, marginBottom: 32, width: '100%' },
  langCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 20, borderWidth: 1.5, borderColor: colors.bgBorder, padding: 20, alignItems: 'center', gap: 6 },
  langCardActive: { borderColor: colors.amber, backgroundColor: colors.amberDim },
  langFlag: { fontSize: 40 },
  langName: { fontSize: 18, fontWeight: '800', color: colors.textMuted },
  langNameActive: { color: colors.amber },
  langNative: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  langContinueBtn: { backgroundColor: colors.amber, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 48, alignItems: 'center' },
  langContinueBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  stepWrap: { flex: 1 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  progressTrack: { flex: 1, height: 3, backgroundColor: colors.bgBorder, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber, borderRadius: 2 },
  progressText: { fontSize: 11, color: colors.textMuted, width: 30, textAlign: 'right' },

  // Hero
  heroScreen: { flex: 1 },
  cityBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 0.5, backgroundColor: '#111827' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 0.5, backgroundColor: '#111827' },
  cityDot: { position: 'absolute' },
  cityDotRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amber, top: -10, left: -10 },
  cityDotInner: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.amberDim, borderWidth: 1.5, borderColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  cityDotEmoji: { fontSize: 15 },
  centerPin: { position: 'absolute', top: '45%', left: '45%' },
  centerPinInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.emergencyDim, borderWidth: 2, borderColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 28, paddingBottom: 52, backgroundColor: 'rgba(10,15,30,0.75)' },
  heroBadge: { backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 0.5, borderColor: colors.amber, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20 },
  heroBadgeText: { color: colors.amber, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  heroCounter: { fontSize: 72, fontWeight: '900', color: '#FFFFFF', lineHeight: 76, letterSpacing: -3 },
  heroCounterSub: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  heroTitle: { fontSize: 38, fontWeight: '900', color: '#FFFFFF', lineHeight: 44, marginBottom: 10, letterSpacing: -1 },
  heroSub: { fontSize: 15, color: '#9CA3AF', lineHeight: 24, marginBottom: 28 },
  heroBtn: { backgroundColor: colors.amber, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12, ...shadows.amber },
  heroBtnText: { color: colors.bg, fontWeight: '900', fontSize: 17 },
  heroLoginBtn: { alignItems: 'center', paddingVertical: 8 },
  heroLoginText: { color: '#9CA3AF', fontSize: 13 },

  // Steps
  stepScreen: { flex: 1 },
  stepContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  stepNum: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  stepTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 6, letterSpacing: -0.5 },
  stepSub: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: 24 },
  fieldLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder, borderRadius: 12, padding: 14, fontSize: 14, color: colors.textPrimary, marginBottom: 12 },

  // Photo upload
  photoUploadWrap: { alignSelf: 'center', marginBottom: 8, position: 'relative' },
  photoUploaded: { width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: colors.amber },
  photoUploadPlaceholder: { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.amberDim, borderWidth: 2.5, borderColor: colors.amber + '80', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoUploadIcon: { fontSize: 36 },
  photoUploadTitle: { fontSize: 14, fontWeight: '700', color: colors.amber },
  photoUploadSub: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  photoUploadBadge: { position: 'absolute', bottom: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: colors.bg },
  photoUploadBadgeText: { color: colors.bg, fontSize: 14, fontWeight: '900' },
  orDivider: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginBottom: 12 },

  // Emoji row
  emojiRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
  emojiBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.bgBorder },
  emojiBtnActive: { borderColor: colors.amber, backgroundColor: colors.amberDim },
  emojiBtnText: { fontSize: 26 },

  // Breed
  selectedBreedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.amberDim, borderRadius: 14, borderWidth: 1, borderColor: colors.amber, padding: 14, marginBottom: 16 },
  selectedBreedEmoji: { fontSize: 28 },
  selectedBreedName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  energyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  energyLabel: { fontSize: 11, color: colors.amber },
  checkMark: { color: colors.amber, fontSize: 20, fontWeight: '700' },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  breedCard: { width: (width - 68) / 3, backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 10, alignItems: 'center', gap: 4 },
  breedCardActive: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  breedCardEmoji: { fontSize: 22 },
  breedCardName: { fontSize: 10, color: colors.textMuted, textAlign: 'center', fontWeight: '500' },

  // Personality
  tagCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  tagBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 24, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder },
  tagBtnActive: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  tagBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  tagBtnTextActive: { color: colors.amber },
  vibeCard: { backgroundColor: colors.amberDim, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: colors.amber },
  vibeCardLabel: { fontSize: 11, color: colors.amber, fontWeight: '700', marginBottom: 6 },
  vibeCardText: { fontSize: 13, color: '#D1D5DB', lineHeight: 20 },

  // Neighbourhood
  selectedNeighbourhood: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.amberDim, borderRadius: 14, borderWidth: 1, borderColor: colors.amber, padding: 14, marginBottom: 16 },
  selectedNeighbourhoodIcon: { fontSize: 24 },
  selectedNeighbourhoodName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  selectedNeighbourhoodSub: { fontSize: 12, color: colors.amber, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber, marginLeft: 'auto' },
  gpsCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.communityDim, borderRadius: 12, borderWidth: 0.5, borderColor: colors.community, padding: 14, marginBottom: 12 },
  gpsCardIcon: { fontSize: 20 },
  gpsCardTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  gpsCardText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  tagWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.amberDim, borderRadius: 12, borderWidth: 0.5, borderColor: colors.amber, padding: 14, marginBottom: 16 },
  tagWarningIcon: { fontSize: 20 },
  tagWarningTitle: { fontSize: 13, fontWeight: '700', color: colors.amber, marginBottom: 3 },
  tagWarningText: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  suggestionsWrap: { backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, marginBottom: 12, overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  suggestionIcon: { fontSize: 14, color: colors.amber },
  suggestionText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  neighbourhoodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  neighbourhoodBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder },
  neighbourhoodBtnActive: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  neighbourhoodBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  neighbourhoodBtnTextActive: { color: colors.amber },

  // Account
  accountPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 14, marginBottom: 20 },
  accountPreviewPhoto: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.amber },
  accountPreviewName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  accountPreviewBreed: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  errorText: { color: colors.emergency, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: colors.bgBorder, marginTop: 8 },
  privacyNoteIcon: { fontSize: 16 },
  privacyNoteText: { fontSize: 12, color: colors.textMuted, lineHeight: 18, flex: 1 },

  // Done
  doneScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, position: 'relative' },
  confetti: { position: 'absolute', width: 12, height: 12, borderRadius: 2, zIndex: 0, pointerEvents: 'none' },
  doneAvatarWrap: { marginBottom: 20, position: 'relative' },
  doneAvatarPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: colors.amber },
  doneAvatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.amberDim, borderWidth: 3, borderColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  doneOnlineDot: { position: 'absolute', bottom: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 2.5, borderColor: colors.bg },
  doneTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, textAlign: 'center', marginBottom: 8, letterSpacing: -0.5 },
  doneSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  doneStats: { flexDirection: 'row', width: '100%', backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 0.5, borderColor: colors.bgBorder, marginBottom: 16, overflow: 'hidden' },
  doneStat: { flex: 1, alignItems: 'center', padding: 14, borderRightWidth: 0.5, borderRightColor: colors.bgBorder },
  doneStatIcon: { fontSize: 18, marginBottom: 4 },
  doneStatValue: { fontSize: 18, fontWeight: '800', color: colors.amber, marginBottom: 2 },
  doneStatLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
  doneChecklist: { alignSelf: 'stretch', backgroundColor: colors.amberDim, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 0.5, borderColor: colors.amber + '60', gap: 8 },
  doneCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneCheckDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  doneCheckText: { fontSize: 12, color: '#D1D5DB' },
  enterBtn: { backgroundColor: colors.amber, borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%', ...shadows.amber },
  enterBtnText: { color: colors.bg, fontWeight: '900', fontSize: 17 },

  // Nav
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 0.5, borderTopColor: colors.bgBorder },
  navBack: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: colors.bgBorder },
  navBackText: { color: '#9CA3AF', fontSize: 18 },
  navDots: { flexDirection: 'row', gap: 8 },
  navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bgBorder },
  navDotActive: { width: 22, backgroundColor: colors.amber, borderRadius: 3 },
  navDotDone: { backgroundColor: colors.amber + '60' },
  navNext: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  navNextDisabled: { opacity: 0.3 },
  navNextText: { color: colors.bg, fontSize: 18, fontWeight: '800' },
});
