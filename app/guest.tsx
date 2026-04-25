import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors, shadows, radius } from '../lib/design';
import { useLanguage } from '../lib/i18n';

export default function Guest() {
  const [dogCount, setDogCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const { lang } = useLanguage();

  useEffect(() => {
    supabase.from('dogs').select('id', { count: 'exact' }).then(({ count }) => setDogCount(count || 0));
    supabase.from('lost_alerts').select('id', { count: 'exact' }).eq('status', 'lost').then(({ count }) => setAlertCount(count || 0));
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const es = lang === 'es';

  const FEATURES = [
    { icon: '🚨', title: es ? 'Alerta instantánea' : 'Instant Alert', desc: es ? 'Notifica a todos en 5km en segundos si tu mascota se pierde' : 'Notify everyone within 5km in seconds if your pet goes missing' },
    { icon: '🗺️', title: es ? 'Mapa en vivo' : 'Live Map', desc: es ? 'Ve a todas las mascotas cercanas en tiempo real' : 'See all nearby pets on a live community map' },
    { icon: '🏷️', title: es ? 'Perfil QR' : 'QR Profile', desc: es ? 'Cualquier persona puede escanear el collar y contactarte al instante' : 'Anyone can scan the collar tag and contact you instantly' },
    { icon: '💬', title: es ? 'Chat directo' : 'Direct Chat', desc: es ? 'Coordina con quien encontró a tu mascota sin compartir tu número' : 'Coordinate with finders without sharing your phone number' },
  ];

  const STATS = [
    { num: dogCount + '+', label: es ? 'Mascotas protegidas' : 'Pets protected' },
    { num: alertCount > 0 ? alertCount : '< 1m', label: alertCount > 0 ? (es ? 'Alertas activas' : 'Active alerts') : (es ? 'Velocidad de alerta' : 'Alert speed') },
    { num: '24/7', label: es ? 'Protección activa' : 'Active protection' },
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLogo}>
          <Text style={s.headerPaw}>🐾</Text>
          <Text style={s.headerBrand}>SmartPet Tag</Text>
        </View>
        <TouchableOpacity style={s.signinBtn} onPress={() => router.push('/login')}>
          <Text style={s.signinBtnText}>{es ? 'Iniciar sesión' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <Animated.View style={[s.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={s.heroBadge}>
          <View style={s.heroBadgeDot} />
          <Text style={s.heroBadgeText}>{es ? 'Red activa en CDMX' : 'Active network in CDMX'}</Text>
        </View>
        <Text style={s.heroTitle}>
          {es ? 'Protege a tu mascota con la comunidad' : 'Protect your pet with your community'}
        </Text>
        <Text style={s.heroSub}>
          {es
            ? 'Si tu mascota se pierde, toda tu colonia se entera en segundos. Gratis, siempre.'
            : 'If your pet goes missing, your entire neighbourhood finds out in seconds. Free, always.'}
        </Text>

        <View style={s.heroActions}>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/onboarding')}>
            <Text style={s.ctaBtnText}>{es ? 'Proteger a mi mascota gratis 🐾' : 'Protect my pet for free 🐾'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/login')}>
            <Text style={s.secondaryBtnText}>{es ? '¿Ya tienes cuenta? Entra aquí' : 'Already have an account?'}</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={s.statsRow}>
          {STATS.map((stat, i) => (
            <View key={i} style={[s.statCard, i < STATS.length - 1 && s.statCardBorder]}>
              <Text style={s.statNum}>{stat.num}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* How it works */}
      <View style={s.section}>
        <Text style={s.sectionEyebrow}>{es ? 'CÓMO FUNCIONA' : 'HOW IT WORKS'}</Text>
        <Text style={s.sectionTitle}>{es ? 'Simple. Rápido. Efectivo.' : 'Simple. Fast. Effective.'}</Text>
        <View style={s.stepsContainer}>
          {[
            { num: '01', title: es ? 'Crea el perfil' : 'Create profile', desc: es ? 'Agrega foto, raza, y datos médicos de tu mascota' : 'Add photo, breed, and medical info for your pet' },
            { num: '02', title: es ? 'Únete al mapa' : 'Join the map', desc: es ? 'Tu mascota aparece en el mapa comunitario en vivo' : 'Your pet appears on the live community map' },
            { num: '03', title: es ? 'Alerta en 1 toque' : 'Alert in 1 tap', desc: es ? '47+ vecinos reciben notificación instantánea si se pierde' : '47+ neighbours get instant notification if lost' },
          ].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepNumWrap}>
                <Text style={s.stepNum}>{step.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Features grid */}
      <View style={s.section}>
        <Text style={s.sectionEyebrow}>{es ? 'CARACTERÍSTICAS' : 'FEATURES'}</Text>
        <Text style={s.sectionTitle}>{es ? 'Todo lo que necesitas' : 'Everything you need'}</Text>
        <View style={s.featuresGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={s.featureCard}>
              <View style={s.featureIconWrap}>
                <Text style={s.featureIcon}>{f.icon}</Text>
              </View>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={s.bottomCta}>
        <Text style={s.bottomCtaTitle}>{es ? '¿Listo para proteger a tu mascota?' : 'Ready to protect your pet?'}</Text>
        <Text style={s.bottomCtaSub}>{es ? 'Únete gratis en menos de 2 minutos' : 'Join free in less than 2 minutes'}</Text>
        <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/onboarding')}>
          <Text style={s.ctaBtnText}>{es ? 'Crear cuenta gratis 🐾' : 'Create free account 🐾'}</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={s.footer}>
        <Text style={s.footerBrand}>🐾 SmartPet Tag</Text>
        <Text style={s.footerText}>© 2026 · {es ? 'Ciudad de México' : 'Mexico City'}</Text>
        <TouchableOpacity onPress={() => router.push('/privacy')}>
          <Text style={s.footerLink}>{es ? 'Privacidad' : 'Privacy'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 20 },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPaw: { fontSize: 24 },
  headerBrand: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  signinBtn: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  signinBtnText: { fontSize: 14, fontWeight: '600', color: '#0F172A' },

  // Hero
  hero: { paddingHorizontal: 24, paddingBottom: 32 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginBottom: 16 },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#0F172A', letterSpacing: -1, lineHeight: 42, marginBottom: 12 },
  heroSub: { fontSize: 16, color: '#64748B', lineHeight: 24, marginBottom: 28 },
  heroActions: { gap: 10, marginBottom: 24 },
  ctaBtn: { backgroundColor: '#F59E0B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', ...shadows.amber },
  ctaBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  secondaryBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...shadows.sm },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statCardBorder: { borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '600', marginTop: 2, textAlign: 'center' },

  // Sections
  section: { paddingHorizontal: 24, paddingVertical: 32 },
  sectionEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#F59E0B', marginBottom: 6 },
  sectionTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 20 },

  // Steps
  stepsContainer: { gap: 16 },
  stepRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  stepNumWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCD34D' },
  stepNum: { fontSize: 13, fontWeight: '800', color: '#D97706' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  stepDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featureIcon: { fontSize: 20 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },

  // Bottom CTA
  bottomCta: { margin: 24, backgroundColor: '#0F172A', borderRadius: 24, padding: 28, alignItems: 'center', gap: 8 },
  bottomCtaTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3 },
  bottomCtaSub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 8 },

  // Footer
  footer: { alignItems: 'center', padding: 24, gap: 4 },
  footerBrand: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  footerText: { fontSize: 12, color: '#94A3B8' },
  footerLink: { fontSize: 12, color: '#64748B', textDecorationLine: 'underline' },
});
