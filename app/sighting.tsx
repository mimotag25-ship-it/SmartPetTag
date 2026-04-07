import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams } from 'expo-router';

export default function PublicSighting() {
  const { alertId } = useLocalSearchParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('lost_alerts')
        .select('*')
        .eq('id', alertId)
        .single();
      if (data) setAlert(data);
      setLoading(false);
    }
    load();
  }, []);

  async function submitSighting() {
    if (!location.trim()) return;
    setSubmitting(true);
    await supabase.from('activity').insert({
      type: 'sighting',
      icon: '👀',
      message: `${alert?.dog_name} spotted near ${location} — reported by ${name || 'Anonymous'}`,
      neighbourhood: location,
      urgent: true,
    });
    await supabase.from('lost_alerts').update({
      found_message: `Sighting: ${location}. ${message}. Contact: ${name} ${phone}`,
    }).eq('id', alertId);
    setSubmitting(false);
    setSubmitted(true);
  }

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#C0392B" style={{ marginTop: 100 }} />
    </View>
  );

  if (!alert) return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>This dog has been found!</Text>
        <Text style={styles.sub}>Thank you for helping. This alert is no longer active.</Text>
      </View>
    </View>
  );

  if (alert.status === 'found') return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{alert.dog_name} has been found!</Text>
        <Text style={styles.sub}>Thank you to everyone who helped. {alert.dog_name} is safe and home.</Text>
      </View>
    </View>
  );

  if (submitted) return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>🙏</Text>
        <Text style={styles.title}>Thank you!</Text>
        <Text style={styles.sub}>Your sighting has been sent to {alert.owner_name}. They have been notified immediately.</Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Need to contact the owner directly?</Text>
          <Text style={styles.contactPhone}>📞 {alert.owner_phone}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>🚨 LOST DOG — PLEASE HELP</Text>
        </View>
        <View style={styles.dogCard}>
          <View style={styles.dogAvatar}>
            <Text style={styles.dogEmoji}>🐕</Text>
          </View>
          <View>
            <Text style={styles.dogName}>{alert.dog_name}</Text>
            <Text style={styles.dogBreed}>Last seen: {alert.neighbourhood}</Text>
            <Text style={styles.dogOwner}>Owner: {alert.owner_name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => {}}
        >
          <Text style={styles.callBtnText}>📞 Call owner — {alert.owner_phone}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Did you see this dog?</Text>
        <Text style={styles.formSub}>Fill in what you know — even a small detail helps the owner find them faster.</Text>

        <Text style={styles.fieldLabel}>📍 Where did you see them? *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Orizaba & Sonora, Roma Norte"
          placeholderTextColor="#555"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.fieldLabel}>💬 Any details?</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          placeholder="e.g. The dog was calm, heading north, near the Oxxo"
          placeholderTextColor="#555"
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Text style={styles.fieldLabel}>👤 Your name (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="So the owner knows who to thank"
          placeholderTextColor="#555"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>📞 Your phone (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="In case the owner needs to reach you"
          placeholderTextColor="#555"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.submitBtn, !location.trim() && styles.submitBtnDisabled]}
          onPress={submitSighting}
          disabled={!location.trim() || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>📍 Send sighting to owner</Text>
          }
        </TouchableOpacity>

        <Text style={styles.poweredBy}>Powered by SmartPet Tag — helping reunite dogs with their families in Mexico City</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji: { fontSize: 64, marginBottom: 16, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },
  header: { backgroundColor: '#1a0505', borderBottomWidth: 1, borderBottomColor: '#C0392B', padding: 20 },
  urgentBadge: { backgroundColor: '#C0392B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  urgentText: { color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dogCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  dogAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#2a0a0a', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C0392B' },
  dogEmoji: { fontSize: 32 },
  dogName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  dogBreed: { fontSize: 13, color: '#888', marginBottom: 2 },
  dogOwner: { fontSize: 13, color: '#666' },
  callBtn: { backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  form: { padding: 20 },
  formTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  formSub: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 20 },
  fieldLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#222', borderRadius: 12, padding: 14, fontSize: 14, color: '#fff', marginBottom: 16 },
  submitBtn: { backgroundColor: '#C0392B', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitBtnDisabled: { opacity: 0.3 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  poweredBy: { fontSize: 11, color: '#333', textAlign: 'center', lineHeight: 18 },
  contactBox: { backgroundColor: '#0d0d0d', borderRadius: 14, padding: 16, marginTop: 24, alignItems: 'center', width: '100%' },
  contactTitle: { fontSize: 13, color: '#555', marginBottom: 8 },
  contactPhone: { fontSize: 16, color: '#00D4AA', fontWeight: '700' },
});
