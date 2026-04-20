import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, Share, Image } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, shadows } from '../../lib/design';
import { useLanguage, t } from '../../lib/i18n';

const GOOGLE_MAPS_KEY = 'AIzaSyCVaatIaoT3Kc-81cwUiaxGgrBT1S7lyMU';

const PARKS = [
  { name: 'Parque España', lat: 19.4150, lng: -99.1714, dogs: 8, status: 'medium' },
  { name: 'Parque México', lat: 19.4119, lng: -99.1691, dogs: 14, status: 'high' },
  { name: 'Parque Hundido', lat: 19.3782, lng: -99.1793, dogs: 3, status: 'low' },
  { name: 'Jardín Pushkin', lat: 19.4186, lng: -99.1580, dogs: 5, status: 'low' },
  { name: 'Bosque de Chapultepec', lat: 19.4204, lng: -99.1892, dogs: 22, status: 'high' },
  { name: 'Parque Lincoln', lat: 19.4322, lng: -99.1944, dogs: 9, status: 'medium' },
  { name: 'Parque Caninas Roma', lat: 19.4155, lng: -99.1603, dogs: 6, status: 'medium' },
  { name: 'Parque Coyoacán', lat: 19.3509, lng: -99.1618, dogs: 11, status: 'medium' },
  { name: 'Parque Viveros', lat: 19.3545, lng: -99.1751, dogs: 7, status: 'low' },
];

export default function MapScreen() {
  const [alerts, setAlerts] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedDog, setSelectedDog] = useState(null);
  const [myVisibility, setMyVisibility] = useState('public');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [userLat, setUserLat] = useState(19.4136);
  const [userLng, setUserLng] = useState(-99.1716);
  const RADIUS_KM = 5;

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
  const slideAnim = useRef(new Animated.Value(400)).current;
  const { t, lang } = useLanguage();
  const params = useLocalSearchParams();
  const focusPark = Array.isArray(params?.park) ? params.park[0] : (params?.park || null);
  const focusLat = parseFloat(Array.isArray(params?.lat) ? params.lat[0] : (params?.lat || '19.4136'));
  const focusLng = parseFloat(Array.isArray(params?.lng) ? params.lng[0] : (params?.lng || '-99.1716'));

  useEffect(() => {
    // Listen for location updates from the map iframe
    async function handleMessage(event) {
      if (event.data?.type === 'location') {
        const { lat, lng } = event.data;
        setUserLat(lat);
        setUserLng(lng);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('dog_locations')
            .update({ lat, lng, is_moving: true })
            .eq('owner_email', user.email);
        }
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => {} // fallback to default CDMX coords
      );
    }
    loadAlerts();
    loadDogs();
    const interval = setInterval(loadDogs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost');
    if (data) setAlerts(data);
  }

  async function loadDogs() {
    const { data } = await supabase.from('dog_locations').select('*').neq('visibility', 'private');
    if (data) setDogs(data);
  }

  const nearbyDogs = dogs.filter(d =>
    distanceKm(userLat, userLng, d.lat || 19.4136, d.lng || -99.1716) <= RADIUS_KM
  );
  const filteredDogs = filter === 'all' ? nearbyDogs
    : filter === 'dogs' ? nearbyDogs.filter(d => d.visibility !== 'private')
    : filter === 'lost' ? nearbyDogs.filter(d => alerts.some(a => a.dog_name === d.dog_name))
    : nearbyDogs;

  function openDogProfile(dog) {
    setSelectedDog(dog);
    Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }).start();
  }

  function closeDogProfile() {
    Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start(() => setSelectedDog(null));
  }

  function buildMapHTML() {
    const filteredForMap = filter === 'all' ? dogs
      : filter === 'dogs' ? dogs.filter(d => !alerts.some(a => a.dog_name === d.dog_name))
      : filter === 'lost' ? dogs.filter(d => alerts.some(a => a.dog_name === d.dog_name))
      : dogs;
    const safeArr = filteredForMap.map(d => ({
      lat: d.lat || 19.4136,
      lng: d.lng || -99.1716,
      name: String(d.dog_name || '').replace(/['"\\`]/g, ''),
      moving: Boolean(d.is_moving),
      community: d.visibility === 'community',
      photo: d.photo_url || null,
    }));
    const safeAlerts = alerts.map(a => ({
      lat: 19.4148, lng: -99.1728,
      name: String(a.dog_name || '').replace(/['"\\`]/g, ''),
    }));
    const dogsData = JSON.stringify(safeArr);
    const alertsData = JSON.stringify(safeAlerts);
    const parksData = JSON.stringify(PARKS);

    return `<!DOCTYPE html><html>
<head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%}</style>
</head>
<body><div id="map"></div>
<script>
var DOGS=${dogsData};
var ALERTS=${alertsData};
var PARKS=${parksData};
function initMap(){
  var map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:${focusLat},lng:${focusLng}},zoom:${focusPark ? 17 : 15},
    disableDefaultUI:true,zoomControl:true,
    styles:[
      {featureType:'water',elementType:'geometry',stylers:[{color:'#a2daf2'}]},
      {featureType:'landscape',elementType:'geometry',stylers:[{color:'#f8f8f4'}]},
      {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'road.arterial',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'road.local',elementType:'geometry',stylers:[{color:'#f0f0f0'}]},
      {featureType:'poi.park',elementType:'geometry',stylers:[{color:'#c5e8c5'}]},
      {featureType:'poi',elementType:'labels',stylers:[{visibility:'off'}]},
      {featureType:'transit',stylers:[{visibility:'off'}]},
      {featureType:'road',elementType:'labels.text.fill',stylers:[{color:'#888888'}]}
    ]
  });
  new google.maps.Marker({
    position:{lat:${userLat},lng:${userLng}},map:map,
    icon:{path:google.maps.SymbolPath.CIRCLE,scale:14,fillColor:'#F59E0B',fillOpacity:1,strokeColor:'#fff',strokeWeight:3},
    title:'You'
  });
  new google.maps.Circle({
    map:map,center:{lat:${userLat},lng:${userLng}},
    radius:5000,fillColor:'#F59E0B',fillOpacity:0.04,
    strokeColor:'#F59E0B',strokeOpacity:0.2,strokeWeight:1
  });

  // Locate me button — uses live browser geolocation + updates Supabase
  var locateBtn=document.createElement('button');
  locateBtn.innerHTML='📍';
  locateBtn.title='Go to my location';
  locateBtn.style.cssText='background:#0A0F1E;border:2px solid #F59E0B;border-radius:8px;padding:8px 12px;font-size:20px;cursor:pointer;margin:10px;box-shadow:0 2px 8px rgba(0,0,0,0.4)';
  locateBtn.onclick=function(){
    if(navigator.geolocation){
      locateBtn.innerHTML='⏳';
      navigator.geolocation.getCurrentPosition(function(pos){
        var latlng={lat:pos.coords.latitude,lng:pos.coords.longitude};
        map.setCenter(latlng);
        map.setZoom(17);
        locateBtn.innerHTML='✅';
        setTimeout(function(){ locateBtn.innerHTML='📍'; }, 2000);
        new google.maps.Marker({
          position:latlng,map:map,
          icon:{path:google.maps.SymbolPath.CIRCLE,scale:10,fillColor:'#F59E0B',fillOpacity:1,strokeColor:'#fff',strokeWeight:2},
          title:'You are here'
        });
        // Notify parent to update Supabase
        window.parent.postMessage({type:'location',lat:pos.coords.latitude,lng:pos.coords.longitude},'*');
      },function(){
        locateBtn.innerHTML='📍';
      },{enableHighAccuracy:true,timeout:8000});
    }
  };
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locateBtn);

  // Enable zoom controls
  map.setOptions({zoomControl:true,zoomControlOptions:{position:google.maps.ControlPosition.RIGHT_CENTER}});
  var showParks = '${filter}' === 'all' || '${filter}' === 'parks';
  var showDogs = '${filter}' === 'all' || '${filter}' === 'dogs' || '${filter}' === 'lost';
  if(showParks) PARKS.forEach(function(p){
    var c=p.status==='high'?'#EF4444':p.status==='medium'?'#F59E0B':'#10B981';
    new google.maps.Circle({map:map,center:{lat:p.lat,lng:p.lng},radius:120,fillColor:c,fillOpacity:0.12,strokeColor:c,strokeOpacity:0.5,strokeWeight:1.5});
    new google.maps.Marker({position:{lat:p.lat,lng:p.lng},map:map,icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:c,fillOpacity:1,strokeColor:'#fff',strokeWeight:2},title:p.name});
  });
  if(showDogs) {
  DOGS.forEach(function(d){
    var c=d.community?'#6366F1':'#F59E0B';
    if(d.photo){
      var canvas=document.createElement('canvas');
      canvas.width=48;canvas.height=48;
      var ctx=canvas.getContext('2d');
      var img=new Image();
      img.crossOrigin='anonymous';
      img.onload=function(){
        ctx.beginPath();
        ctx.arc(24,24,22,0,Math.PI*2);
        ctx.clip();
        ctx.drawImage(img,0,0,48,48);
        ctx.beginPath();
        ctx.arc(24,24,22,0,Math.PI*2);
        ctx.strokeStyle=d.community?'#6366F1':'#F59E0B';
        ctx.lineWidth=3;
        ctx.stroke();
        new google.maps.Marker({
          position:{lat:d.lat,lng:d.lng},map:map,
          icon:{url:canvas.toDataURL(),scaledSize:new google.maps.Size(48,48),anchor:new google.maps.Point(24,24)},
          title:d.name
        });
      };
      img.src=d.photo;
    } else {
      new google.maps.Marker({
        position:{lat:d.lat,lng:d.lng},map:map,
        icon:{path:google.maps.SymbolPath.CIRCLE,scale:16,fillColor:c,fillOpacity:1,strokeColor:'#fff',strokeWeight:2.5},
        title:d.name
      });
    }
  });
  }
  ALERTS.forEach(function(a){
    new google.maps.Marker({
      position:{lat:a.lat,lng:a.lng},map:map,
      icon:{path:google.maps.SymbolPath.CIRCLE,scale:16,fillColor:'#EF4444',fillOpacity:1,strokeColor:'#FCA5A5',strokeWeight:3},
      title:a.name+' is lost!'
    });
  });
}
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
</body></html>`;
  }

  const FILTERS = [
    { key: 'all', label: '🗺️ ' + t('all') },
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

      <View style={styles.topControls}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f.key} style={[styles.filterPill, filter === f.key && styles.filterPillActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.inviteBtn} onPress={async () => { try { await Share.share({ message: `🐾 ${dogs.length} pets tracked near you on SmartPet Tag. Join: smartpettag.app` }); } catch(e) {} }}>
            <Text style={styles.inviteBtnText}>👥 {t('invite')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.privacyBtn} onPress={() => setShowPrivacy(!showPrivacy)}>
            <Text>{myVisibility === 'public' ? '🟢' : myVisibility === 'community' ? '🟡' : '🔴'}</Text>
            <Text style={styles.privacyText}>{myVisibility === 'public' ? t('visible') : myVisibility === 'community' ? t('community') : t('hidden')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {focusPark && (
        <View style={styles.focusBanner}>
          <Text style={styles.focusBannerIcon}>🌳</Text>
          <Text style={styles.focusBannerText}>Showing dogs near {focusPark}</Text>
          <Text style={styles.focusBannerLive}>Live</Text>
        </View>
      )}

      {alerts.length > 0 && (
        <View style={styles.alertStrip}>
          <View style={styles.alertDot} />
          <Text style={styles.alertStripText}>🚨 {alerts.length} {t('lostAlerts')} active nearby</Text>
        </View>
      )}

      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe srcDoc={buildMapHTML()} style={{ width: '100%', height: '100%', border: 'none' }} title="SmartPet Tag Map" />
        ) : (
          <View style={styles.mobileMap}>
            <Text style={{ fontSize: 52 }}>🗺️</Text>
            <Text style={styles.mobileMapTitle}>Live Pet Map</Text>
            <Text style={styles.mobileMapSub}>Full map available on desktop</Text>
          </View>
        )}
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingVertical: 12 }}>
          {filteredDogs.map((dog, i) => (
            <TouchableOpacity key={i} style={[styles.dogChip, dog.is_moving && styles.dogChipMoving]} onPress={() => router.push({ pathname: '/pet-profile', params: { dogName: dog.dog_name } })}>
              {dog.photo_url ? <Image source={{ uri: dog.photo_url }} style={styles.dogChipPhoto} /> : <Text style={{ fontSize: 24 }}>{dog.emoji}</Text>}
              <View>
                <Text style={styles.dogChipName}>{dog.dog_name}</Text>
                <Text style={styles.dogChipStatus}>{dog.is_moving ? '🟢 ' + t('movingNow') : '⚪ ' + t('resting')}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

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

      {selectedDog && (
        <Animated.View style={[styles.popup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.popupHandle} />
          <TouchableOpacity style={styles.popupClose} onPress={closeDogProfile}>
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>✕</Text>
          </TouchableOpacity>
          <View style={styles.popupHero}>
            <View style={styles.popupPhotoWrap}>
              {selectedDog.photo_url
                ? <Image source={{ uri: selectedDog.photo_url }} style={styles.popupPhoto} />
                : <View style={styles.popupPhotoPlaceholder}><Text style={{ fontSize: 52 }}>{selectedDog.emoji}</Text></View>}
              {selectedDog.is_moving && <View style={styles.popupMovingDot} />}
            </View>
            <View style={{ flex: 1, justifyContent: 'center', gap: 4 }}>
              <Text style={styles.popupName}>{selectedDog.dog_name}</Text>
              <Text style={styles.popupBreed}>{selectedDog.breed}{selectedDog.age ? ` · ${selectedDog.age} yrs` : ''}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={[styles.popupBadge, { backgroundColor: selectedDog.visibility === 'community' ? colors.communityDim : colors.amberDim, borderColor: selectedDog.visibility === 'community' ? colors.community : colors.amber }]}>
                  <Text style={[styles.popupBadgeText, { color: selectedDog.visibility === 'community' ? colors.community : colors.amber }]}>
                    {selectedDog.visibility === 'community' ? '🟡 ' + t('community') : '🟢 ' + t('visible')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {selectedDog.tags && selectedDog.tags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {selectedDog.tags.slice(0, 5).map((tag, i) => (
                <View key={i} style={styles.popupTag}><Text style={styles.popupTagText}>{tag}</Text></View>
              ))}
            </View>
          )}
          <View style={styles.popupDetails}>
            <View style={styles.popupDetailRow}>
              <Text style={styles.popupDetailIcon}>👤</Text>
              <Text style={styles.popupDetailLabel}>{t('owner')}</Text>
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
                <Text style={styles.popupDetailLabel}>Spots</Text>
                <Text style={styles.popupDetailValue} numberOfLines={2}>{selectedDog.favourite_spots}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={[styles.popupChatBtn, { marginBottom: 8 }]} onPress={() => { closeDogProfile(); router.push({ pathname: '/pet-profile', params: { dogName: selectedDog.dog_name } }); }}>
            <Text style={styles.popupChatBtnText}>🐾 View full profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.popupChatBtn, { backgroundColor: colors.communityDim, borderColor: colors.community }]} onPress={() => { closeDogProfile(); router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: selectedDog.dog_name, otherOwner: '' } }); }}>
            <Text style={styles.popupChatBtnText}>💬 {t('sayHello')} {selectedDog.dog_name}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {showPrivacy && (
        <View style={styles.privacyPanel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.privacyPanelTitle}>{t('visibilitySettings')}</Text>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}><Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text></TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>{t('controlVisibility')}</Text>
          {VISIBILITY_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.key} style={[styles.visibilityRow, myVisibility === opt.key && styles.visibilityRowActive]} onPress={() => { setMyVisibility(opt.key); setShowPrivacy(false); }}>
              <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.visibilityLabel, myVisibility === opt.key && { color: colors.textPrimary }]}>{opt.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{opt.desc}</Text>
              </View>
              {myVisibility === opt.key && <Text style={{ color: colors.amber, fontSize: 16, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topControls: { paddingTop: 16, paddingBottom: 8, gap: 10 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: colors.bgCard, borderWidth: 0.5, borderColor: colors.bgBorder },
  filterPillActive: { backgroundColor: colors.amberDim, borderColor: colors.amber },
  filterText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  filterTextActive: { color: colors.amber },
  topActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  inviteBtn: { backgroundColor: colors.communityDim, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.community },
  inviteBtnText: { color: colors.community, fontSize: 12, fontWeight: '600' },
  privacyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgCard, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: colors.bgBorder },
  privacyText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  focusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#052016', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10 },
  focusBannerIcon: { fontSize: 16 },
  focusBannerText: { fontSize: 13, color: '#10B981', fontWeight: '600', flex: 1 },
  focusBannerLive: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  alertStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.emergencyDim, borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: colors.emergency + '60', paddingHorizontal: 20, paddingVertical: 10 },
  alertDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emergency },
  alertStripText: { fontSize: 12, color: colors.emergency, flex: 1, fontWeight: '500' },
  mapContainer: { flex: 1 },
  mobileMap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  mobileMapTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  mobileMapSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  chipsWrap: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, backgroundColor: colors.bg },
  dogChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, paddingHorizontal: 12, paddingVertical: 8 },
  dogChipMoving: { borderColor: colors.amber },
  dogChipPhoto: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.amber },
  dogChipName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  dogChipStatus: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: colors.bgCard, borderTopWidth: 0.5, borderTopColor: colors.bgBorder },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textMuted },
  popup: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, borderColor: colors.bgBorder, padding: 20, paddingTop: 12, maxHeight: '80%' },
  popupHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.bgBorder, alignSelf: 'center', marginBottom: 16 },
  popupClose: { position: 'absolute', top: 16, right: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgBorder, alignItems: 'center', justifyContent: 'center' },
  popupHero: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  popupPhotoWrap: { position: 'relative' },
  popupPhoto: { width: 100, height: 100, borderRadius: 50, borderWidth: 2.5, borderColor: colors.amber },
  popupPhotoPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: colors.amber },
  popupMovingDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.safe, borderWidth: 2, borderColor: colors.bgCard },
  popupName: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  popupBreed: { fontSize: 13, color: colors.textSecondary },
  popupBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 0.5 },
  popupBadgeText: { fontSize: 10, fontWeight: '700' },
  popupTag: { backgroundColor: colors.bgBorder, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  popupTagText: { fontSize: 11, color: colors.textSecondary },
  popupDetails: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, paddingTop: 12, marginBottom: 14 },
  popupDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  popupDetailIcon: { fontSize: 14, width: 24 },
  popupDetailLabel: { fontSize: 12, color: colors.textMuted, width: 80 },
  popupDetailValue: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  popupChatBtn: { backgroundColor: colors.amberDim, borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.amber },
  popupChatBtnText: { color: colors.amber, fontWeight: '700', fontSize: 14 },
  privacyPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 0.5, borderColor: colors.bgBorder, padding: 20 },
  privacyPanelTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: colors.bgBorder, backgroundColor: colors.bg, marginBottom: 8 },
  visibilityRowActive: { borderColor: colors.amber, backgroundColor: colors.amberDim },
  visibilityLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 2 },
});
