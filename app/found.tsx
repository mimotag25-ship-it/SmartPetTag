import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage, t } from '../lib/i18n';

export default function FoundDog() {
  const { alertId, dogName, ownerName, ownerPhone, neighbourhood } = useLocalSearchParams();
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [contacted, setContacted] = useState(false);
  const [finderName, setFinderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();
  const [createdConvId, setCreatedConvId] = useState(null);
  const [done, setDone] = useState(false);

  const isValid = (photo || contacted || (message.trim() && location.trim())) && finderName.trim();

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1,1], quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function submit() {
    if (!isValid) return;
    setSubmitting(true);

    let photoUrl = null;
    if (photo) {
      try {
        const response = await fetch(photo);
        const blob = await response.blob();
        const fileName = `found-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!error) { const { data } = supabase.storage.from('posts').getPublicUrl(fileName); photoUrl = data.publicUrl; }
      } catch (e) {}
    }

    await supabase.from('lost_alerts').update({
      status: 'pending_owner', status_pending_owner: true,
      found_photo: photoUrl, found_message: message,
      found_location: location, found_contacted: contacted,
      finder_name: finderName,
    }).eq('id', alertId);

    await supabase.from('activity').insert({
      type: 'pending', icon: '🔔',
      message: `${dogName} may have been found — owner confirmation pending`,
      neighbourhood: neighbourhood || 'Nearby', urgent: true,
    });

    const { data: conv } = await supabase
      .from('conversations')
      .insert({
        dog1_name: finderName,
        dog2_name: dogName,
        owner1_phone: '',
        owner2_phone: ownerPhone || '',
        last_message: `Hi! I found ${dogName} 🐾`,
        last_message_at: new Date().toISOString(),
        alert_id: alertId,
      })
      .select()
      .single();

    if (conv) {
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_dog: finderName,
        sender_name: finderName,
        text: `Hi! I found ${dogName} 🐾 I'm at ${location || 'nearby'}. ${message || ''}`.trim(),
      });
      setSubmitting(false);
      router.push({ pathname: '/message', params: { conversationId: conv.id, otherDog: dogName, otherOwner: ownerPhone } });
    } else {
      setSubmitting(false);
      setDone(true);
    }
  }

  if (done) return (
    <View style={styles.container}>
      <View style={styles.doneSection}>
        <Text style={styles.doneEmoji}>🔔</Text>
        <Text style={styles.doneTitle}>Report submitted!</Text>
        <Text style={styles.doneSub}>{ownerName} has been notified and will confirm once they connect with you.</Text>
        <View style={styles.pendingBox}>
          <Text style={styles.pendingIcon}>⏳</Text>
          <View><Text style={styles.pendingTitle}>Waiting for owner confirmation</Text><Text style={styles.pendingSub}>{ownerName} needs to confirm on their end</Text></View>
        </View>
        <View style={styles.heroUnlock}>
          <Text style={styles.heroIcon}>🦸</Text>
          <View><Text style={styles.heroTitle}>Badge pending: Lost Dog Hero</Text><Text style={styles.heroSub}>Unlocks when owner confirms 🐾</Text></View>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/explore')}>
          <Text style={styles.doneBtnText}>Back to feed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>🐕 FOUND DOG REPORT</Text></View>
          <Text style={styles.title}>I found {dogName}!</Text>
          <Text style={styles.sub}>Provide your details and at least one verification. The owner confirms before the alert closes.</Text>
        </View>
        <View style={styles.dogCard}>
          <View style={styles.dogAvatar}><Text style={styles.dogEmoji}>🐕</Text></View>
          <View><Text style={styles.dogName}>{dogName}</Text><Text style={styles.dogOwner}>Owner: {ownerName}</Text><Text style={styles.dogPhone}>📞 {ownerPhone}</Text></View>
        </View>
        <View style={styles.optionCard}>
          <Text style={styles.optionTitle}>👤 Your name</Text>
          <Text style={styles.optionDesc}>So the owner knows who found their dog</Text>
          <TextInput style={[styles.input, { marginTop: 10 }]} placeholder="Your name" placeholderTextColor="#333" value={finderName} onChangeText={setFinderName} />
        </View>
        <Text style={styles.sectionTitle}>Provide at least one verification</Text>
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionNum}>1</Text>
            <View style={{ flex: 1 }}><Text style={styles.optionTitle}>📷 Photo of {dogName} safe</Text><Text style={styles.optionDesc}>Best verification</Text></View>
            {photo && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <TouchableOpacity style={[styles.photoBtn, photo && styles.photoBtnDone]} onPress={pickPhoto}>
            {photo ? <Image source={{ uri: photo }} style={styles.photoPreview} resizeMode="cover" /> : <View style={styles.photoEmpty}><Text style={styles.photoEmptyIcon}>📷</Text><Text style={styles.photoEmptyText}>Tap to add a photo</Text></View>}
          </TouchableOpacity>
        </View>
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionNum}>2</Text>
            <View style={{ flex: 1 }}><Text style={styles.optionTitle}>📞 Contact the owner</Text><Text style={styles.optionDesc}>Call or message {ownerName}</Text></View>
            {contacted && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactBtn}><Text style={styles.contactBtnText}>📞 Call {ownerPhone}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, contacted && styles.confirmBtnDone]} onPress={() => setContacted(!contacted)}>
              <Text style={[styles.confirmBtnText, contacted && styles.confirmBtnTextDone]}>{contacted ? t('contacted') : t('markContacted')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionNum}>3</Text>
            <View style={{ flex: 1 }}><Text style={styles.optionTitle}>📍 Location + message</Text><Text style={styles.optionDesc}>Tell the owner where you are</Text></View>
            {location.trim() && message.trim() && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <TextInput style={styles.input} placeholder="Your location" placeholderTextColor="#333" value={location} onChangeText={setLocation} />
          <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top', marginTop: 8 }]} placeholder="Message for owner" placeholderTextColor="#333" value={message} onChangeText={setMessage} multiline />
        </View>
        {!finderName.trim() && <View style={styles.warningBox}><Text style={styles.warningText}>⚠️ Please enter your name</Text></View>}
        {finderName.trim() && !isValid && <View style={styles.warningBox}><Text style={styles.warningText}>⚠️ Please complete at least one verification</Text></View>}
        <View style={styles.ownerConfirmBox}>
          <Text style={styles.ownerConfirmIcon}>🔒</Text>
          <Text style={styles.ownerConfirmText}>Alert stays active until {ownerName} confirms. This protects against false reports.</Text>
        </View>
        <TouchableOpacity style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]} onPress={submit} disabled={!isValid || submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit report → open chat with owner</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  backBtn: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backBtnText: { color: '#555', fontSize: 14 },
  scroll: { flex: 1 },
  header: { alignItems: 'center', padding: 24, paddingTop: 8 },
  headerBadge: { backgroundColor: '#051a10', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14 },
  headerBadgeText: { color: '#1D9E75', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  dogCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 20 },
  dogAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#051a10', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#1D9E75' },
  dogEmoji: { fontSize: 24 },
  dogName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  dogOwner: { fontSize: 12, color: '#555' },
  dogPhone: { fontSize: 12, color: '#1D9E75', marginTop: 2 },
  sectionTitle: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginHorizontal: 16, marginBottom: 12 },
  optionCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 12 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  optionNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a1a1a', color: '#555', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  optionTitle: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  optionDesc: { fontSize: 12, color: '#555' },
  checkMark: { color: '#1D9E75', fontSize: 18, fontWeight: '700' },
  photoBtn: { width: '100%', aspectRatio: 2, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', borderWidth: 0.5, borderColor: '#1a1a1a' },
  photoBtnDone: { borderColor: '#1D9E75' },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoEmptyIcon: { fontSize: 32 },
  photoEmptyText: { color: '#333', fontSize: 12 },
  contactRow: { flexDirection: 'row', gap: 8 },
  contactBtn: { flex: 1, backgroundColor: '#111', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 0.5, borderColor: '#1a1a1a' },
  contactBtnText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  confirmBtn: { flex: 1, backgroundColor: '#111', borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 0.5, borderColor: '#1a1a1a' },
  confirmBtnDone: { backgroundColor: '#051a10', borderColor: '#1D9E75' },
  confirmBtnText: { color: '#555', fontSize: 13, fontWeight: '500' },
  confirmBtnTextDone: { color: '#1D9E75' },
  input: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 10, padding: 12, fontSize: 13, color: '#fff' },
  warningBox: { marginHorizontal: 16, backgroundColor: '#1a1200', borderRadius: 12, borderWidth: 0.5, borderColor: '#F5A623', padding: 12, marginBottom: 12 },
  warningText: { color: '#F5A623', fontSize: 12, textAlign: 'center' },
  ownerConfirmBox: { marginHorizontal: 16, backgroundColor: '#0d0d14', borderRadius: 12, borderWidth: 0.5, borderColor: '#333', padding: 14, marginBottom: 16, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ownerConfirmIcon: { fontSize: 16 },
  ownerConfirmText: { fontSize: 12, color: '#444', lineHeight: 18, flex: 1 },
  submitBtn: { marginHorizontal: 16, backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  doneSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1a1200', borderWidth: 0.5, borderColor: '#F5A623', borderRadius: 14, padding: 16, marginBottom: 16, width: '100%' },
  pendingIcon: { fontSize: 28 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  pendingSub: { fontSize: 12, color: '#F5A623' },
  heroUnlock: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#051a10', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 14, padding: 16, marginBottom: 24, width: '100%' },
  heroIcon: { fontSize: 32 },
  heroTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  heroSub: { fontSize: 12, color: '#1D9E75' },
  doneBtn: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#333', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
