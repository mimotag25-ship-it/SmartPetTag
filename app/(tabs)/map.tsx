import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';

const GOOGLE_MAPS_KEY = 'AIzaSyCVaatIaoT3Kc-81cwUiaxGgrBT1S7lyMU';

const MARKERS = [
  { lat: 19.4155, lng: -99.1738, title: 'Luna', desc: 'Poodle · Roma Norte', color: '#1D9E75', emoji: '🐶' },
  { lat: 19.4118, lng: -99.1695, title: 'Rocky', desc: 'French Bulldog · Condesa', color: '#1D9E75', emoji: '🐶' },
  { lat: 19.4142, lng: -99.1752, title: 'Coco', desc: 'Schnauzer · Roma', color: '#1D9E75', emoji: '🐶' },
  { lat: 19.4162, lng: -99.1721, title: 'Parque España', desc: 'Dog park', color: '#3B6D11', emoji: '🌳' },
  { lat: 19.4098, lng: -99.1744, title: 'Parque México', desc: 'Dog park', color: '#3B6D11', emoji: '🌳' },
  { lat: 19.4129, lng: -99.1708, title: 'Clínica Pet Condesa', desc: 'Vet · Open now', color: '#185FA5', emoji: '🏥' },
  { lat: 19.4145, lng: -99.1730, title: 'Doggy Chic Grooming', desc: 'Groomer · Open now', color: '#D4537E', emoji: '✂️' },
];

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [radius, setRadius] = useState(1);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadAlerts() {
      const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost');
      if (data) setAlerts(data);
    }
    loadAlerts();
  }, []);

  const mapHTML = useMemo(() => {
    const alertMarkersJS = alerts.map((a, i) => `
      var alertMarker${i} = new google.maps.Marker({
        position: { lat: 19.4148, lng: -99.1728 },
        map: map,
        title: '${a.dog_name} is lost!',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#C0392B',
          fillOpacity: 1,
          strokeColor: '#ff6b6b',
          strokeWeight: 3,
        }
      });
      var alertInfo${i} = new google.maps.InfoWindow({
        content: '<div style="font-family:sans-serif;padding:8px"><b style="color:#ff6b6b">Lost: ${a.dog_name}</b><br><span style="color:#888">Owner: ${a.owner_name}</span><br><span style="color:#888">${a.owner_phone}</span></div>'
      });
      alertMarker${i}.addListener('click', function() { alertInfo${i}.open(map, alertMarker${i}); });
      new google.maps.Circle({
        map: map,
        center: { lat: 19.4148, lng: -99.1728 },
        radius: ${radius * 1000},
        fillColor: '#C0392B',
        fillOpacity: 0.06,
        strokeColor: '#C0392B',
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });
    `).join('');

    const markersJS = MARKERS.map((m, i) => `
      var marker${i} = new google.maps.Marker({
        position: { lat: ${m.lat}, lng: ${m.lng} },
        map: map,
        title: '${m.title}',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '${m.color}',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }
      });
      var info${i} = new google.maps.InfoWindow({
        content: '<div style="font-family:sans-serif;padding:8px"><b>${m.emoji} ${m.title}</b><br><span style="color:#888">${m.desc}</span></div>'
      });
      marker${i}.addListener('click', function() { info${i}.open(map, marker${i}); });
    `).join('');

    return `
      <!DOCTYPE html><html>
      <head><meta name="viewport" content="width=device-width, initial-scale=1">
      <style>* { margin:0;padding:0;box-sizing:border-box; } html,body,#map { width:100%;height:100%; }</style>
      </head>
      <body><div id="map"></div>
      <script>
        function initMap() {
          var map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 19.4136, lng: -99.1716 },
            zoom: 15,
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#0a0a0f' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a0f' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#444' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d0d1a' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#16213e' }] },
              { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#333' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050510' }] },
              { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0a1a0a' }] },
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            ],
          });

          var youMarker = new google.maps.Marker({
            position: { lat: 19.4136, lng: -99.1716 },
            map: map,
            title: 'You are here',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: '#E8640A',
              fillOpacity: 1,
              strokeColor: '#ff9966',
              strokeWeight: 3,
            }
          });

          new google.maps.Circle({
            map: map,
            center: { lat: 19.4136, lng: -99.1716 },
            radius: 150,
            fillColor: '#E8640A',
            fillOpacity: 0.08,
            strokeColor: '#E8640A',
            strokeOpacity: 0.2,
            strokeWeight: 1,
          });

          ${markersJS}
          ${alertMarkersJS}
        }
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
      </body></html>
    `;
  }, [radius, alerts]);

  const FILTERS = ['all', 'dogs', 'parks', 'vets', 'lost'];

  return (
    <View style={styles.container}>

      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <Text style={styles.screenTitle}>Dog World Map</Text>
      </View>

      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <View style={styles.alertDot} />
          <Text style={styles.alertStripText}>🚨 {alerts.length} lost dog alert active nearby</Text>
          <View style={styles.radiusBtns}>
            {[1, 5, 10].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r}km</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? '🗺️ All' : f === 'dogs' ? '🐶 Dogs' : f === 'parks' ? '🌳 Parks' : f === 'vets' ? '🏥 Vets' : '🚨 Lost'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <iframe
          srcDoc={mapHTML}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="SmartPet Tag Map"
        />
      </View>

      <View style={styles.legendBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
          {[
            { color: '#E8640A', label: 'You' },
            { color: '#1D9E75', label: 'Dogs' },
            { color: '#3B6D11', label: 'Parks' },
            { color: '#185FA5', label: 'Vets' },
            { color: '#D4537E', label: 'Groomers' },
            { color: '#C0392B', label: 'Lost' },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic' },
  screenTitle: { fontSize: 13, color: '#444', fontWeight: '500' },
  alertStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1a0505', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#C0392B', paddingHorizontal: 16, paddingVertical: 10 },
  alertDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C0392B' },
  alertStripText: { fontSize: 12, color: '#C0392B', flex: 1, fontWeight: '500' },
  radiusBtns: { flexDirection: 'row', gap: 6 },
  radiusBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 0.5, borderColor: '#333', backgroundColor: '#111' },
  radiusBtnActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  radiusBtnText: { fontSize: 11, color: '#555', fontWeight: '500' },
  radiusBtnTextActive: { color: '#fff' },
  filterBar: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: '#1a1a1a', backgroundColor: '#0d0d0d' },
  filterPillActive: { backgroundColor: '#120800', borderColor: '#E8640A' },
  filterText: { fontSize: 12, color: '#444', fontWeight: '500' },
  filterTextActive: { color: '#E8640A' },
  mapContainer: { flex: 1 },
  legendBar: { paddingVertical: 10, backgroundColor: '#0d0d0d', borderTopWidth: 0.5, borderTopColor: '#111' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#444' },
});