import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage, t } from '../lib/i18n';

export default function ConfirmFound() {
  const { alertId } = useLocalSearchParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [howFound, setHowFound] = useState([]);

  const HOW_OPTIONS = [
    { key: 'called', label: 'The finder called me', icon: '📞' },
    { key: 'messaged', label: 'The finder messaged me', icon: '💬' },
    { key: 'location', label: 'The finder sent their location', icon: '📍' },
    { key: 'photo', label: 'The finder sent a photo', icon: '📷' },
    { key: 'inperson', label: 'We met in person', icon: '🤝' },
  ];

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('lost_alerts').select('*').eq('id', alertId).single();
      if (data) setAlert(data);
      setLoading(false);
    }
    load();
  }, []);

  function toggleOption(key) {
    setHowFound(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  async function confirmFound() {
    if (howFound.length === 0) return;
    setConfirming(true);
    await supabase.from('lost_alerts').update({ status: 'found', status_pending_owner: false }).eq('id', alertId);
    await supabase.from('activity').insert({
      type: 'found', icon: '🎉',
      message: `${alert.dog_name} is home safe! Owner confirmed 🐾`,
      neighbourhood: alert.neighbourhood || 'Nearby', urgent: false,
    });
    setConfirming(false);
    setDone(true);
  }

  async function rejectReport() {
    await supabase.from('lost_alerts').update({
      status: 'lost', status_pending_owner: false,
      finder_name: null, found_photo: null,
      found_message: null, found_location: null, found_contacted: false,
    }).eq('id', alertId);
    await supabase.from('activity').insert({
      type: 'alert', icon: '🚨',
      message: `${alert?.dog_name} is still missing — false report dismissed`,
      neighbourhood: alert?.neighbourhood || 'Nearby', urgent: true,
    });
    router.replace('/(tabs)/explore');
  }

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1D9E75" style={{ marginTop: 100 }} />
    </View>
  );

  if (done) return (
    <View style={styles.container}>
      <View style={styles.doneSection}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>{alert?.dog_name} is home!</Text>
        <Text style={styles.doneSub}>{alert?.finder_name} has been credited as a Lost Dog Hero in the community feed.</Text>
        <View style={styles.statsBox}>
          <Text style={styles.statsTitle}>Case closed ✓</Text>
          <Text style={styles.statsLine}>🐕 Dog: {alert?.dog_name}</Text>
          <Text style={styles.statsLine}>🦸 Found by: {alert?.finder_name}</Text>
          <Text style={styles.statsLine}>✓ Confirmed by: You (owner)</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/explore')}>
          <Text style={styles.doneBtnText}>Back to profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🔔</Text>
          <Text style={styles.title}>Someone found {alert?.dog_name}!</Text>
          <Text style={styles.sub}>Review what the finder submitted and confirm how they contacted you. Only you can close this alert.</Text>
        </View>
        <View style={styles.finderCard}>
          <Text style={styles.finderTitle}>Finder's report</Text>
          <View style={styles.finderRow}>
            <Text style={styles.finderLabel}>👤 Finder</Text>
            <Text style={styles.finderValue}>{alert?.finder_name || 'Anonymous'}</Text>
          </View>
          {alert?.found_location && (
            <View style={styles.finderRow}>
              <Text style={styles.finderLabel}>📍 Location</Text>
              <Text style={styles.finderValue}>{alert.found_location}</Text>
            </View>
          )}
          {alert?.found_message && (
            <View style={styles.finderRow}>
              <Text style={styles.finderLabel}>💬 Message</Text>
              <Text style={styles.finderValue}>{alert.found_message}</Text>
            </View>
          )}
          {alert?.found_contacted && (
            <View style={styles.finderRow}>
              <Text style={styles.finderLabel}>📞 Contact</Text>
              <Text style={styles.finderValue}>Finder says they contacted you</Text>
            </View>
          )}
          {alert?.found_photo && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.finderLabel}>📷 Photo</Text>
              <Image source={{ uri: alert.found_photo }} style={styles.foundPhoto} resizeMode="cover" />
            </View>
          )}
          {!alert?.found_photo && !alert?.found_message && !alert?.found_location && !alert?.found_contacted && (
            <Text style={styles.noProofText}>No additional proof submitted</Text>
          )}
        </View>
        <Text style={styles.sectionTitle}>How did the finder contact you?</Text>
        <Text style={styles.sectionSub}>Select all that apply — this creates the official record</Text>
        {HOW_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.optionRow, howFound.includes(opt.key) && styles.optionRowActive]}
            onPress={() => toggleOption(opt.key)}
          >
            <Text style={styles.optionIcon}>{opt.icon}</Text>
            <Text style={[styles.optionLabel, howFound.includes(opt.key) && styles.optionLabelActive]}>{opt.label}</Text>
            {howFound.includes(opt.key) && <Text style={styles.optionCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
        {howFound.length === 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ Select at least one option to confirm the handoff</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, howFound.length === 0 && styles.confirmBtnDisabled]}
          onPress={confirmFound}
          disabled={howFound.length === 0 || confirming}
        >
          {confirming ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>✅ Confirm — {alert?.dog_name} is home safe</Text>}
        </TouchableOpacity>
        <View style={styles.divider} />
        <Text style={styles.rejectTitle}>This report is incorrect?</Text>
        <Text style={styles.rejectSub}>If this is a false report, dismiss it and the alert stays active.</Text>
        <TouchableOpacity
          style={styles.chatWithFinderBtn}
          onPress={() => router.push('/chat')}
        >
          <Text style={styles.chatWithFinderText}>💬 Chat with {alert?.finder_name || 'finder'} directly</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rejectBtn} onPress={rejectReport}>
          <Text style={styles.rejectBtnText}>🚨 Dismiss — my dog is still missing</Text>
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
  headerEmoji: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  finderCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: '#1D9E75', padding: 16, marginBottom: 20 },
  finderTitle: { fontSize: 11, color: '#1D9E75', fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  finderRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#141414' },
  finderLabel: { fontSize: 12, color: '#555', width: 90 },
  finderValue: { fontSize: 12, color: '#ccc', flex: 1 },
  foundPhoto: { width: '100%', height: 180, borderRadius: 10, marginTop: 8 },
  noProofText: { fontSize: 12, color: '#333', fontStyle: 'italic' },
  sectionTitle: { fontSize: 14, color: '#fff', fontWeight: '600', marginHorizontal: 16, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#444', marginHorizontal: 16, marginBottom: 14 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14, marginBottom: 8 },
  optionRowActive: { backgroundColor: '#051a10', borderColor: '#1D9E75' },
  optionIcon: { fontSize: 20 },
  optionLabel: { flex: 1, fontSize: 14, color: '#555' },
  optionLabelActive: { color: '#fff', fontWeight: '500' },
  optionCheck: { color: '#1D9E75', fontSize: 16, fontWeight: '700' },
  warningBox: { marginHorizontal: 16, backgroundColor: '#1a1200', borderRadius: 12, borderWidth: 0.5, borderColor: '#F5A623', padding: 12, marginBottom: 12 },
  warningText: { color: '#F5A623', fontSize: 12, textAlign: 'center' },
  confirmBtn: { marginHorizontal: 16, backgroundColor: '#1D9E75', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 24 },
  confirmBtnDisabled: { opacity: 0.3 },
  confirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  divider: { height: 0.5, backgroundColor: '#1a1a1a', marginHorizontal: 16, marginBottom: 20 },
  rejectTitle: { fontSize: 14, color: '#ccc', fontWeight: '600', marginHorizontal: 16, marginBottom: 4 },
  rejectSub: { fontSize: 12, color: '#444', marginHorizontal: 16, marginBottom: 12, lineHeight: 18 },
  chatWithFinderBtn: { marginHorizontal: 16, backgroundColor: '#003d30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#00D4AA', marginBottom: 10 },
  chatWithFinderText: { color: '#00D4AA', fontWeight: '600', fontSize: 14 },
  rejectBtn: { marginHorizontal: 16, backgroundColor: '#1a0505', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#C0392B' },
  rejectBtnText: { color: '#C0392B', fontSize: 14, fontWeight: '600' },
  doneSection: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 72, marginBottom: 16 },
  doneTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  doneSub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  statsBox: { alignSelf: 'stretch', backgroundColor: '#051a10', borderRadius: 14, borderWidth: 0.5, borderColor: '#1D9E75', padding: 16, marginBottom: 24 },
  statsTitle: { fontSize: 12, color: '#1D9E75', fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  statsLine: { fontSize: 13, color: '#ccc', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#0a2a1a' },
  doneBtn: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#333', borderRadius: 14, padding: 16, width: '100%', alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
