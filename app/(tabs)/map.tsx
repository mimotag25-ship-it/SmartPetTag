import { useEffect, useState } from 'react';
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

  const alertMarkersJS = alerts.map((a, i) => `
    var alertMarker${i} = new google.maps.Marker({
      position: { lat: 19.4148, lng: -99.1728 },
      map: map,
      title: '🚨 ${a.dog_name} is lost!',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#C0392B',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      }
    });
    var alertInfo${i} = new google.maps.InfoWindow({
      content: '<div style="font-family:sans-serif;padding:4px"><b>🚨 ${a.dog_name} is lost!</b><br>Owner: ${a.owner_name}<br>Phone: ${a.owner_phone}<br>Area: ${a.neighbourhood}</div>'
    });
    alertMarker${i}.addListener('click', function() { alertInfo${i}.open(map, alertMarker${i}); });

    new google.maps.Circle({
      map: map,
      center: { lat: 19.4148, lng: -99.1728 },
      radius: ${radius * 1000},
      fillColor: '#C0392B',
      fillOpacity: 0.08,
      strokeColor: '#C0392B',
      strokeOpacity: 0.4,
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
      content: '<div style="font-family:sans-serif;padding:4px"><b>${m.emoji} ${m.title}</b><br>${m.desc}</div>'
    });
    marker${i}.addListener('click', function() { info${i}.open(map, marker${i}); });
  `).join('');

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        function initMap() {
          var map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 19.4136, lng: -99.1716 },
            zoom: 15,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
              { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
              { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
              { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
            ],
          });

          var youMarker = new google.maps.Marker({
            position: { lat: 19.4136, lng: -99.1716 },
            map: map,
            title: 'You are here',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#E8640A',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            }
          });

          ${markersJS}
          ${alertMarkersJS}
        }
      </script>
      <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>

      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <Text style={styles.alertStripText}>🚨 {alerts.length} lost dog alert active — tap red pin for details</Text>
        </View>
      )}

      {/* Radius selector */}
      {alerts.length > 0 && (
        <View style={styles.radiusBar}>
          <Text style={styles.radiusLabel}>Alert radius:</Text>
          {[1, 5, 10].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r} km</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Google Map */}
      <View style={styles.mapContainer}>
        <iframe
          srcDoc={mapHTML}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="SmartPet Tag Map"
        />
      </View>

      {/* Legend */}
      <ScrollView horizontal style={styles.legend} showsHorizontalScrollIndicator={false}>
        {[
          { color: '#E8640A', label: '📍 You' },
          { color: '#1D9E75', label: '🐶 Nearby dogs' },
          { color: '#3B6D11', label: '🌳 Dog parks' },
          { color: '#185FA5', label: '🏥 Vets' },
          { color: '#D4537E', label: '✂️ Groomers' },
          { color: '#C0392B', label: '🚨 Lost dogs' },
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
  container: { flex: 1, backgroundColor: '#000' },
  alertStrip: { backgroundColor: '#FCEBEB', padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#F7C1C1' },
  alertStripText: { fontSize: 13, fontWeight: '600', color: '#C0392B', textAlign: 'center' },
  radiusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#111', borderBottomWidth: 0.5, borderBottomColor: '#262626' },
  radiusLabel: { fontSize: 12, color: '#aaa', marginRight: 4 },
  radiusBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 0.5, borderColor: '#444', backgroundColor: '#222' },
  radiusBtnActive: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  radiusBtnText: { fontSize: 12, color: '#aaa', fontWeight: '500' },
  radiusBtnTextActive: { color: '#fff' },
  mapContainer: { flex: 1 },
  legend: { maxHeight: 44, backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: '#262626' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#aaa' },
});