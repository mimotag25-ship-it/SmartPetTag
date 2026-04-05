import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Index() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLost, setIsLost] = useState(false);
  const [alerting, setAlerting] = useState(false);

  useEffect(() => {
    async function loadDog() {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .single();
      if (error) console.log('Error:', error.message);
      else setDog(data);
      setLoading(false);
    }
    loadDog();
  }, []);

  async function toggleLostAlert() {
    if (!dog) return;
    setAlerting(true);
    if (!isLost) {
      const { error } = await supabase
        .from('lost_alerts')
        .insert({
          dog_id: dog.id,
          dog_name: dog.name,
          owner_name: dog.owner_name,
          owner_phone: dog.owner_phone,
          neighbourhood: dog.neighbourhood,
          status: 'lost',
        });
      if (error) console.log('Alert error:', error.message);
      else setIsLost(true);
    } else {
      const { error } = await supabase
        .from('lost_alerts')
        .update({ status: 'found' })
        .eq('dog_name', dog.name)
        .eq('status', 'lost');
      if (error) console.log('Cancel error:', error.message);
      else setIsLost(false);
    }
    setAlerting(false);
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#E8640A" />
    </View>
  );

  if (!dog) return (
    <View style={styles.center}>
      <Text>No dog found.</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🐕</Text>
        </View>
        <Text style={styles.name}>{dog.name}</Text>
        <Text style={styles.breed}>{dog.breed} · {dog.age} yrs</Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>🐾 {dog.personality}</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Owner</Text>
          <Text style={styles.infoValue}>{dog.owner_name}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{dog.owner_phone}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Neighbourhood</Text>
          <Text style={styles.infoValue}>{dog.neighbourhood}</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isLost && styles.buttonFound]}
          onPress={toggleLostAlert}
          disabled={alerting}
        >
          {alerting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>
                {isLost ? '✅ Cancel Lost Alert' : '🚨 My Dog Is Lost!'}
              </Text>
          }
        </TouchableOpacity>

        {isLost && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertTitle}>🚨 Alert Active</Text>
            <Text style={styles.alertSub}>Nearby users have been notified that {dog.name} is missing.</Text>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 40, borderWidth: 0.5, borderColor: '#e0e0e0' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FDF0E6', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#F5B87A' },
  avatarEmoji: { fontSize: 44 },
  name: { fontSize: 24, fontWeight: '600', marginBottom: 4 },
  breed: { fontSize: 14, color: '#888', marginBottom: 16 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#FDF0E6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, color: '#854F0B', fontWeight: '500' },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 13, color: '#888' },
  infoValue: { fontSize: 13, color: '#222', fontWeight: '500' },
  button: { backgroundColor: '#C0392B', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginTop: 24, width: '100%', alignItems: 'center' },
  buttonFound: { backgroundColor: '#0F6E56' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  alertBanner: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 14, marginTop: 16, width: '100%', borderWidth: 0.5, borderColor: '#F7C1C1' },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#C0392B', marginBottom: 4 },
  alertSub: { fontSize: 13, color: '#A32D2D', lineHeight: 18 },
});