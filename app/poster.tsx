import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams, router } from 'expo-router';

export default function PosterScreen() {
  const { alertId } = useLocalSearchParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('lost_alerts')
        .select('*')
        .eq('id', alertId)
        .single();
      if (data) setAlert(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#C0392B" style={{ marginTop: 100 }} />
    </View>
  );

  if (!alert) return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.emoji}>✅</Text>
        <Text style={styles.title}>This dog has been found!</Text>
      </View>
    </View>
  );

  const sightingUrl = `http://localhost:8081/public-profile?dogName=${alertId}`;

  const posterHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>PERRO PERDIDO - ${alert.dog_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body { font-family: 'Arial', sans-serif; background: #fff; }
        .poster {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .top-banner {
          width: 100%;
          background: #C0392B;
          color: white;
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .top-banner h1 {
          font-size: 42px;
          font-weight: 900;
          letter-spacing: 4px;
          margin-bottom: 4px;
        }
        .top-banner p {
          font-size: 16px;
          opacity: 0.9;
          letter-spacing: 2px;
        }
        .dog-photo {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          border: 8px solid #C0392B;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
          font-size: 100px;
          overflow: hidden;
        }
        .dog-name {
          font-size: 52px;
          font-weight: 900;
          color: #1a1a1a;
          text-align: center;
          margin-bottom: 8px;
        }
        .dog-details {
          width: 100%;
          background: #f9f9f9;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
          border-left: 6px solid #C0392B;
        }
        .detail-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 12px;
          font-size: 18px;
        }
        .detail-icon { width: 32px; font-size: 22px; }
        .detail-label { font-weight: 700; color: #333; width: 140px; }
        .detail-value { color: #555; flex: 1; }
        .contact-box {
          width: 100%;
          background: #C0392B;
          color: white;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin: 16px 0;
        }
        .contact-box h2 { font-size: 22px; margin-bottom: 8px; opacity: 0.9; }
        .contact-box .phone { font-size: 38px; font-weight: 900; letter-spacing: 2px; }
        .qr-section {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 20px;
          background: #f0f0f0;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
        }
        .qr-box {
          width: 120px;
          height: 120px;
          background: white;
          border: 3px solid #333;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          text-align: center;
          padding: 8px;
          color: #333;
          font-weight: 700;
        }
        .qr-text h3 { font-size: 20px; font-weight: 700; color: #333; margin-bottom: 6px; }
        .qr-text p { font-size: 14px; color: #666; line-height: 1.5; }
        .qr-text .url { font-size: 12px; color: #C0392B; word-break: break-all; margin-top: 6px; font-weight: 600; }
        .reward {
          width: 100%;
          border: 3px dashed #C0392B;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          margin: 16px 0;
        }
        .reward h3 { font-size: 24px; font-weight: 700; color: #C0392B; }
        .reward p { font-size: 16px; color: #666; margin-top: 4px; }
        .footer {
          margin-top: auto;
          text-align: center;
          color: #999;
          font-size: 12px;
          padding-top: 16px;
          border-top: 1px solid #eee;
          width: 100%;
        }
        .smartpettag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #050508;
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#050508;color:white;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-weight:700;font-size:16px;">🐾 SmartPet Tag — Emergency Poster</span>
        <button onclick="window.print()" style="background:#C0392B;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">🖨️ Print / Save as PDF</button>
      </div>

      <div class="poster">
        <div class="top-banner">
          <h1>🚨 PERRO PERDIDO</h1>
          <p>LOST DOG — PLEASE HELP</p>
        </div>

        <div class="dog-photo">🐕</div>

        <div class="dog-name">${alert.dog_name}</div>

        <div class="dog-details">
          <div class="detail-row">
            <span class="detail-icon">📍</span>
            <span class="detail-label">Última vez visto:</span>
            <span class="detail-value">${alert.neighbourhood}</span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">👤</span>
            <span class="detail-label">Dueño:</span>
            <span class="detail-value">${alert.owner_name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-icon">📅</span>
            <span class="detail-label">Fecha:</span>
            <span class="detail-value">${new Date(alert.created_at).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        <div class="contact-box">
          <h2>Si lo encuentras, llama de inmediato:</h2>
          <div class="phone">📞 ${alert.owner_phone}</div>
        </div>

        <div class="qr-section">
          <div class="qr-box">
            📱 SCAN<br/>TO REPORT<br/>SIGHTING<br/><br/>QR CODE<br/>HERE
          </div>
          <div class="qr-text">
            <h3>¿Lo viste? Repórtalo aquí</h3>
            <p>Escanea el código QR o visita el enlace. No necesitas descargar ninguna app. Tu reporte llega directamente al dueño.</p>
            <div class="url">${sightingUrl}</div>
          </div>
        </div>

        <div class="reward">
          <h3>🙏 RECOMPENSA</h3>
          <p>La familia agradece cualquier información. Cada avistamiento cuenta.</p>
        </div>

        <div class="footer">
          <div class="smartpettag-badge">🐾 SmartPet Tag</div>
          <p>Ayudando a reunir perros con sus familias en Ciudad de México</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Poster</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.previewInfo}>
        <Text style={styles.previewTitle}>🖨️ Print-ready poster for {alert.dog_name}</Text>
        <Text style={styles.previewSub}>The poster opens in your browser. Tap Print to save as PDF or send to a printer.</Text>
      </View>

      <View style={styles.posterPreview}>
        <iframe
          srcDoc={posterHTML}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Emergency Poster"
        />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.printBtn}
          onPress={() => {
            const blob = new Blob([posterHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }}
        >
          <Text style={styles.printBtnText}>🖨️ Open & Print Poster</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={() => router.back()}>
          <Text style={styles.shareBtnText}>← Back to alert</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  backBtn: { color: '#555', fontSize: 14 },
  title: { fontSize: 15, fontWeight: '700', color: '#fff' },
  previewInfo: { padding: 16, backgroundColor: '#1a0505', borderBottomWidth: 0.5, borderBottomColor: '#C0392B' },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 4 },
  previewSub: { fontSize: 12, color: '#888', lineHeight: 18 },
  posterPreview: { flex: 1 },
  bottomBar: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 0.5, borderTopColor: '#111' },
  printBtn: { flex: 1, backgroundColor: '#C0392B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  printBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  shareBtn: { backgroundColor: '#0d0d0d', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#333' },
  shareBtnText: { color: '#555', fontSize: 14 },
});
