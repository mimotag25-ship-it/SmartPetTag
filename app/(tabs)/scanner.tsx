import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

const TARGET_UUID = '12345678-1234-1234-1234-123456789abc';

export default function ScannerScreen() {
  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState(null);
  const [dog, setDog] = useState(null);
  const [log, setLog] = useState([]);
  const [manager, setManager] = useState(null);

  function addLog(msg) {
    setLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 9)]);
  }

  async function lookupDog() {
    addLog('Tag detected! Looking up dog profile...');
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .single();
    if (error) {
      addLog('Error: ' + error.message);
    } else {
      setDog(data);
      addLog('Found: ' + data.name + ' (' + data.breed + ')');
    }
  }

  async function startScan() {
    setScanning(true);
    setFound(null);
    setDog(null);
    addLog('Starting BLE scan...');

    if (Platform.OS === 'web') {
      addLog('Web mode — simulating BLE scan...');
      setTimeout(() => {
        addLog('Device detected: SmartPetTag-Athena');
        addLog('UUID matched: ' + TARGET_UUID);
        setFound({ name: 'SmartPetTag-Athena', uuid: TARGET_UUID, rssi: -62 });
        lookupDog();
        setScanning(false);
      }, 3000);
      return;
    }

    try {
      const { BleManager } = require('react-native-ble-plx');
      const bleManager = new BleManager();
      setManager(bleManager);

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          addLog('Scan error: ' + error.message);
          setScanning(false);
          return;
        }

        if (device && device.name && device.name.includes('SmartPetTag')) {
          addLog('Device found: ' + device.name);
          const services = device.serviceUUIDs || [];
          const matched = services.some(s => s.toLowerCase() === TARGET_UUID.toLowerCase());

          if (matched || device.name.includes('SmartPetTag')) {
            bleManager.stopDeviceScan();
            setFound({ name: device.name, uuid: TARGET_UUID, rssi: device.rssi });
            addLog('UUID matched! Loading dog profile...');
            lookupDog();
            setScanning(false);
          }
        }
      });

      setTimeout(() => {
        bleManager.stopDeviceScan();
        if (!found) {
          addLog('Scan timed out — no SmartPetTag found nearby');
          setScanning(false);
        }
      }, 10000);

    } catch (e) {
      addLog('BLE not available: ' + e.message);
      setScanning(false);
    }
  }

  function stopScan() {
    if (manager) manager.stopDeviceScan();
    setScanning(false);
    addLog('Scan stopped');
  }

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BLE Tag Scanner</Text>
        <Text style={styles.headerSub}>Scan for nearby SmartPet Tag collars</Text>
      </View>

      {/* Scanner button */}
      <View style={styles.scannerWrap}>
        <View style={[styles.scanRing, scanning && styles.scanRingActive]}>
          <View style={[styles.scanInner, scanning && styles.scanInnerActive]}>
            <Text style={styles.scanEmoji}>{scanning ? '📡' : '🔍'}</Text>
            <Text style={styles.scanLabel}>{scanning ? 'Scanning...' : 'Tap to scan'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnStop]}
          onPress={scanning ? stopScan : startScan}
        >
          <Text style={styles.scanBtnText}>{scanning ? 'Stop Scan' : 'Start BLE Scan'}</Text>
        </TouchableOpacity>
      </View>

      {/* Found device */}
      {found && (
        <View style={styles.foundCard}>
          <Text style={styles.foundTitle}>📡 Tag detected!</Text>
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
          <View style={styles.dogHeader}>
            <View style={styles.dogAvatar}>
              <Text style={styles.dogEmoji}>🐕</Text>
            </View>
            <View>
              <Text style={styles.dogName}>{dog.name}</Text>
              <Text style={styles.dogBreed}>{dog.breed} · {dog.age} yrs</Text>
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
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>📞 Contact Owner</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan log */}
      <View style={styles.logWrap}>
        <Text style={styles.logTitle}>Scan log</Text>
        {log.length === 0 && <Text style={styles.logEmpty}>No activity yet — tap Start BLE Scan</Text>}
        {log.map((entry, i) => (
          <Text key={i} style={styles.logEntry}>{entry}</Text>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#262626' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: '#aaa' },
  scannerWrap: { alignItems: 'center', padding: 32 },
  scanRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  scanRingActive: { borderColor: '#E8640A' },
  scanInner: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#222' },
  scanInnerActive: { backgroundColor: '#1a0e00', borderColor: '#E8640A' },
  scanEmoji: { fontSize: 40, marginBottom: 6 },
  scanLabel: { fontSize: 12, color: '#aaa' },
  scanBtn: { backgroundColor: '#E8640A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, minWidth: 160, alignItems: 'center' },
  scanBtnStop: { backgroundColor: '#333' },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  foundCard: { margin: 16, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#1D9E75' },
  foundTitle: { color: '#1D9E75', fontWeight: '600', fontSize: 14, marginBottom: 10 },
  foundRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  foundKey: { fontSize: 12, color: '#aaa' },
  foundVal: { fontSize: 12, color: '#fff', fontWeight: '500', maxWidth: '60%' },
  dogCard: { margin: 16, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#E8640A' },
  dogHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dogAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#1a0e00', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8640A' },
  dogEmoji: { fontSize: 26 },
  dogName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  dogBreed: { fontSize: 13, color: '#aaa' },
  dogRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' },
  dogKey: { fontSize: 13, color: '#aaa' },
  dogVal: { fontSize: 13, color: '#fff', fontWeight: '500' },
  contactBtn: { backgroundColor: '#E8640A', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logWrap: { margin: 16, backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#262626' },
  logTitle: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  logEmpty: { fontSize: 12, color: '#333', fontStyle: 'italic' },
  logEntry: { fontSize: 11, color: '#1D9E75', fontFamily: 'monospace', marginBottom: 4, lineHeight: 16 },
});
