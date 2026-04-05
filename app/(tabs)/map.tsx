import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

const LOCATIONS = [
  { name: 'Luna', type: 'dog', desc: 'Poodle · Roma Norte', color: '#1D9E75', top: '25%', left: '30%' },
  { name: 'Rocky', type: 'dog', desc: 'French Bulldog · Condesa', color: '#1D9E75', top: '60%', left: '65%' },
  { name: 'Coco', type: 'dog', desc: 'Schnauzer · Roma', color: '#1D9E75', top: '45%', left: '20%' },
  { name: 'Parque España', type: 'park', desc: 'Dog park', color: '#3B6D11', top: '30%', left: '55%' },
  { name: 'Parque México', type: 'park', desc: 'Dog park', color: '#3B6D11', top: '70%', left: '40%' },
  { name: 'Clínica Pet', type: 'vet', desc: 'Vet · Open now', color: '#185FA5', top: '50%', left: '75%' },
];

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function loadAlerts() {
      const { data } = await supabase
        .from('lost_alerts')
        .select('*')
        .eq('status', 'lost');
      if (data) setAlerts(data);
    }
    loadAlerts();
  }, []);

  return (
    <View style={styles.container}>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <Text style={styles.alertStripText}>🚨 {alerts.length} lost dog alert active nearby</Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.map}>

        {/* Grid lines */}
        <View style={[styles.road, { top: '45%', left: 0, right: 0, height: 8 }]} />
        <View style={[styles.road, { top: '70%', left: 0, right: 0, height: 8 }]} />
        <View style={[styles.road, { left: '35%', top: 0, bottom: 0, width: 8 }]} />
        <View style={[styles.road, { left: '65%', top: 0, bottom: 0, width: 8 }]} />

        {/* You */}
        <View style={[styles.pin, { top: '50%', left: '50%' }]}>
          <View style={[styles.pinDot, { backgroundColor: '#E8640A' }]} />
          <Text style={styles.pinLabel}>You</Text>
        </View>

        {/* Locations */}
        {LOCATIONS.map((loc, i) => (
          <View key={i} style={[styles.pin, { top: loc.top, left: loc.left }]}>
            <Text
              style={styles.pinIcon}
              onPress={() => setSelected(selected?.name === loc.name ? null : loc)}
            >
              {loc.type === 'dog' ? '🐶' : loc.type === 'park' ? '🌳' : '🏥'}
            </Text>
            <Text style={styles.pinLabel}>{loc.name}</Text>
            {selected?.name === loc.name && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipTitle}>{loc.name}</Text>
                <Text style={styles.tooltipDesc}>{loc.desc}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Lost dog alerts */}
        {alerts.map((alert, i) => (
          <View key={i} style={[styles.pin, { top: '35%', left: '45%' }]}>
            <Text style={styles.pinIcon} onPress={() => setSelected(selected?.name === alert.dog_name ? null : { name: alert.dog_name, desc: `Owner: ${alert.owner_name} · ${alert.owner_phone}` })}>🚨</Text>
            <Text style={[styles.pinLabel, { color: '#C0392B' }]}>{alert.dog_name}</Text>
            {selected?.name === alert.dog_name && (
              <View style={[styles.tooltip, { borderColor: '#C0392B' }]}>
                <Text style={[styles.tooltipTitle, { color: '#C0392B' }]}>🚨 {alert.dog_name} is lost!</Text>
                <Text style={styles.tooltipDesc}>Owner: {alert.owner_name}</Text>
                <Text style={styles.tooltipDesc}>{alert.owner_phone}</Text>
              </View>
            )}
          </View>
        ))}

      </View>

      {/* Legend */}
      <ScrollView horizontal style={styles.legend} showsHorizontalScrollIndicator={false}>
        {[
          { color: '#E8640A', label: 'You' },
          { color: '#1D9E75', label: 'Nearby dogs' },
          { color: '#3B6D11', label: 'Dog parks' },
          { color: '#185FA5', label: 'Vets' },
          { color: '#C0392B', label: 'Lost dogs' },
        ].map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  alertStrip: { backgroundColor: '#FCEBEB', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#F7C1C1' },
  alertStripText: { fontSize: 13, fontWeight: '600', color: '#C0392B', textAlign: 'center' },
  map: { flex: 1, backgroundColor: '#d4e8d4', position: 'relative', margin: 12, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: '#b0d0b0' },
  road: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.6)' },
  pin: { position: 'absolute', alignItems: 'center', transform: [{ translateX: -20 }, { translateY: -20 }] },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  pinIcon: { fontSize: 22 },
  pinLabel: { fontSize: 10, fontWeight: '500', color: '#333', backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
  tooltip: { position: 'absolute', top: 40, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 0.5, borderColor: '#ddd', width: 140, zIndex: 10 },
  tooltipTitle: { fontSize: 12, fontWeight: '600', color: '#222', marginBottom: 2 },
  tooltipDesc: { fontSize: 11, color: '#666' },
  legend: { maxHeight: 44, paddingHorizontal: 12, paddingVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#444' },
});