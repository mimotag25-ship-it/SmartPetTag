import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Linking, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows } from '../lib/design';

export default function Found() {
  const { alertId, dogName, ownerName, ownerPhone, neighbourhood } = useLocalSearchParams();
  const [finderName, setFinderName] = useState('');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  const phone = Array.isArray(ownerPhone) ? ownerPhone[0] : ownerPhone;
  const name = Array.isArray(dogName) ? dogName[0] : dogName;
  const owner = Array.isArray(ownerName) ? ownerName[0] : ownerName;
  const aid = Array.isArray(alertId) ? alertId[0] : alertId;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function submit() {
    if (!finderName.trim()) return;
    setSubmitting(true);
    let uploadedUrl = null;
    if (photo) {
      try {
        const response = await fetch(photo);
        const blob = await response.blob();
        const fileName = `found-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!error) {
          const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
          uploadedUrl = data.publicUrl;
        }
      } catch(e) {}
    }

    await supabase.from('lost_alerts').update({
      finder_name: finderName,
      found_message: message,
      found_location: location,
      found_photo: uploadedUrl,
      status_pending_owner: true,
      found_contacted: true,
    }).eq('id', aid);

    await supabase.from('activity').insert({
      type: 'sighting', message: `👀 ${name} spotted by ${finderName} near ${location || neighbourhood}`,
      icon: '👀', neighbourhood: location || neighbourhood, urgent: true,
    });

    const { data: conv } = await supabase.from('conversations').insert({
      dog1_name: name, dog2_name: finderName,
      owner1_phone: phone, owner2_phone: '',
      last_message: `Hi! I found ${name}`, alert_id: String(aid),
    }).select().single();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id, sender_dog: finderName,
        sender_name: finderName, text: `Hi! I found ${name}. ${message}`,
      });
    }

    setPhotoUrl(uploadedUrl);
    setSubmitting(false);
    setSubmitted(true);

    if (conv) {
      setTimeout(() => router.push({ pathname: '/message', params: { conversationId: conv.id, otherDog: name, otherOwner: phone } }), 1500);
    }
  }

  if (submitted) return (
    <View style={s.container}>
      <View style={s.successScreen}>
        <Text style={s.successEmoji}>🎉</Text>
        <Text style={s.successTitle}>Report sent!</Text>
        <Text style={s.successSub}>The owner has been notified. A chat has been opened so you can coordinate the handoff.</Text>
        <View style={s.successSteps}>
          <Text style={s.successStep}>✓ Owner notified via push notification</Text>
          <Text style={s.successStep}>✓ Alert marked as pending confirmation</Text>
          <Text style={s.successStep}>✓ Chat thread opened</Text>
        </View>
        <TouchableOpacity style={s.chatNowBtn} onPress={() => router.replace('/(tabs)/explore')}>
          <Text style={s.chatNowBtnText}>Back to feed →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Found a pet</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        {/* Dog info */}
        <View style={s.dogCard}>
          <View style={s.dogCardAvatar}>
            <Text style={{ fontSize: 32 }}>🐕</Text>
          </View>
          <View>
            <Text style={s.dogCardName}>{name}</Text>
            <Text style={s.dogCardOwner}>Owner: {owner}</Text>
          </View>
        </View>

        {/* Step indicators */}
        <View style={s.steps}>
          {[1,2,3].map(i => (
            <View key={i} style={s.stepItem}>
              <View style={[s.stepDot, step >= i && s.stepDotActive, step > i && s.stepDotDone]}>
                <Text style={s.stepDotText}>{step > i ? '✓' : i}</Text>
              </View>
              <Text style={[s.stepLabel, step >= i && s.stepLabelActive]}>
                {i === 1 ? 'Call owner' : i === 2 ? 'Take photo' : 'Send report'}
              </Text>
            </View>
          ))}
        </View>

        {/* STEP 1 — Call owner */}
        {step === 1 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Step 1 — Contact the owner</Text>
            <Text style={s.stepSub}>Call them directly — the fastest way to reunite {name} with their family.</Text>

            <TouchableOpacity style={s.callBtn} onPress={() => { Linking.openURL(`tel:${phone}`); setTimeout(() => setStep(2), 2000); }}>
              <Text style={s.callBtnIcon}>📞</Text>
              <View>
                <Text style={s.callBtnTitle}>Call {owner}</Text>
                <Text style={s.callBtnNumber}>{phone}</Text>
              </View>
              <Text style={s.callBtnArrow}>→</Text>
            </TouchableOpacity>

            <View style={s.whatsappRow}>
              <TouchableOpacity style={s.whatsappBtn} onPress={() => { Linking.openURL(`https://wa.me/${phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Encontré a ${name}. ¿Puedes contactarme?`)}`); setTimeout(() => setStep(2), 1000); }}>
                <View style={s.whatsappLogo}><Text style={s.whatsappLogoText}>W</Text></View>
                <Text style={s.whatsappBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.inAppMsgBtn} onPress={() => { router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: name, otherOwner: phone } }); }}>
                <Text style={s.inAppMsgIcon}>💬</Text>
                <Text style={s.inAppMsgText}>In-app message</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.skipBtn} onPress={() => setStep(2)}>
              <Text style={s.skipBtnText}>No answer — continue →</Text>
            </TouchableOpacity>

            <View style={s.tipsCard}>
              <Text style={s.tipsTitle}>💡 While you wait</Text>
              <Text style={s.tipText}>• Keep {name} calm and in a safe place</Text>
              <Text style={s.tipText}>• Don't feed them — they may have dietary restrictions</Text>
              <Text style={s.tipText}>• Stay in the area if you can</Text>
            </View>
          </View>
        )}

        {/* STEP 2 — Take photo */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Step 2 — Photo verification</Text>
            <Text style={s.stepSub}>A photo helps the owner confirm it's their pet and gives them peace of mind.</Text>

            <TouchableOpacity style={s.photoPickerBtn} onPress={pickPhoto}>
              {photo ? (
                <Image source={{ uri: photo }} style={s.pickedPhoto} resizeMode="cover" />
              ) : (
                <View style={s.photoPickerPlaceholder}>
                  <Text style={{ fontSize: 40 }}>📷</Text>
                  <Text style={s.photoPickerText}>Take or choose a photo</Text>
                  <Text style={s.photoPickerSub}>Show the pet clearly — include surroundings if possible</Text>
                </View>
              )}
            </TouchableOpacity>

            {photo && (
              <TouchableOpacity style={s.retakeBtn} onPress={pickPhoto}>
                <Text style={s.retakeBtnText}>Retake photo</Text>
              </TouchableOpacity>
            )}

            <View style={s.stepNavRow}>
              <TouchableOpacity style={s.prevBtn} onPress={() => setStep(1)}>
                <Text style={s.prevBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.nextBtn, !photo && s.nextBtnDim]} onPress={() => setStep(3)}>
                <Text style={s.nextBtnText}>{photo ? 'Next →' : 'Skip for now →'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3 — Send report */}
        {step === 3 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Step 3 — Send your report</Text>
            <Text style={s.stepSub}>Your details help the owner find you quickly.</Text>

            <Text style={s.fieldLabel}>Your name *</Text>
            <TextInput style={s.input} placeholder="First and last name" placeholderTextColor={colors.textMuted} value={finderName} onChangeText={setFinderName} />

            <Text style={s.fieldLabel}>Your current location</Text>
            <TextInput style={s.input} placeholder="e.g. Parque España, near the fountain" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} />

            <Text style={s.fieldLabel}>Any other details</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} placeholder={`e.g. ${name} seems calm and friendly, wearing a red collar`} placeholderTextColor={colors.textMuted} value={message} onChangeText={setMessage} multiline />

            <View style={s.stepNavRow}>
              <TouchableOpacity style={s.prevBtn} onPress={() => setStep(2)}>
                <Text style={s.prevBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, (!finderName.trim() || submitting) && s.submitBtnDim]}
                onPress={submit}
                disabled={!finderName.trim() || submitting}
              >
                <Text style={s.submitBtnText}>{submitting ? 'Sending...' : '✓ Send report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: colors.textPrimary, fontSize: 24, fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { padding: 20, paddingBottom: 40 },
  dogCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.bgCard, borderRadius: 16, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 16, marginBottom: 20 },
  dogCardAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.amber },
  dogCardName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  dogCardOwner: { fontSize: 12, color: colors.textMuted },
  steps: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 0 },
  stepItem: { flex: 1, alignItems: 'center', gap: 6 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.bgBorder, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { borderColor: colors.amber, backgroundColor: colors.amberDim },
  stepDotDone: { borderColor: colors.safe, backgroundColor: colors.safeDim },
  stepDotText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  stepLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  stepLabelActive: { color: colors.amber },
  stepContent: { gap: 12 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.3 },
  stepSub: { fontSize: 13, color: colors.textMuted, lineHeight: 20, marginBottom: 4 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.safeDim, borderRadius: 16, borderWidth: 1.5, borderColor: colors.safe, padding: 18, ...shadows.amber },
  callBtnIcon: { fontSize: 28 },
  callBtnTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  callBtnNumber: { fontSize: 14, color: colors.safe },
  callBtnArrow: { color: colors.safe, fontSize: 20, marginLeft: 'auto' },
  whatsappRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  whatsappBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#052016', borderRadius: 12, borderWidth: 0.5, borderColor: '#10B981', paddingVertical: 12 },
  whatsappLogo: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  whatsappLogoText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  whatsappBtnText: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  inAppMsgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F0F2E', borderRadius: 12, borderWidth: 0.5, borderColor: '#6366F1', paddingVertical: 12 },
  inAppMsgIcon: { fontSize: 16 },
  inAppMsgText: { color: '#6366F1', fontSize: 13, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipBtnText: { color: colors.textMuted, fontSize: 13 },
  tipsCard: { backgroundColor: colors.bgCard, borderRadius: 14, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 16, gap: 6 },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: colors.amber, marginBottom: 4 },
  tipText: { fontSize: 12, color: colors.textSecondary, lineHeight: 20 },
  photoPickerBtn: { borderRadius: 16, overflow: 'hidden', height: 200, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.bgBorder },
  pickedPhoto: { width: '100%', height: '100%' },
  photoPickerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoPickerText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  photoPickerSub: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 20 },
  retakeBtn: { alignItems: 'center', paddingVertical: 8 },
  retakeBtnText: { color: colors.textMuted, fontSize: 13 },
  fieldLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder, borderRadius: 12, padding: 14, fontSize: 14, color: colors.textPrimary, marginBottom: 4 },
  stepNavRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  prevBtn: { flex: 1, paddingVertical: 13, alignItems: 'center', borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder },
  prevBtnText: { color: colors.textMuted, fontSize: 14 },
  nextBtn: { flex: 2, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: colors.amberDim, borderWidth: 1, borderColor: colors.amber },
  nextBtnDim: { opacity: 0.6 },
  nextBtnText: { color: colors.amber, fontWeight: '700', fontSize: 14 },
  submitBtn: { flex: 2, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: colors.safe },
  submitBtnDim: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, marginBottom: 8 },
  successSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successSteps: { alignSelf: 'stretch', backgroundColor: colors.safeDim, borderRadius: 14, padding: 16, marginBottom: 24, gap: 8, borderWidth: 0.5, borderColor: colors.safe },
  successStep: { fontSize: 13, color: '#10B981' },
  chatNowBtn: { backgroundColor: colors.safe, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
  chatNowBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
