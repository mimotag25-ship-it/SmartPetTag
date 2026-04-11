import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Share, Image } from 'react-native';
import { useLanguage, t } from '../../lib/i18n';
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
  const { t, lang } = useLanguage();
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

  function makeDogMarkerJS(d, i) {
    const color = d.visibility === 'community' ? '#F5A623' : '#00D4AA';
    const bg = d.visibility === 'community' ? '#854F0B' : '#003d30';
    const movingDot = d.is_moving ? '<circle cx=\\"22\\" cy=\\"2\\" r=\\"4\\" fill=\\"#00D4AA\\"/>' : '';
    const svgContent = `<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"44\\" height=\\"52\\"><circle cx=\\"22\\" cy=\\"22\\" r=\\"20\\" fill=\\"${bg}\\" stroke=\\"${color}\\" stroke-width=\\"2\\"/><text x=\\"22\\" y=\\"29\\" text-anchor=\\"middle\\" font-size=\\"18\\">${d.emoji}</text>${movingDot}</svg>`;

    return `
      var dogPos${i} = { lat: ${d.lat}, lng: ${d.lng} };
      var dogMarker${i} = new google.maps.Marker({
        position: dogPos${i},
        map: map,
        title: '${d.dog_name}',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent("${svgContent}"),
          scaledSize: new google.maps.Size(44, 52),
          anchor: new google.maps.Point(22, 52),
        }
      });

      ${d.is_moving ? `
      var angle${i} = Math.random() * Math.PI * 2;
      var speed${i} = 0.00003 + Math.random() * 0.00002;
      setInterval(function() {
        angle${i} += (Math.random() - 0.5) * 0.3;
        dogPos${i} = { lat: dogPos${i}.lat + Math.sin(angle${i}) * speed${i}, lng: dogPos${i}.lng + Math.cos(angle${i}) * speed${i} };
        dogMarker${i}.setPosition(dogPos${i});
      }, 1500);` : ''}

      new google.maps.Circle({
        map: map, center: { lat: ${d.lat}, lng: ${d.lng} },
        radius: ${d.is_moving ? 30 : 15},
        fillColor: '${color}', fillOpacity: 0.12,
        strokeColor: '${color}', strokeOpacity: 0.3, strokeWeight: 1,
      });
    `;
  }

  const mapHTML = useMemo(() => {
    const dogMarkersJS = dogs.map((d, i) => makeDogMarkerJS(d, i)).join('');

    const alertMarkersJS = alerts.map((a, i) => `
      var alertMarker${i} = new google.maps.Marker({
        position: { lat: 19.4148, lng: -99.1728 },
        map: map,
        title: '${a.dog_name} is lost!',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#C0392B', fillOpacity: 1,
          strokeColor: '#ff6b6b', strokeWeight: 3,
        }
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
          center: { lat: 19.4136, lng: -99.1716 }, zoom: 15,
          disableDefaultUI: true, zoomControl: true,
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
          position: { lat: 19.4136, lng: -99.1716 }, map: map, title: 'You + Athena',
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#C0392B', fillOpacity: 1, strokeColor: '#ff9966', strokeWeight: 3 }
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
    { key: 'public', label: t('visible'), icon: '🟢', desc: t('visPublic') },
    { key: 'community', label: t('communityOnly'), icon: '🟡', desc: t('visCommunity') },
    { key: 'private', label: t('hidden'), icon: '🔴', desc: 'Only you can see your dog\'s location' },
  ];

  return (
    <View key={lang} style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={async () => {
            try {
              await Share.share({
                message: '🐾 ' + dogs.length + ' dogs are tracked near you on SmartPet Tag. Join the safety network for dog owners in CDMX — lost dog alerts, live map, community chat.\n\nsmartpettag.app',
              });
            } catch (e) {}
          }}
        >
          <Text style={styles.inviteBtnText}>👥 Invite</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.privacyBtn} onPress={() => setShowPrivacy(!showPrivacy)}>
          <Text style={styles.privacyBtnIcon}>{myVisibility === 'public' ? '🟢' : myVisibility === 'community' ? '🟡' : '🔴'}</Text>
          <Text style={styles.privacyBtnText}>{myVisibility === 'public' ? t('visible') : myVisibility === 'community' ? t('community') : t('hidden')}</Text>
        </TouchableOpacity>
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
          {['all', 'dogs', 'lost', 'parks'].map(f => (
            <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? '🗺️ ' + t('all') : f === 'dogs' ? '🐶 ' + t('dogs') : f === 'lost' ? '🚨 ' + t('lost') : '🌳 ' + t('parks')}
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
        {Platform.OS === 'web' ? (
          <iframe srcDoc={mapHTML} style={{ width: '100%', height: '100%', border: 'none' }} title="SmartPet Tag Live Map" />
        ) : (
          <View style={styles.mobileMapPlaceholder}>
            <Text style={styles.mobileMapEmoji}>🗺️</Text>
            <Text style={styles.mobileMapTitle}>Live Dog Map</Text>
            <Text style={styles.mobileMapSub}>Open on desktop to see the full interactive map with live dog tracking</Text>
            <View style={styles.mobileMapDogs}>
              {dogs.slice(0, 4).map((dog, i) => (
                <TouchableOpacity key={i} style={styles.mobileMapDogChip} onPress={() => openDogProfile(dog)}>
                  <Text style={styles.mobileMapDogEmoji}>{dog.emoji}</Text>
                  <Text style={styles.mobileMapDogName}>{dog.dog_name}</Text>
                  <Text style={styles.mobileMapDogStatus}>{dog.is_moving ? '🟢' : '⚪'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Dog chips — tap for profile */}
      <View style={styles.dogListWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
          {dogs.map((dog, i) => (
            <TouchableOpacity key={i} style={[styles.dogChip, dog.is_moving && styles.dogChipMoving]} onPress={() => openDogProfile(dog)}>
              <Text style={styles.dogChipEmoji}>{dog.emoji}</Text>
              <View>
                <Text style={styles.dogChipName}>{dog.dog_name}</Text>
                <Text style={styles.dogChipStatus}>{dog.is_moving ? '🟢 moving' : '⚪ still'}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.legendBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16 }}>
          {[
            { color: '#C0392B', label: 'You' },
            { color: '#00D4AA', label: t('publicDogs') },
            { color: '#F5A623', label: t('communityOnly') },
            { color: '#C0392B', label: t('lostAlerts') },
          ].map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Dog profile popup — full card */}
      {selectedDog && (
        <Animated.View style={[styles.dogPopup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.popupHandle} />

          {/* Close */}
          <TouchableOpacity style={styles.popupCloseBtn} onPress={closeDogProfile}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>

          {/* Hero section — photo + name */}
          <View style={styles.popupHero}>
            <View style={styles.popupPhotoWrap}>
              {selectedDog.photo_url ? (
                <Image source={{ uri: selectedDog.photo_url }} style={styles.popupPhoto} />
              ) : (
                <View style={styles.popupPhotoPlaceholder}>
                  <Text style={styles.popupAvatarEmoji}>{selectedDog.emoji}</Text>
                </View>
              )}
              {selectedDog.is_moving && (
                <View style={styles.movingBadge}>
                  <Text style={styles.movingBadgeText}>🟢 Moving</Text>
                </View>
              )}
            </View>
            <View style={styles.popupHeroInfo}>
              <Text style={styles.popupDogName}>{selectedDog.dog_name}</Text>
              <Text style={styles.popupBreed}>{selectedDog.breed}{selectedDog.age ? ` · ${selectedDog.age} yrs` : ''}</Text>
              <View style={styles.popupBadgeRow}>
                <View style={[styles.visibilityBadge, { backgroundColor: selectedDog.visibility === 'community' ? '#1a1200' : '#003d30' }]}>
                  <Text style={[styles.visibilityBadgeText, { color: selectedDog.visibility === 'community' ? '#F5A623' : '#00D4AA' }]}>
                    {selectedDog.visibility === 'community' ? '🟡 Community' : '🟢 Public'}
                  </Text>
                </View>
                {selectedDog.vaccinated && (
                  <View style={styles.vaccineBadge}>
                    <Text style={styles.vaccineBadgeText}>💉 Vaccinated</Text>
                  </View>
                )}
                {selectedDog.has_microchip && (
                  <View style={styles.microchipBadge}>
                    <Text style={styles.microchipBadgeText}>📡 Chipped</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Personality tags */}
          {selectedDog.tags && selectedDog.tags.length > 0 && (
            <View style={styles.popupTagsRow}>
              {selectedDog.tags.slice(0, 5).map((tag, i) => (
                <View key={i} style={styles.popupTag}>
                  <Text style={styles.popupTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Energy meter */}
          <View style={styles.popupEnergyRow}>
            <Text style={styles.popupEnergyLabel}>Energy</Text>
            <View style={styles.popupEnergyBars}>
              {[1,2,3,4,5].map(i => (
                <View key={i} style={[styles.popupEnergyBar, i <= 4 && styles.popupEnergyBarFill]} />
              ))}
            </View>
            <Text style={styles.popupStatus}>{selectedDog.is_moving ? '🟢 ' + t('movingNow') : '⚪ ' + t('resting')}</Text>
          </View>

          {/* Details */}
          <View style={styles.popupDetails}>
            <View style={styles.popupDetailRow}>
              <Text style={styles.popupDetailIcon}>👤</Text>
              <Text style={styles.popupDetailLabel}>Owner</Text>
              <Text style={styles.popupDetailValue}>{selectedDog.owner_name}</Text>
            </View>
            {selectedDog.size && (
              <View style={styles.popupDetailRow}>
                <Text style={styles.popupDetailIcon}>📏</Text>
                <Text style={styles.popupDetailLabel}>Size</Text>
                <Text style={styles.popupDetailValue}>{selectedDog.size}</Text>
              </View>
            )}
            {selectedDog.favourite_spots && (
              <View style={styles.popupDetailRow}>
                <Text style={styles.popupDetailIcon}>📍</Text>
                <Text style={styles.popupDetailLabel}>Favourite spots</Text>
                <Text style={styles.popupDetailValue} numberOfLines={2}>{selectedDog.favourite_spots}</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.popupActions}>
            <TouchableOpacity
              style={styles.popupChatBtn}
              onPress={() => { closeDogProfile(); router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: selectedDog.dog_name, otherOwner: '' } }); }}
            >
              <Text style={styles.popupChatBtnText}>💬 Say hello to {selectedDog.dog_name}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Privacy panel */}
      {showPrivacy && (
        <View style={styles.privacyPanel}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyTitle}>📍 Visibility settings</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
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
                <Text style={[styles.visibilityLabel, myVisibility === opt.key && { color: '#fff' }]}>{opt.label}</Text>
                <Text style={styles.visibilityDesc}>{opt.desc}</Text>
              </View>
              {myVisibility === opt.key && <Text style={{ color: '#00D4AA', fontSize: 16, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteText}>🔒 Your location is never sold or shared with third parties.</Text>
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
  inviteBtn: { backgroundColor: '#003d30', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: '#00D4AA', marginRight: 8 },
  inviteBtnText: { color: '#00D4AA', fontSize: 12, fontWeight: '600' },
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
  mobileMapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mobileMapEmoji: { fontSize: 52, marginBottom: 12 },
  mobileMapTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  mobileMapSub: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  mobileMapDogs: { width: '100%', gap: 10 },
  mobileMapDogChip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 14 },
  mobileMapDogEmoji: { fontSize: 24 },
  mobileMapDogName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },
  mobileMapDogStatus: { fontSize: 14 },
  dogListWrap: { borderTopWidth: 0.5, borderTopColor: '#111', backgroundColor: '#050508' },
  dogChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 8 },
  dogChipMoving: { borderColor: '#00D4AA' },
  dogChipEmoji: { fontSize: 22 },
  dogChipName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dogChipStatus: { fontSize: 10, color: '#444', marginTop: 1 },
  legendBar: { paddingVertical: 8, backgroundColor: '#0d0d0d', borderTopWidth: 0.5, borderTopColor: '#111' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#444' },
  dogPopup: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0d0d0d', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 0.5, borderColor: '#1a1a1a', padding: 20, paddingTop: 12, maxHeight: '85%' },
  popupCloseBtn: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  popupHero: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  popupPhotoWrap: { position: 'relative' },
  popupPhoto: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#00D4AA' },
  popupPhotoPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#00D4AA' },
  movingBadge: { position: 'absolute', bottom: -4, left: 0, right: 0, alignItems: 'center' },
  movingBadgeText: { fontSize: 9, color: '#00D4AA', fontWeight: '700', backgroundColor: '#050508', paddingHorizontal: 4, borderRadius: 6 },
  popupHeroInfo: { flex: 1, justifyContent: 'center' },
  popupBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  vaccineBadge: { backgroundColor: '#051a10', borderWidth: 0.5, borderColor: '#1D9E75', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  vaccineBadgeText: { fontSize: 9, color: '#1D9E75', fontWeight: '600' },
  microchipBadge: { backgroundColor: '#0d0b1a', borderWidth: 0.5, borderColor: '#5856D6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  microchipBadgeText: { fontSize: 9, color: '#5856D6', fontWeight: '600' },
  popupTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  popupTag: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  popupTagText: { fontSize: 11, color: '#555' },
  popupEnergyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  popupEnergyLabel: { fontSize: 11, color: '#444', width: 50 },
  popupEnergyBars: { flexDirection: 'row', gap: 3 },
  popupEnergyBar: { width: 16, height: 6, borderRadius: 3, backgroundColor: '#1a1a1a' },
  popupEnergyBarFill: { backgroundColor: '#00D4AA' },
  popupDetails: { borderTopWidth: 0.5, borderTopColor: '#1a1a1a', paddingTop: 10, marginBottom: 10 },
  popupDetailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  popupDetailIcon: { fontSize: 13, width: 24 },
  popupDetailLabel: { fontSize: 12, color: '#555', width: 100 },
  popupDetailValue: { fontSize: 12, color: '#ccc', flex: 1 },
  popupActions: { gap: 8 },
  popupHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#222', alignSelf: 'center', marginBottom: 16 },
  popupHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  popupAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#00D4AA', position: 'relative' },
  popupAvatarEmoji: { fontSize: 52 },
  movingDot: { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#00D4AA', borderWidth: 2, borderColor: '#0d0d0d' },
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
  visibilityDesc: { fontSize: 12, color: '#444' },
  privacyNote: { backgroundColor: '#0a0a14', borderRadius: 10, padding: 12, marginTop: 4 },
  privacyNoteText: { fontSize: 11, color: '#444', lineHeight: 16 },
});
