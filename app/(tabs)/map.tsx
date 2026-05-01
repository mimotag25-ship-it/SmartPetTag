import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

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
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [safeZone, setSafeZone] = useState(null); // { lat, lng, radius }
  const [settingZone, setSettingZone] = useState(false);
  const [myDog, setMyDog] = useState(null);
  const [userLat, setUserLat] = useState(19.4136);
  const [userLng, setUserLng] = useState(-99.1716);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const { t, lang } = useLanguage();
  const params = useLocalSearchParams();
  const focusPark = Array.isArray(params?.park) ? params.park[0] : (params?.park || null);
  const focusLat = parseFloat(Array.isArray(params?.lat) ? params.lat[0] : (params?.lat || '19.4136'));
  const focusLng = parseFloat(Array.isArray(params?.lng) ? params.lng[0] : (params?.lng || '-99.1716'));

  const RADIUS_KM = 2;

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  useEffect(() => {
    // Auto-update location
    let watchId = null;
    let lastUpdate = 0;
    async function updateLocation(lat, lng) {
      const now = Date.now();
      if (now - lastUpdate < 30000) return;
      lastUpdate = now;
      setUserLat(lat); setUserLng(lng);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('dog_locations').update({ lat, lng, is_moving: true }).eq('owner_email', user.email);
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => updateLocation(pos.coords.latitude, pos.coords.longitude),
        () => {}, { enableHighAccuracy: true, maximumAge: 30000, timeout: 10000 }
      );
    }
    return () => { if (watchId !== null && typeof navigator !== 'undefined') navigator.geolocation.clearWatch(watchId); };
  }, []);

  useEffect(() => {
    // Listen for map clicks
    async function handleMessage(event) {
      if (event.data?.type === 'location') {
        const { lat, lng } = event.data;
        setUserLat(lat); setUserLng(lng);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) await supabase.from('dog_locations').update({ lat, lng, is_moving: true }).eq('owner_email', user.email);
      }
      if (event.data?.type === 'dogClick') router.push({ pathname: '/pet-profile', params: { dogName: event.data.name } });
      if (event.data?.type === 'alertClick') router.push({ pathname: '/pet-profile', params: { dogName: event.data.name, alertId: event.data.alertId, isLost: 'true' } });
      if (event.data?.type === 'safeZoneSet') {
        saveSafeZone(event.data.lat, event.data.lng, event.data.radius);
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('message', handleMessage);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('message', handleMessage); };
  }, []);

  useEffect(() => {
    loadAlerts(); loadDogs(); loadMyDog();
    const interval = setInterval(loadDogs, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadMyDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('dogs').select('*').eq('owner_email', user.email).single();
    if (data) {
      setMyDog(data);
      if (data.safe_zone_lat && data.safe_zone_active) {
        setSafeZone({ lat: data.safe_zone_lat, lng: data.safe_zone_lng, radius: data.safe_zone_radius || 500 });
      }
    }
  }

  async function saveSafeZone(lat, lng, radius) {
    if (!myDog) return;
    await supabase.from('dogs').update({
      safe_zone_lat: lat, safe_zone_lng: lng,
      safe_zone_radius: radius, safe_zone_active: true,
    }).eq('id', myDog.id);
    setSafeZone({ lat, lng, radius });
    setSettingZone(false);
    alert(lang === 'es' ? '✅ Zona segura guardada' : '✅ Safe zone saved');
  }

  async function clearSafeZone() {
    if (!myDog) return;
    await supabase.from('dogs').update({ safe_zone_active: false }).eq('id', myDog.id);
    setSafeZone(null);
  }

  async function checkSafeZone() {
    if (!safeZone || !myDog) return;
    const { data } = await supabase.from('dog_locations').select('lat,lng').eq('dog_name', myDog.name).single();
    if (!data) return;
    const dist = distanceKm(safeZone.lat, safeZone.lng, data.lat, data.lng) * 1000;
    if (dist > safeZone.radius) {
      await supabase.from('dog_locations').update({ outside_zone: true }).eq('dog_name', myDog.name);
    }
  }

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost');
    if (data) setAlerts(data);
  }

  async function loadDogs() {
    const { data } = await supabase.from('dog_locations').select('*').neq('visibility', 'private');
    if (data) setDogs(data);
  }

  function openDog(dog) {
    setSelectedDog(dog);
    Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }).start();
  }

  function closeDog() {
    Animated.timing(slideAnim, { toValue: 400, duration: 220, useNativeDriver: true }).start(() => setSelectedDog(null));
  }

  const nearbyDogs = dogs.filter(d => distanceKm(userLat, userLng, d.lat || 19.4136, d.lng || -99.1716) <= RADIUS_KM);
  const filteredDogs = filter === 'all' ? nearbyDogs
    : filter === 'dogs' ? nearbyDogs.filter(d => !alerts.some(a => a.dog_name === d.dog_name))
    : filter === 'lost' ? nearbyDogs.filter(d => alerts.some(a => a.dog_name === d.dog_name))
    : nearbyDogs;

  function buildMapHTML() {
    const filteredForMap = filter === 'all' ? dogs
      : filter === 'dogs' ? dogs.filter(d => !alerts.some(a => a.dog_name === d.dog_name))
      : filter === 'lost' ? dogs.filter(d => alerts.some(a => a.dog_name === d.dog_name))
      : dogs;

    const safeArr = filteredForMap.map(d => ({
      lat: d.lat || 19.4136, lng: d.lng || -99.1716,
      name: String(d.dog_name || '').replace(/['"\\`]/g, ''),
      moving: Boolean(d.is_moving),
      community: d.visibility === 'community',
      photo: d.photo_url || null,
    }));
    const safeAlerts = alerts.map(a => ({
      lat: a.lat || 19.4148, lng: a.lng || -99.1728,
      name: String(a.dog_name || '').replace(/['"\\`]/g, ''),
      id: a.id || '',
    }));
    const parksData = JSON.stringify(filter === 'parks' || filter === 'all' ? PARKS : []);
    const dogsData = JSON.stringify(safeArr);
    const alertsData = JSON.stringify(safeAlerts);

    return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body, #map { width:100%; height:100%; }
</style>
</head>
<body>
<div id="map"></div>
<script>
var DOGS=${dogsData};
var ALERTS=${alertsData};
var PARKS=${parksData};

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: ${focusPark ? focusLat : userLat}, lng: ${focusPark ? focusLng : userLng} },
    zoom: ${focusPark ? 17 : 15},
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    styles: [
      { featureType:'poi', elementType:'labels', stylers:[{ visibility:'off' }] },
      { featureType:'transit', stylers:[{ visibility:'off' }] },
      { featureType:'road', elementType:'labels.icon', stylers:[{ visibility:'off' }] },
      { featureType:'water', elementType:'geometry', stylers:[{ color:'#a8d8ea' }] },
      { featureType:'landscape', elementType:'geometry', stylers:[{ color:'#f5f5f0' }] },
      { featureType:'road.highway', elementType:'geometry', stylers:[{ color:'#ffffff' }] },
      { featureType:'road.arterial', elementType:'geometry', stylers:[{ color:'#ffffff' }] },
      { featureType:'road.local', elementType:'geometry', stylers:[{ color:'#f0f0f0' }] },
      { featureType:'poi.park', elementType:'geometry', stylers:[{ color:'#d4edda' }] },
      { featureType:'poi.park', elementType:'labels.text', stylers:[{ visibility:'on', color:'#4a9460' }] },
      { featureType:'road', elementType:'labels.text.fill', stylers:[{ color:'#999999' }] },
      { featureType:'administrative.locality', elementType:'labels.text.fill', stylers:[{ color:'#555555' }] },
    ]
  });

  // You marker — blue dot like Find My
  var youMarker = new google.maps.Marker({
    position: { lat: ${userLat}, lng: ${userLng} },
    map: map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#007AFF',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3
    },
    zIndex: 1000,
    title: 'Tú'
  });

  // Blue accuracy ring
  new google.maps.Circle({
    map: map,
    center: { lat: ${userLat}, lng: ${userLng} },
    radius: 200,
    fillColor: '#007AFF',
    fillOpacity: 0.08,
    strokeColor: '#007AFF',
    strokeOpacity: 0.2,
    strokeWeight: 1
  });

  // Park zones
  PARKS.forEach(function(p) {
    var c = p.status === 'high' ? '#FF3B30' : p.status === 'medium' ? '#FF9500' : '#34C759';
    new google.maps.Circle({
      map: map, center: { lat: p.lat, lng: p.lng },
      radius: 100, fillColor: c, fillOpacity: 0.08,
      strokeColor: c, strokeOpacity: 0.3, strokeWeight: 1
    });
  });

  // Dog markers — Find My style circular photo badges
  DOGS.forEach(function(d) {
    var borderColor = d.community ? '#5856D6' : '#FF9500';
    if (d.photo) {
      var canvas = document.createElement('canvas');
      canvas.width = 56; canvas.height = 68;
      var ctx = canvas.getContext('2d');
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function() {
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        // White border
        ctx.beginPath();
        ctx.arc(28, 26, 26, 0, Math.PI*2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        // Clip photo
        ctx.save();
        ctx.beginPath();
        ctx.arc(28, 26, 23, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(img, 5, 3, 46, 46);
        ctx.restore();
        // Colored ring
        ctx.beginPath();
        ctx.arc(28, 26, 25, 0, Math.PI*2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // Triangle pointer
        ctx.beginPath();
        ctx.moveTo(22, 50); ctx.lineTo(28, 64); ctx.lineTo(34, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        var m = new google.maps.Marker({
          position: { lat: d.lat, lng: d.lng }, map: map,
          icon: { url: canvas.toDataURL(), scaledSize: new google.maps.Size(56, 68), anchor: new google.maps.Point(28, 64) },
          title: d.name, zIndex: 100
        });
        m.addListener('click', function() {
          window.parent.postMessage({ type: 'dogClick', name: d.name }, '*');
        });
      };
      img.src = d.photo;
    } else {
      // Emoji badge
      var canvas2 = document.createElement('canvas');
      canvas2.width = 52; canvas2.height = 64;
      var ctx2 = canvas2.getContext('2d');
      ctx2.shadowColor = 'rgba(0,0,0,0.2)';
      ctx2.shadowBlur = 6;
      ctx2.shadowOffsetY = 2;
      ctx2.beginPath();
      ctx2.arc(26, 24, 22, 0, Math.PI*2);
      ctx2.fillStyle = '#FFFFFF';
      ctx2.fill();
      ctx2.shadowBlur = 0; ctx2.shadowOffsetY = 0;
      ctx2.beginPath();
      ctx2.arc(26, 24, 21, 0, Math.PI*2);
      ctx2.fillStyle = borderColor + '20';
      ctx2.fill();
      ctx2.strokeStyle = borderColor;
      ctx2.lineWidth = 2.5;
      ctx2.stroke();
      ctx2.font = '22px serif';
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText('🐾', 26, 25);
      ctx2.beginPath();
      ctx2.moveTo(20, 44); ctx2.lineTo(26, 58); ctx2.lineTo(32, 44);
      ctx2.fillStyle = '#FFFFFF';
      ctx2.fill();
      ctx2.strokeStyle = borderColor;
      ctx2.lineWidth = 2;
      ctx2.stroke();
      var m2 = new google.maps.Marker({
        position: { lat: d.lat, lng: d.lng }, map: map,
        icon: { url: canvas2.toDataURL(), scaledSize: new google.maps.Size(52, 64), anchor: new google.maps.Point(26, 58) },
        title: d.name, zIndex: 100
      });
      m2.addListener('click', function() {
        window.parent.postMessage({ type: 'dogClick', name: d.name }, '*');
      });
    }
  });

  // Lost markers — red badge
  ALERTS.forEach(function(a) {
    var canvas3 = document.createElement('canvas');
    canvas3.width = 52; canvas3.height = 64;
    var ctx3 = canvas3.getContext('2d');
    ctx3.shadowColor = 'rgba(255,59,48,0.3)';
    ctx3.shadowBlur = 8; ctx3.shadowOffsetY = 2;
    ctx3.beginPath();
    ctx3.arc(26, 24, 22, 0, Math.PI*2);
    ctx3.fillStyle = '#FF3B30';
    ctx3.fill();
    ctx3.shadowBlur = 0; ctx3.shadowOffsetY = 0;
    ctx3.strokeStyle = '#FFFFFF';
    ctx3.lineWidth = 3;
    ctx3.stroke();
    ctx3.font = 'bold 13px -apple-system, sans-serif';
    ctx3.fillStyle = '#FFFFFF';
    ctx3.textAlign = 'center';
    ctx3.textBaseline = 'middle';
    ctx3.fillText('SOS', 26, 24);
    ctx3.beginPath();
    ctx3.moveTo(20, 44); ctx3.lineTo(26, 58); ctx3.lineTo(32, 44);
    ctx3.fillStyle = '#FF3B30';
    ctx3.fill();
    var m3 = new google.maps.Marker({
      position: { lat: a.lat, lng: a.lng }, map: map,
      icon: { url: canvas3.toDataURL(), scaledSize: new google.maps.Size(52, 64), anchor: new google.maps.Point(26, 58) },
      title: a.name + ' — perdido', zIndex: 200
    });
    m3.addListener('click', function() {
      window.parent.postMessage({ type: 'alertClick', name: a.name, alertId: a.id }, '*');
    });
  });

  // Safe zone
  var safeZoneData=JSON.parse('${JSON.stringify(safeZone || null).replace(/'/g, "\'")}');
  var settingZone=${settingZone ? 'true' : 'false'};
  var safeCircle=null;
  var safeCenter=null;
  var safeRadius=${safeZone ? safeZone.radius : 300};
  var isDragging=false;

  if(safeZoneData){
    safeCircle=new google.maps.Circle({
      map:map,
      center:{lat:safeZoneData.lat,lng:safeZoneData.lng},
      radius:safeZoneData.radius,
      fillColor:'#10B981',fillOpacity:0.08,
      strokeColor:'#10B981',strokeOpacity:0.6,strokeWeight:2,
      editable:false
    });
  }

  if(settingZone){
    var infoDiv=document.createElement('div');
    infoDiv.style.cssText='position:absolute;top:16px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,0.9);color:white;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;pointer-events:none;z-index:999;';
    infoDiv.innerHTML='🎯 Tap map center, then drag to set radius';
    document.body.appendChild(infoDiv);

    var previewCircle=new google.maps.Circle({
      map:map,center:map.getCenter(),radius:safeRadius,
      fillColor:'#10B981',fillOpacity:0.1,
      strokeColor:'#10B981',strokeOpacity:0.8,strokeWeight:2,
      editable:true
    });

    map.addListener('click',function(e){
      previewCircle.setCenter(e.latLng);
      safeCenter=e.latLng;
    });

    google.maps.event.addListener(previewCircle,'radius_changed',function(){
      safeRadius=previewCircle.getRadius();
    });

    var saveBtn=document.createElement('button');
    saveBtn.innerHTML='✓ Save safe zone';
    saveBtn.style.cssText='position:absolute;bottom:100px;left:50%;transform:translateX(-50%);background:#10B981;color:white;border:none;padding:12px 24px;border-radius:20px;font-size:14px;font-weight:700;cursor:pointer;z-index:999;box-shadow:0 4px 12px rgba(16,185,129,0.4);';
    saveBtn.onclick=function(){
      var center=previewCircle.getCenter();
      window.parent.postMessage({type:'safeZoneSet',lat:center.lat(),lng:center.lng(),radius:previewCircle.getRadius()},'*');
    };
    document.body.appendChild(saveBtn);
  }

  // Locate me button — Find My style
  var locateBtn = document.createElement('button');
  locateBtn.style.cssText = 'position:absolute;bottom:24px;right:16px;width:44px;height:44px;background:#fff;border:none;border-radius:50%;box-shadow:0 2px 12px rgba(0,0,0,0.2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:20px;z-index:999;';
  locateBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#007AFF"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="#007AFF" stroke-width="2" stroke-linecap="round"/></svg>';
  locateBtn.onclick = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.panTo(latlng); map.setZoom(17);
        youMarker.setPosition(latlng);
        window.parent.postMessage({ type: 'location', lat: pos.coords.latitude, lng: pos.coords.longitude }, '*');
      }, function() {}, { enableHighAccuracy: true, timeout: 8000 });
    }
  };
  document.body.appendChild(locateBtn);
}
</script>
<script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initMap" async defer></script>
</body></html>`;
  }

  const FILTERS = [
    { key: 'all', label: lang === 'es' ? 'Todo' : 'All', icon: '🗺️' },
    { key: 'dogs', label: lang === 'es' ? 'Mascotas' : 'Pets', icon: '🐕' },
    { key: 'parks', label: lang === 'es' ? 'Parques' : 'Parks', icon: '🌳' },
    { key: 'lost', label: lang === 'es' ? 'Perdidos' : 'Lost', icon: '🚨' },
  ];

  return (
    <View style={s.container}>
      {/* Full screen map */}
      <View style={s.mapFull}>
        {Platform.OS === 'web' ? (
          <iframe
            key={(focusPark || 'default') + filter + userLat + userLng}
            srcDoc={buildMapHTML()}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="SmartPet Tag Map"
          />
        ) : (
          <View style={s.mobileMap}>
            <Text style={{ fontSize: 52 }}>🗺️</Text>
            <Text style={s.mobileMapTitle}>{lang === 'es' ? 'Mapa en vivo' : 'Live Map'}</Text>
            <Text style={s.mobileMapSub}>{lang === 'es' ? 'Disponible en escritorio' : 'Full map on desktop'}</Text>
          </View>
        )}
      </View>

      {/* Filter pills — floating over map like Find My */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterPill, filter === f.key && s.filterPillActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={s.filterIcon}>{f.icon}</Text>
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Alert strip */}
      {alerts.length > 0 && (
        <View style={s.alertStrip}>
          <View style={s.alertDot} />
          <Text style={s.alertStripText}>🚨 {alerts.length} {lang === 'es' ? 'alertas activas cerca' : 'active alerts nearby'}</Text>
        </View>
      )}

      {/* Bottom sheet — Find My style pet list */}
      <View style={s.bottomSheet}>
        <TouchableOpacity onPress={() => setSheetCollapsed(!sheetCollapsed)} style={s.collapseBtn}>
          <Text style={s.collapseBtnArrow}>{sheetCollapsed ? '▲' : '▼'}</Text>
          <Text style={s.collapseBtnLabel}>{sheetCollapsed ? (lang === 'es' ? 'Ver mascotas' : 'Show pets') : (lang === 'es' ? 'Ocultar' : 'Hide')}</Text>
        </TouchableOpacity>
        <View style={s.bottomSheetHeader}>
          <Text style={s.bottomSheetTitle}>{lang === 'es' ? `${filteredDogs.length} mascotas cerca` : `${filteredDogs.length} pets nearby`}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
        {safeZone && (
          <TouchableOpacity style={s.safeZoneActiveBtn} onPress={clearSafeZone}>
            <Text style={s.safeZoneActiveBtnText}>🛡️ {lang === 'es' ? 'Zona activa' : 'Zone active'} ✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[s.safeZoneBtn, settingZone && s.safeZoneBtnActive]} onPress={() => setSettingZone(!settingZone)}>
          <Text style={s.safeZoneBtnText}>{settingZone ? (lang === 'es' ? '✕ Cancelar' : '✕ Cancel') : (lang === 'es' ? '🛡️ Zona segura' : '🛡️ Safe zone')}</Text>
        </TouchableOpacity>
        </View>
        <TouchableOpacity style={s.inviteBtn} onPress={() => {
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: 'SmartPet Tag', text: lang === 'es' ? '🐾 Protege a tu mascota con SmartPet Tag' : '🐾 Protect your pet with SmartPet Tag', url: 'https://smartpettag.vercel.app' });
            }
          }}>
            <Text style={s.inviteBtnText}>{lang === 'es' ? '+ Invitar' : '+ Invite'}</Text>
          </TouchableOpacity>
        </View>

        {!sheetCollapsed && (filteredDogs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyText}>{lang === 'es' ? 'Sin mascotas cerca ahora. ¡Invita amigos!' : 'No pets nearby. Invite friends to join!'}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.petList}>
            {filteredDogs.map((dog, i) => (
              <TouchableOpacity
                key={i}
                style={[s.petCard, dog.is_moving && s.petCardMoving]}
                onPress={() => router.push({ pathname: '/pet-profile', params: { dogName: dog.dog_name } })}
              >
                <View style={s.petCardPhotoWrap}>
                  {dog.photo_url
                    ? <Image source={{ uri: dog.photo_url }} style={s.petCardPhoto} resizeMode="cover" />
                    : <View style={s.petCardPhotoPlaceholder}><Text style={{ fontSize: 22 }}>{dog.emoji || '🐾'}</Text></View>
                  }
                  {dog.is_moving && <View style={s.movingDot} />}
                </View>
                <Text style={s.petCardName} numberOfLines={1}>{dog.dog_name}</Text>
                <Text style={s.petCardStatus}>{dog.is_moving
                  ? (lang === 'es' ? '🟢 Activo' : '🟢 Active')
                  : (lang === 'es' ? '⚪ Descansando' : '⚪ Resting')
                }</Text>
                <Text style={s.petCardDist}>
                  {distanceKm(userLat, userLng, dog.lat, dog.lng) < 1
                    ? Math.round(distanceKm(userLat, userLng, dog.lat, dog.lng) * 1000) + 'm'
                    : distanceKm(userLat, userLng, dog.lat, dog.lng).toFixed(1) + 'km'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ))}
      </View>

      {/* Dog detail popup — Find My style bottom card */}
      {selectedDog && (
        <Animated.View style={[s.popup, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.popupHandle} />
          <TouchableOpacity style={s.popupClose} onPress={closeDog}>
            <Text style={s.popupCloseText}>✕</Text>
          </TouchableOpacity>
          <View style={s.popupHero}>
            <View style={s.popupPhotoWrap}>
              {selectedDog.photo_url
                ? <Image source={{ uri: selectedDog.photo_url }} style={s.popupPhoto} resizeMode="cover" />
                : <View style={s.popupPhotoPlaceholder}><Text style={{ fontSize: 40 }}>{selectedDog.emoji || '🐾'}</Text></View>
              }
              {selectedDog.is_moving && <View style={s.popupMovingDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.popupName}>{selectedDog.dog_name}</Text>
              <Text style={s.popupBreed}>{selectedDog.breed}</Text>
              <Text style={s.popupDist}>
                📍 {distanceKm(userLat, userLng, selectedDog.lat, selectedDog.lng).toFixed(1)}km {lang === 'es' ? 'de distancia' : 'away'}
              </Text>
            </View>
          </View>
          <View style={s.popupActions}>
            <TouchableOpacity style={s.popupActionBtn} onPress={() => { closeDog(); router.push({ pathname: '/pet-profile', params: { dogName: selectedDog.dog_name } }); }}>
              <Text style={s.popupActionIcon}>👤</Text>
              <Text style={s.popupActionText}>{lang === 'es' ? 'Perfil' : 'Profile'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.popupActionBtn} onPress={() => { closeDog(); router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: selectedDog.dog_name, otherOwner: '' } }); }}>
              <Text style={s.popupActionIcon}>💬</Text>
              <Text style={s.popupActionText}>{lang === 'es' ? 'Mensaje' : 'Message'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.popupActionBtn} onPress={() => { if (typeof window !== 'undefined') window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedDog.lat},${selectedDog.lng}`); }}>
              <Text style={s.popupActionIcon}>🧭</Text>
              <Text style={s.popupActionText}>{lang === 'es' ? 'Cómo llegar' : 'Directions'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  mapFull: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  mobileMap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mobileMapTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  mobileMapSub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  // Filter pills — floating
  filterRow: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  filterPillActive: { backgroundColor: '#007AFF' },
  filterIcon: { fontSize: 13 },
  filterText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  filterTextActive: { color: '#FFFFFF' },

  // Alert strip
  alertStrip: { position: 'absolute', top: 64, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8 },
  alertDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
  alertStripText: { fontSize: 12, color: '#FF3B30', fontWeight: '600', flex: 1 },

  // Bottom sheet
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  bottomSheetHandle: { width: 32, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginTop: 6, marginBottom: 6 },
  safeZoneBtn: { backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#10B981' },
  safeZoneBtnActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
  safeZoneBtnText: { fontSize: 12, color: '#10B981', fontWeight: '700' },
  safeZoneActiveBtn: { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center' },
  safeZoneActiveBtnText: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  collapseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, marginTop: 6, marginBottom: 4, borderWidth: 0.5, borderColor: '#E2E8F0' },
  collapseBtnArrow: { fontSize: 10, color: '#64748B' },
  collapseBtnLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  bottomSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6 },
  bottomSheetTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  inviteBtn: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  inviteBtnText: { fontSize: 13, color: '#6366F1', fontWeight: '600' },
  emptyState: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12 },
  emptyIcon: { fontSize: 20 },
  emptyText: { fontSize: 13, color: '#64748B', flex: 1 },

  // Pet cards in bottom list
  petList: { paddingHorizontal: 12, gap: 8, paddingBottom: 4 },
  petCard: { width: 90, alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 10, borderWidth: 0.5, borderColor: '#F8FAFC', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  petCardMoving: { borderColor: '#007AFF', borderWidth: 1.5 },
  petCardPhotoWrap: { position: 'relative', marginBottom: 2 },
  petCardPhoto: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#F8FAFC' },
  petCardPhotoPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  movingDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#34C759', borderWidth: 2, borderColor: '#FFFFFF' },
  petCardName: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', width: '100%' },
  petCardStatus: { fontSize: 9, color: '#64748B', textAlign: 'center' },
  petCardDist: { fontSize: 9, color: '#007AFF', fontWeight: '600' },

  // Dog detail popup
  popup: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20 },
  popupHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  popupClose: { position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: 15, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  popupCloseText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  popupHero: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  popupPhotoWrap: { position: 'relative' },
  popupPhoto: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#F8FAFC' },
  popupPhotoPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  popupMovingDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#34C759', borderWidth: 2, borderColor: '#FFFFFF' },
  popupName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  popupBreed: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  popupDist: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  popupActions: { flexDirection: 'row', gap: 10 },
  popupActionBtn: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#F2F2F7', borderRadius: 14, paddingVertical: 12 },
  popupActionIcon: { fontSize: 22 },
  popupActionText: { fontSize: 11, fontWeight: '600', color: '#334155' },
});
