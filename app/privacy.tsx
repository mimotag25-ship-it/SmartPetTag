import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useLanguage } from '../lib/i18n';

export default function Privacy() {
  const { lang } = useLanguage();
  const es = lang === 'es';
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{es ? 'Privacidad' : 'Privacy Policy'}</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>SmartPet Tag {es ? 'Política de Privacidad' : 'Privacy Policy'}</Text>
        <Text style={s.date}>{es ? 'Última actualización: Enero 2026' : 'Last updated: January 2026'}</Text>
        {[
          { title: es ? 'Qué recopilamos' : 'What we collect', body: es ? 'Recopilamos el nombre de tu mascota, foto, raza, y tu información de contacto para crear el perfil de tu mascota en la red SmartPet Tag.' : 'We collect your pet name, photo, breed, and your contact info to create your pet profile on the SmartPet Tag network.' },
          { title: es ? 'Cómo usamos tu información' : 'How we use your info', body: es ? 'Tu información se usa únicamente para mostrar el perfil de tu mascota a otros usuarios y facilitar el contacto si tu mascota se pierde.' : 'Your information is used only to show your pet profile to other users and facilitate contact if your pet goes missing.' },
          { title: es ? 'Ubicación' : 'Location', body: es ? 'Tu ubicación se usa para mostrar a tu mascota en el mapa comunitario. Nunca vendemos ni compartimos tu ubicación con terceros.' : 'Your location is used to show your pet on the community map. We never sell or share your location with third parties.' },
          { title: es ? 'Tus derechos' : 'Your rights', body: es ? 'Puedes eliminar tu cuenta y todos tus datos en cualquier momento contactándonos.' : 'You can delete your account and all your data at any time by contacting us.' },
          { title: es ? 'Contacto' : 'Contact', body: 'hola@smartpettag.app' },
        ].map((item, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{item.title}</Text>
            <Text style={s.sectionBody}>{item.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: '#0F172A' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  content: { padding: 24, gap: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.5 },
  date: { fontSize: 13, color: '#94A3B8', marginBottom: 24 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  sectionBody: { fontSize: 14, color: '#64748B', lineHeight: 22 },
});
