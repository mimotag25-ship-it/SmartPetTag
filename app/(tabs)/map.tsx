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
  const [showSafeZoneModal, setShowSafeZoneModal] = useState(false);
  const [szStep, setSzStep] = useState(1);
  const [zoneRadius, setZoneRadius] = useState(300);
  const [communityThreshold, setCommunityThreshold] = useState(500);
  const mapIframeRef = typeof document !== 'undefined' ? null : null;

  function sendRadiusPreview(radius) {
    const iframe = typeof document !== 'undefined' ? document.querySelector('iframe[title="SmartPet Tag Map"]') : null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'previewZone', lat: userLat, lng: userLng, radius }, '*');
    }
  }
  const [outsideAlert, setOutsideAlert] = useState(false);
  const [confirmCount, setConfirmCount] = useState(0);
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
    // Called every 30s from location watch
    if (!safeZone || !myDog) return;
    const { data } = await supabase.from('dog_locations').select('lat,lng').eq('dog_name', myDog.name).single();
    if (!data) return;
    const dist = distanceKm(safeZone.lat, safeZone.lng, data.lat, data.lng) * 1000;
    if (dist > safeZone.radius + 250) {
      // 250m beyond zone — trigger full community alert prompt
      setOutsideAlert(true);
      await supabase.from('dog_locations').update({ outside_zone: true }).eq('dog_name', myDog.name);
    } else if (dist > safeZone.radius) {
      // Just outside zone — soft alert
      setOutsideAlert(false);
      await supabase.from('dog_locations').update({ outside_zone: true }).eq('dog_name', myDog.name);
    } else {
      setOutsideAlert(false);
      await supabase.from('dog_locations').update({ outside_zone: false }).eq('dog_name', myDog.name);
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

  // Safe zone circle
  var szLat = ${safeZone ? safeZone.lat : 0};
  var szLng = ${safeZone ? safeZone.lng : 0};
  var szRadius = ${safeZone ? safeZone.radius : 0};
  var szActive = ${safeZone ? 'true' : 'false'};
  if(szActive && szLat && szLng) {
    new google.maps.Circle({
      map:map,
      center:{lat:szLat,lng:szLng},
      radius:szRadius,
      fillColor:'#10B981',fillOpacity:0.1,
      strokeColor:'#10B981',strokeOpacity:0.7,strokeWeight:2.5
    });
  }

  
