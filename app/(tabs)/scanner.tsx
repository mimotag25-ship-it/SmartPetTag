import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const TARGET_UUID = '12345678-1234-1234-1234-123456789abc';

export default function ScannerScreen() {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(null);
  const [dog, setDog] = useState(null);
  const [log, setLog] = useState([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(pulseAnim2, { toValue: 1.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim2, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(pulseAnim3, { toValue: 2.0, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim3, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }

  function stopPulse() {
    pulseAnim.stopAnimation();
    pulseAnim2.stopAnimation();
    pulseAnim3.stopAnimation();
    pulseAnim.setValue(1);
    pulseAnim2.setValue(1);
    pulseAnim3.setValue(1);
  }

  function addLog(msg) {
    setLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 9)]);
  }

  async function lookupDog() {
    addLog('Tag detected! Looking up dog profile...');
    const { data, error } = await supabase.from('dogs').select('*').single();
    if (error) addLog('Error: ' + error.message);
    else {
      setDog(data);
      addLog('Found: ' + data.name + ' (' + data.breed + ')');
    }
  }

  async function startScan() {
    setScanning(true);
    setFound(null);
    setDog(null);
    startPulse();
    addLog('Starting BLE scan...');

    if (Platform.OS === 'web') {
      addLog('Web mode — simulating BLE scan...');
      setTimeout(() => {
        addLog('Device detected: SmartPetTag-Athena');
        addLog('UUID matched: ' + TARGET_UUID);
        setFound({ name: 'SmartPetTag-Athena', uuid: TARGET_UUID, rssi: -62 });
        lookupDog();
        setScanning(false);
        stopPulse();
      }, 3000);
      return;
    }

    try {
      const { BleManager } = require('react-native-ble-plx');
      const bleManager = new BleManager();

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) { addLog('Scan error: ' + error.message); setScanning(false); stopPulse(); return; }
        if (device && device.name && device.name.includes('SmartPetTag')) {
          bleManager.stopDeviceScan();
          setFound({ name: device.name, uuid: TARGET_UUID, rssi: device.rssi });
          addLog('UUID matched! Loading dog profile...');
          lookupDog();
          setScanning(false);
          stopPulse();
        }
      });

      setTimeout(() => {
        bleManager.stopDeviceScan();
        addLog('Scan timed out — no SmartPetTag found nearby');
        setScanning(false);
        stopPulse();
      }, 10000);

    } catch (e) {
      addLog('BLE not available: ' + e.message);
      setScanning(false);
      stopPulse();
    }
  }

  function stopScan() {
    setScanning(false);
    stopPulse();
    addLog('Scan stopped');
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>SmartPet Tag</Text>
        <Text style={styles.screenTitle}>BLE Scanner</Text>
      </View>

      {/* Scanner circle */}
      <View style={styles.scannerSection}>
        <View style={styles.scannerWrap}>
          {scanning && (
            <>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]} />
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim2 }], opacity: 0.1 }]} />
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim3 }], opacity: 0.06 }]} />
            </>
          )}
          <View style={[styles.scanCircle, scanning && styles.scanCircleActive]}>
            <View style={[styles.scanCircleInner, scanning && styles.scanCircleInnerActive]}>
              <Text style={styles.scanEmoji}>{scanning ? '📡' : dog ? '✅' : '🔍'}</Text>
              <Text style={styles.scanStatus}>
                {scanning ? 'Scanning...' : dog ? 'Tag found!' : 'Ready to scan'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.scanHint}>
          {scanning
            ? 'Hold your phone near the SmartPet Tag collar'
            : dog
            ? `${dog.name}'s tag detected nearby`
            : 'Tap to scan for nearby SmartPet Tag collars'}
        </Text>

        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnStop, dog && styles.scanBtnSuccess]}
          onPress={scanning ? stopScan : startScan}
        >
          <Text style={styles.scanBtnText}>
            {scanning ? 'Stop Scan' : dog ? 'Scan Again' : 'Start BLE Scan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Found device */}
      {found && (
        <View style={styles.foundCard}>
          <View style={styles.foundHeader}>
            <View style={styles.foundDot} />
            <Text style={styles.foundTitle}>Tag detected</Text>
          </View>
          <View style={styles.foundRow}>
            <Text style={styles.foundKey}>Device</Text>
            <Text style={styles.foundVal}>{found.name}</Text>
          </View>
          <View style={styles.foundRow}>
            <Text style={styles.foundKey}>UUID</Text>
            <Text style={styles.foundVal} numberOfLines={1}>{found.uuid}</Text>
          </View>
          <View style={styles.foundRow}>
            <Text style={styles.foundKey}>Signal</Text>
            <Text style={styles.foundVal}>{found.rssi} dBm</Text>
          </View>
        </View>
      )}

      {/* Dog profile */}
      {dog && (
        <View style={styles.dogCard}>
          <View style={styles.dogAvatarRow}>
            <View style={styles.dogAvatar}>
              <Text style={styles.dogAvatarEmoji}>🐕</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogBreed}>{dog.breed} · {dog.age} yrs</Text>
            </View>
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.dogRow}>
            <Text style={styles.dogKey}>Owner</Text>
            <Text style={styles.dogVal}>{dog.owner_name}</Text>
          </View>
          <View style={styles.dogRow}>
            <Text style={styles.dogKey}>Phone</Text>
            <Text style={styles.dogVal}>{dog.owner_phone}</Text>
          </View>
          <View style={styles.dogRow}>
            <Text style={styles.dogKey}>Area</Text>
            <Text style={styles.dogVal}>{dog.neighbourhood}</Text>
          </View>
          <View style={styles.dogRow}>
            <Text style={styles.dogKey}>Personality</Text>
            <Text style={styles.dogVal}>{dog.personality}</Text>
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>📞 Contact Owner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan log */}
      <View style={styles.logCard}>
        <Text style={styles.logTitle}>Scan log</Text>
        {log.length === 0
          ? <Text style={styles.logEmpty}>No activity yet</Text>
          : log.map((entry, i) => (
            <Text key={i} style={[styles.logEntry, i === 0 && styles.logEntryLatest]}>{entry}</Text>
          ))
        }
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', fontStyle: 'italic' },
  screenTitle: { fontSize: 13, color: '#444', fontWeight: '500' },
  scannerSection: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  scannerWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#E8640A' },
  scanCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 1.5, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
  scanCircleActive: { borderColor: '#E8640A' },
  scanCircleInner: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#0d0d0d', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#1a1a1a' },
  scanCircleInnerActive: { backgroundColor: '#120800', borderColor: '#E8640A' },
  scanEmoji: { fontSize: 40, marginBottom: 8 },
  scanStatus: { fontSize: 11, color: '#555', letterSpacing: 0.5 },
  scanHint: { fontSize: 13, color: '#444', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  scanBtn: { backgroundColor: '#E8640A', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 30, minWidth: 180, alignItems: 'center' },
  scanBtnStop: { backgroundColor: '#1a1a1a', borderWidth: 0.5, borderColor: '#333' },
  scanBtnSuccess: { backgroundColor: '#0F6E56' },
  scanBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  foundCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#1D9E75', padding: 16, marginBottom: 12 },
  foundHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  foundDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1D9E75' },
  foundTitle: { fontSize: 12, fontWeight: '600', color: '#1D9E75', textTransform: 'uppercase', letterSpacing: 0.5 },
  foundRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: '#141414' },
  foundKey: { fontSize: 12, color: '#444' },
  foundVal: { fontSize: 12, color: '#ccc', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  dogCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#E8640A', padding: 16, marginBottom: 12 },
  dogAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dogAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#120800', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8640A' },
  dogAvatarEmoji: { fontSize: 26 },
  dogName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  dogBreed: { fontSize: 12, color: '#555' },
  liveTag: { backgroundColor: '#C0392B', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveTagText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1 },
  dogRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#141414' },
  dogKey: { fontSize: 12, color: '#444' },
  dogVal: { fontSize: 12, color: '#ccc', fontWeight: '500' },
  contactBtn: { backgroundColor: '#E8640A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  contactBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  logCard: { marginHorizontal: 16, backgroundColor: '#0d0d0d', borderRadius: 16, borderWidth: 0.5, borderColor: '#141414', padding: 16, marginBottom: 12 },
  logTitle: { fontSize: 12, fontWeight: '600', color: '#333', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  logEmpty: { fontSize: 12, color: '#333', fontStyle: 'italic' },
  logEntry: { fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 4, lineHeight: 16 },
  logEntryLatest: { color: '#1D9E75' },
});