import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

const GOOGLE_MAPS_KEY = 'AIzaSyCVaatIaoT3Kc-81cwUiaxGgrBT1S7lyMU';

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [radius, setRadius] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedDog, setSelectedDog] = useState(null);
  const [myVisibility, setMyVisibility] = useState('public');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    loadAlerts();
    loadDogs();
    const interval = setInterval(loadDogs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost').order('created_at', { ascending: false });
    if (data) setAlerts(data);
  }

  async function loadDogs() {
    const { data } = await supabase.from('dog_locations').select('*').neq('visibility', 'private');
    if (data) setDogs(data);
  }

  function openDogProfile(dog) {
    setSelectedDog(dog);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  }

  function closeDogProfile() {
    Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start(() => setSelectedDog(null));
  }

  function togglePrivacy() {
    setShowPrivacy(!showPrivacy);
  }

  const mapHTML = useMemo(() => {
    const dogMarkersJS = dogs.map((d, i) => `
      var dogPos${i} = { lat: ${d.lat}, lng: ${d.lng} };
      var dogMarker${i} = new google.maps.Marker({
        position: dogPos${i},
        map: map,
        title: '${d.dog_name}',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: ${d.is_moving ? 10 : 8},
          fillColor: '${d.visibility === 'community' ? '#F5A623' : '#00D4AA'}',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }
      });

      ${d.is_moving ? `
      var angle${i} = Math.random() * Math.PI * 2;
      var speed${i} = 0.00003 + Math.random() * 0.00002;
      setInterval(function() {
        angle${i} += (Math.random() - 0.5) * 0.3;
        var newLat = dogPos${i}.lat + Math.sin(angle${i}) * speed${i};
        var newLng = dogPos${i}.lng + Math.cos(angle${i}) * speed${i};
        dogPos${i} = { lat: newLat, lng: newLng };
        dogMarker${i}.setPosition(dogPos${i});
      }, 1500);
      ` : ''}

      dogMarker${i}.addListener('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'dogSelected',
          dog: {
            id: '${d.id}',
            dog_name: '${d.dog_name}',
            owner_name: '${d.owner_name}',
            breed: '${d.breed}',
            personality: '${d.personality}',
            visibility: '${d.visibility}',
            is_moving: ${d.is_moving},
            emoji: '${d.emoji}'
          }
        }));
      });

      var pulseCircle${i} = new google.maps.Circle({
        map: map,
        center: dogPos${i},
        radius: ${d.is_moving ? 30 : 15},
        fillColor: '${d.visibility === 'community' ? '#F5A623' : '#00D4AA'}',
        fillOpacity: 0.15,
        strokeColor: '${d.visibility === 'community' ? '#F5A623' : '#00D4AA'}',
        strokeOpacity: 0.3,
        strokeWeight: 1,
      });
    `).join('');

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
      alertMarker${i}.addListener('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'alertSelected',
          alert: { dog_name: '${a.dog_name}', owner_name: '${a.owner_name}', owner_phone: '${a.owner_phone}', neighbourhood: '${a.neighbourhood}' }
        }));
      });
      new google.maps.Circle({
        map: map, center: { lat: 19.4148, lng: -99.1728 },
        radius: ${radius * 1000},
        fillColor: '#C0392B', fillOpacity: 0.06,
        strokeColor: '#C0392B', strokeOpacity: 0.3, strokeWeight: 1,
      });
    `).join('');

    return `<!DOCTYPE html><html>
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
          title: 'You + Athena',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#C0392B',
            fillOpacity: 1,
            strokeColor: '#ff9966',
            strokeWeight: 3,
          }
        });

        new google.maps.Circle({
          map: map, center: { lat: 19.4136, lng: -99.1716 },
          radius: 150, fillColor: '#C0392B', fillOpacity: 0.08,
          strokeColor: '#C0392B', strokeOpacity: 0.2, strokeWeight: 1,
        });

        ${dogMarkersJS}
        ${alertMarkersJS}
      }
    </script>
    <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
    </body></html>`;
  }, [dogs, alerts, radius]);

  const VISIBILITY_OPTIONS = [
    { key: 'public', label: 'Public', icon: '🟢', desc: 'Everyone can see your dog on the map' },
    { key: 'community', label: 'Community only', icon: '🟡', desc: 'Only verified SmartPet Tag users can see' },
    { key: 'private', label: 'Private', icon: '🔴', desc: 'Only you can see your dog\'s location' },
  ];

  const FILTERS = ['all', 'dogs', 'lost', 'parks'];

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.privacyBtn} onPress={togglePrivacy}>
            <Text style={styles.privacyBtnIcon}>
              {myVisibility === 'public' ? '🟢' : myVisibility === 'community' ? '🟡' : '🔴'}
            </Text>
            <Text style={styles.privacyBtnText}>
              {myVisibility === 'public' ? 'Visible' : myVisibility === 'community' ? 'Community' : 'Hidden'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <View style={styles.alertDot} />
          <Text style={styles.alertStripText}>🚨 {alerts.length} lost dog alert active nearby</Text>
          <View style={styles.radiusBtns}>
            {[1, 5, 10].map(r => (
              <TouchableOpacity key={r} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]} onPress={() => setRadius(r)}>
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r}km</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? '🗺️ All' : f === 'dogs' ? '🐶 Dogs' : f === 'lost' ? '🚨 Lost' : '🌳 Parks'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{dogs.filter(d => d.is_moving).length} moving now</Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        <iframe
          srcDoc={mapHTML}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="SmartPet Tag Live Map"
        />
      </View>

      <View style={styles.legendBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
          {[
            { color: '#C0392B', label: 'You' },
            { color: '#00D4AA', label: 'Public dogs' },
            { color: '#F5A623', label: 'Community only' },
            { color: '#C0392B', label: 'Lost alerts' },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Dog profile popup */}
      {selectedDog && (
        <Animated.View style={[styles.dogPopup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.popupHandle} />
          <View style={styles.popupHeader}>
            <View style={styles.popupAvatar}>
              <Text style={styles.popupAvatarEmoji}>{selectedDog.emoji}</Text>
              {selectedDog.is_moving && <View style={styles.movingDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.popupNameRow}>
                <Text style={styles.popupDogName}>{selectedDog.dog_name}</Text>
                <View style={[styles.visibilityBadge, { backgroundColor: selectedDog.visibility === 'community' ? '#1a1200' : '#003d30' }]}>
                  <Text style={[styles.visibilityBadgeText, { color: selectedDog.visibility === 'community' ? '#F5A623' : '#00D4AA' }]}>
                    {selectedDog.visibility === 'community' ? '🟡 Community' : '🟢 Public'}
                  </Text>
                </View>
              </View>
              <Text style={styles.popupBreed}>{selectedDog.breed}</Text>
              <Text style={styles.popupStatus}>{selectedDog.is_moving ? '🟢 Moving now' : '⚪ Stationary'}</Text>
            </View>
            <TouchableOpacity onPress={closeDogProfile}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popupBody}>
            <View style={styles.popupRow}>
              <Text style={styles.popupLabel}>🐾 Personality</Text>
              <Text style={styles.popupValue}>{selectedDog.personality}</Text>
            </View>
            <View style={styles.popupRow}>
              <Text style={styles.popupLabel}>👤 Owner</Text>
              <Text style={styles.popupValue}>{selectedDog.owner_name}</Text>
            </View>
          </View>
          <View style={styles.popupActions}>
            <TouchableOpacity
              style={styles.popupChatBtn}
              onPress={() => {
                closeDogProfile();
                router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: selectedDog.dog_name, otherOwner: '' } });
              }}
            >
              <Text style={styles.popupChatBtnText}>💬 Say hello to {selectedDog.dog_name}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Privacy settings panel */}
      {showPrivacy && (
        <View style={styles.privacyPanel}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyTitle}>📍 Visibility settings</Text>
            <TouchableOpacity onPress={togglePrivacy}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.privacySub}>Control who can see Athena on the live map</Text>
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.visibilityRow, myVisibility === opt.key && styles.visibilityRowActive]}
              onPress={() => { setMyVisibility(opt.key); setShowPrivacy(false); }}
            >
              <Text style={styles.visibilityIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.visibilityLabel, myVisibility === opt.key && styles.visibilityLabelActive]}>{opt.label}</Text>
                <Text style={styles.visibilityDesc}>{opt.desc}</Text>
              </View>
              {myVisibility === opt.key && <Text style={styles.visibilityCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteText}>🔒 Your location is never sold or shared with third parties. You can change this anytime.</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0d0d0d', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: '#1a1a1a' },
  privacyBtnIcon: { fontSize: 12 },
  privacyBtnText: { fontSize: 12, color: '#ccc', fontWeight: '500' },
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
  filterPillActive: { backgroundColor: '#003d30', borderColor: '#00D4AA' },
  filterText: { fontSize: 12, color: '#444', fontWeight: '500' },
  filterTextActive: { color: '#00D4AA' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D4AA' },
  liveText: { fontSize: 11, color: '#00D4AA', fontWeight: '500' },
  mapContainer: { flex: 1 },
  legendBar: { paddingVertical: 10, backgroundColor: '#0d0d0d', borderTopWidth: 0.5, borderTopColor: '#111' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#444' },
  dogPopup: { position: 'absolute', bottom: 60, left: 0, right: 0, backgroundColor: '#0d0d0d', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, borderColor: '#1a1a1a', padding: 20, paddingTop: 12 },
  popupHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#222', alignSelf: 'center', marginBottom: 16 },
  popupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  popupAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#00D4AA', position: 'relative' },
  popupAvatarEmoji: { fontSize: 26 },
  movingDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#00D4AA', borderWidth: 2, borderColor: '#0d0d0d' },
  popupNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  popupDogName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  visibilityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  visibilityBadgeText: { fontSize: 10, fontWeight: '600' },
  popupBreed: { fontSize: 13, color: '#555', marginBottom: 2 },
  popupStatus: { fontSize: 12, color: '#444' },
  closeBtn: { color: '#444', fontSize: 18, padding: 4 },
  popupBody: { borderTopWidth: 0.5, borderTopColor: '#1a1a1a', paddingTop: 12, marginBottom: 12 },
  popupRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  popupLabel: { fontSize: 13, color: '#555' },
  popupValue: { fontSize: 13, color: '#ccc', flex: 1, textAlign: 'right' },
  popupActions: { gap: 8 },
  popupChatBtn: { backgroundColor: '#003d30', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#00D4AA' },
  popupChatBtnText: { color: '#00D4AA', fontWeight: '600', fontSize: 14 },
  privacyPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0d0d0d', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, borderColor: '#1a1a1a', padding: 20 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  privacyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  privacySub: { fontSize: 13, color: '#555', marginBottom: 16 },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', backgroundColor: '#111', marginBottom: 8 },
  visibilityRowActive: { borderColor: '#00D4AA', backgroundColor: '#003d30' },
  visibilityIcon: { fontSize: 20 },
  visibilityLabel: { fontSize: 14, fontWeight: '600', color: '#ccc', marginBottom: 2 },
  visibilityLabelActive: { color: '#fff' },
  visibilityDesc: { fontSize: 12, color: '#444' },
  visibilityCheck: { color: '#00D4AA', fontSize: 16, fontWeight: '700' },
  privacyNote: { backgroundColor: '#0a0a14', borderRadius: 10, padding: 12, marginTop: 4 },
  privacyNoteText: { fontSize: 11, color: '#444', lineHeight: 16 },
});
