import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Share, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, shadows, energyConfig } from '../../lib/design';
import { useLanguage, t } from '../../lib/i18n';

const GOOGLE_MAPS_KEY = 'AIzaSyCVaatIaoT3Kc-81cwUiaxGgrBT1S7lyMU';

const PARKS = [
  { name: 'Parque España', lat: 19.4148, lng: -99.1762, dogs: 8, status: 'medium' },
  { name: 'Parque México', lat: 19.4162, lng: -99.1748, dogs: 14, status: 'high' },
  { name: 'Parque Hundido', lat: 19.3892, lng: -99.1728, dogs: 3, status: 'low' },
];

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [radius, setRadius] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedDog, setSelectedDog] = useState(null);
  const [myVisibility, setMyVisibility] = useState('public');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const { t, lang } = useLanguage();
  const params = typeof useLocalSearchParams === 'function' ? useLocalSearchParams() : {};
  const focusPark = params?.park || null;

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
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
  }

  function closeDogProfile() {
    Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start(() => setSelectedDog(null));
  }

  const mapHTML = `<!DOCTYPE html><html>
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
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a2daf2' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f0' }] },
          { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c5e8c5' }] },
          { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'on' }] },
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#666666' }] },
        ],
      });

      // You marker
      new google.maps.Marker({
        position: { lat: 19.4136, lng: -99.1716 }, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#F59E0B', fillOpacity: 1, strokeColor: '#FBBF24', strokeWeight: 3 }
      });
      new google.maps.Circle({ map: map, center: { lat: 19.4136, lng: -99.1716 }, radius: 200, fillColor: '#F59E0B', fillOpacity: 0.05, strokeColor: '#F59E0B', strokeOpacity: 0.2, strokeWeight: 1 });

      // Park zones
      ${PARKS.map((p, i) => `
      new google.maps.Circle({ map: map, center: { lat: ${p.lat}, lng: ${p.lng} },
        radius: 120,
        fillColor: '${p.status === 'high' ? '#EF4444' : p.status === 'medium' ? '#F59E0B' : '#10B981'}',
        fillOpacity: 0.08,
        strokeColor: '${p.status === 'high' ? '#EF4444' : p.status === 'medium' ? '#F59E0B' : '#10B981'}',
        strokeOpacity: 0.4, strokeWeight: 1.5
      });
      new google.maps.Marker({
        position: { lat: ${p.lat}, lng: ${p.lng} }, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '${p.status === 'high' ? '#EF4444' : p.status === 'medium' ? '#F59E0B' : '#10B981'}', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 1 },
        title: '${p.name} — ${p.dogs} dogs'
      });
      `).join('')}

      // Dog markers
      ${dogs.map((d, i) => { const safeName = (d.dog_name || '').replace(/'/g, '').replace(/"/g, ''); const safeBreed = (d.breed || '').replace(/'/g, '').replace(/"/g, ''); 
        const color = d.visibility === 'community' ? '#6366F1' : '#F59E0B';
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='56'><circle cx='24' cy='24' r='22' fill='%23111827' stroke='${color}' stroke-width='2.5'/><text x='24' y='31' text-anchor='middle' font-size='20'>${d.emoji || '🐾'}</text>${d.is_moving ? `<circle cx='24' cy='2' r='5' fill='%2310B981'/>` : ''}</svg>`;
        return `
        var pos${i} = { lat: ${d.lat}, lng: ${d.lng} };
        var m${i} = new google.maps.Marker({
          position: pos${i}, map: map,
          icon: { url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('${svg}'), scaledSize: new google.maps.Size(48, 56), anchor: new google.maps.Point(24, 56) }
        });
        ${d.is_moving ? `setInterval(function(){ pos${i} = { lat: pos${i}.lat + (Math.random()-0.5)*0.00004, lng: pos${i}.lng + (Math.random()-0.5)*0.00004 }; m${i}.setPosition(pos${i}); }, 2000);` : ''}
        `;
      }).join('')}

      // Alert markers
      ${alerts.map((a, i) => `
      new google.maps.Marker({
        position: { lat: ${a.lat || 19.4148}, lng: ${a.lng || -99.1728} }, map: map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#EF4444', fillOpacity: 1, strokeColor: '#FCA5A5', strokeWeight: 3 },
        title: '${(a.dog_name || '').replace(/'/g, '')} is lost!'
      });
      `).join('')}
    }
  </script>
  <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
  </body></html>`;

  const FILTERS = [
    { key: 'all', label: '🗺️ ' + t('all'), },
    { key: 'dogs', label: '🐕 ' + t('dogs') },
    { key: 'parks', label: '🌳 ' + t('parks') },
    { key: 'lost', label: '🚨 ' + t('lost') },
  ];

  const VISIBILITY_OPTIONS = [
    { key: 'public', label: t('visible'), icon: '🟢', desc: t('visPublic') },
    { key: 'community', label: t('communityOnly'), icon: '🟡', desc: t('visCommunity') },
    { key: 'private', label: t('hidden'), icon: '🔴', desc: t('visPrivate') },
  ];

  return (
    <View style={styles.container}>

      {/* Top controls */}
      <View style={styles.topControls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.xl }}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={async () => {
              try {
                await Share.share({ message: `🐾 ${dogs.length} pets are tracked near you on SmartPet Tag. Join the safety network for pet owners in CDMX.\n\nsmartpettag.app` });
              } catch (e) {}
            }}
          >
            <Text style={styles.inviteBtnText}>👥 {t('invite')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.privacyBtn} onPress={() => setShowPrivacy(!showPrivacy)}>
            <Text style={styles.privacyDot}>{myVisibility === 'public' ? '🟢' : myVisibility === 'community' ? '🟡' : '🔴'}</Text>
            <Text style={styles.privacyText}>{myVisibility === 'public' ? t('visible') : myVisibility === 'community' ? t('community') : t('hidden')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Park focus banner */}
      {focusPark && (
        <View style={{ backgroundColor: '#052016', borderBottomWidth: 0.5, borderBottomColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 14 }}>🌳</Text>
          <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600', flex: 1 }}>Showing dogs near {focusPark}</Text>
          <Text style={{ fontSize: 11, color: '#10B981' }}>Live</Text>
        </View>
      )}
      {/* Alert strip */}
      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <View style={styles.alertStripDot} />
          <Text style={styles.alertStripText}>🚨 {alerts.length} {t('lostAlerts')} active nearby</Text>
          <View style={styles.radiusBtns}>
            {[1, 5, 10].map(r => (
              <TouchableOpacity key={r} style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]} onPress={() => setRadius(r)}>
                <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>{r}km</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe srcDoc={mapHTML} style={{ width: '100%', height: '100%', border: 'none' }} title="SmartPet Tag Map" />
        ) : (
          <View style={styles.mobileMap}>
            <Text style={styles.mobileMapEmoji}>🗺️</Text>
            <Text style={styles.mobileMapTitle}>Live Pet Map</Text>
            <Text style={styles.mobileMapSub}>Full interactive map available on desktop</Text>
          </View>
        )}
      </View>

      {/* Dog chips */}
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: spacing.xl, paddingVertical: 12 }}>
          {dogs.map((dog, i) => (
            <TouchableOpacity key={i} style={[styles.dogChip, dog.is_moving && styles.dogChipMoving]} onPress={() => openDogProfile(dog)}>
              {dog.photo_url ? (
                <Image source={{ uri: dog.photo_url }} style={styles.dogChipPhoto} />
              ) : (
                <Text style={styles.dogChipEmoji}>{dog.emoji}</Text>
              )}
              <View>
                <Text style={styles.dogChipName}>{dog.dog_name}</Text>
                <Text style={styles.dogChipStatus}>{dog.is_moving ? '🟢 ' + t('movingNow') : '⚪ ' + t('resting')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { color: colors.amber, label: 'You' },
          { color: '#F59E0B', label: t('publicDogs') },
          { color: '#6366F1', label: t('communityOnly') },
          { color: colors.emergency, label: t('lostAlerts') },
          { color: '#10B981', label: 'Parks' },
        ].map((item, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Dog profile popup */}
      {selectedDog && (
        <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.popupHandle} />
          <TouchableOpacity style={styles.popupClose} onPress={closeDogProfile}>
            <Text style={styles.popupCloseText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.popupHero}>
            <View style={styles.popupPhotoWrap}>
              {selectedDog.photo_url ? (
                <Image source={{ uri: selectedDog.photo_url }} style={styles.popupPhoto} />
              ) : (
                <View style={styles.popupPhotoPlaceholder}>
                  <Text style={{ fontSize: 52 }}>{selectedDog.emoji}</Text>
                </View>
              )}
              {selectedDog.is_moving && <View style={styles.popupMovingDot} />}
            </View>

            <View style={styles.popupInfo}>
              <Text style={styles.popupName}>{selectedDog.dog_name}</Text>
              <Text style={styles.popupBreed}>{selectedDog.breed}{selectedDog.age ? ` · ${selectedDog.age} yrs` : ''}</Text>
              <View style={styles.popupBadges}>
                <View style={[styles.popupBadge, { backgroundColor: selectedDog.visibility === 'community' ? colors.communityDim : colors.amberDim, borderColor: selectedDog.visibility === 'community' ? colors.community : colors.amber }]}>
                  <Text style={[styles.popupBadgeText, { color: selectedDog.visibility === 'community' ? colors.community : colors.amber }]}>
                    {selectedDog.visibility === 'community' ? '🟡 ' + t('community') : '🟢 ' + t('visible')}
                  </Text>
                </View>
                {selectedDog.vaccinated && (
                  <View style={[styles.popupBadge, { backgroundColor: colors.safeDim, borderColor: colors.safe }]}>
                    <Text style={[styles.popupBadgeText, { color: colors.safe }]}>💉 Vax</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {selectedDog.tags && selectedDog.tags.length > 0 && (
            <View style={styles.popupTags}>
              {selectedDog.tags.slice(0, 5).map((tag, i) => (
                <View key={i} style={styles.popupTag}>
                  <Text style={styles.popupTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.popupDetails}>
            <View style={styles.popupDetailRow}>
              <Text style={styles.popupDetailIcon}>👤</Text>
              <Text style={styles.popupDetailLabel}>{t('owner')}</Text>
              <Text style={styles.popupDetailValue}>{selectedDog.owner_name}</Text>
            </View>
            <View style={styles.popupDetailRow}>
              <Text style={styles.popupDetailIcon}>⚡</Text>
              <Text style={styles.popupDetailLabel}>{t('energyLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {[1,2,3,4,5].map(i => (
                  <View key={i} style={{ width: 14, height: 6, borderRadius: 2, backgroundColor: i <= 4 ? colors.amber : colors.bgBorder }} />
                ))}
              </View>
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
                <Text style={styles.popupDetailLabel}>Spots</Text>
                <Text style={styles.popupDetailValue} numberOfLines={2}>{selectedDog.favourite_spots}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.popupChatBtn}
            onPress={() => { closeDogProfile(); router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: selectedDog.dog_name, otherOwner: '' } }); }}
          >
            <Text style={styles.popupChatBtnText}>💬 {t('sayHello')} {selectedDog.dog_name}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Privacy panel */}
      {showPrivacy && (
        <View style={styles.privacyPanel}>
          <View style={styles.privacyPanelHeader}>
            <Text style={styles.privacyPanelTitle}>{t('visibilitySettings')}</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.privacyPanelSub}>{t('controlVisibility')}</Text>
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.visibilityRow, myVisibility === opt.key && styles.visibilityRowActive]}
              onPress={() => { setMyVisibility(opt.key); setShowPrivacy(false); }}
            >
              <Text style={styles.visibilityIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.visibilityLabel, myVisibility === opt.key && { color: colors.textPrimary }]}>{opt.label}</Text>
                <Text style={styles.visibilityDesc}>{opt.desc}</Text>
              </View>
              {myVisibility === opt.key && <Text style={{ color: colors.amber, fontSize: 16, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
          <Text style={styles.privacyNote}>{t('privacyNote')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topControls: { paddingTop: 16, paddingBottom: 8, gap: 10 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder },
  filterPillActive: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  filterText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: colors.amber },
  topActions: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl },
  inviteBtn: { backgroundColor: colors.communityDim, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.community },
  inviteBtnText: { color: colors.community, fontSize: 12, fontWeight: '600' },
  privacyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgCard, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.bgBorder },
  privacyDot: { fontSize: 11 },
  privacyText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  alertStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.emergencyDim, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.emergency + '60', paddingHorizontal: spacing.xl, paddingVertical: 10 },
  alertStripDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emergency },
  alertStripText: { fontSize: 12, color: colors.emergency, flex: 1, fontWeight: '500' },
  radiusBtns: { flexDirection: 'row', gap: 6 },
  radiusBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.bgBorder, backgroundColor: colors.bgCard },
  radiusBtnActive: { backgroundColor: colors.emergency, borderColor: colors.emergency },
  radiusBtnText: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  radiusBtnTextActive: { color: colors.white },
  mapContainer: { flex: 1 },
  mobileMap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  mobileMapEmoji: { fontSize: 52 },
  mobileMapTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  mobileMapSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  chipsWrap: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, backgroundColor: colors.bg },
  dogChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.bgBorder, paddingHorizontal: 12, paddingVertical: 8 },
  dogChipMoving: { borderColor: colors.amber },
  dogChipPhoto: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.amber },
  dogChipEmoji: { fontSize: 24 },
  dogChipName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  dogChipStatus: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.xl, paddingVertical: 10, backgroundColor: colors.bgCard, borderTopWidth: 0.5, borderTopColor: colors.bgBorder },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textMuted },
  popup: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, borderColor: colors.bgBorder, padding: 20, paddingTop: 12, maxHeight: '80%' },
  popupHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bgBorder, alignSelf: 'center', marginBottom: 16 },
  popupClose: { position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgBorder, alignItems: 'center', justifyContent: 'center' },
  popupCloseText: { color: colors.textMuted, fontSize: 14 },
  popupHero: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  popupPhotoWrap: { position: 'relative' },
  popupPhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 2.5, borderColor: colors.amber },
  popupPhotoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: colors.amber },
  popupMovingDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.safe, borderWidth: 2, borderColor: colors.bgCard },
  popupInfo: { flex: 1, justifyContent: 'center', gap: 6 },
  popupName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  popupBreed: { fontSize: 13, color: colors.textSecondary },
  popupBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  popupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm, borderWidth: 0.5 },
  popupBadgeText: { fontSize: 10, fontWeight: '700' },
  popupTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  popupTag: { backgroundColor: colors.bgBorder, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  popupTagText: { fontSize: 11, color: colors.textSecondary },
  popupDetails: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, paddingTop: 12, marginBottom: 14 },
  popupDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  popupDetailIcon: { fontSize: 14, width: 24 },
  popupDetailLabel: { fontSize: 12, color: colors.textMuted, width: 80 },
  popupDetailValue: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  popupChatBtn: { backgroundColor: colors.amberDim, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.amber },
  popupChatBtnText: { color: colors.amber, fontWeight: '700', fontSize: 14 },
  privacyPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, borderColor: colors.bgBorder, padding: 20 },
  privacyPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  privacyPanelTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  privacyPanelSub: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.bgBorder, backgroundColor: colors.bg, marginBottom: 8 },
  visibilityRowActive: { borderColor: colors.amber, backgroundColor: colors.amberDim },
  visibilityIcon: { fontSize: 20 },
  visibilityLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
  visibilityDesc: { fontSize: 12, color: colors.textMuted },
  privacyNote: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
