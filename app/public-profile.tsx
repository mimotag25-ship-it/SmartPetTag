import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { colors } from '../lib/design';

export default function PublicProfile() {
  const params = useLocalSearchParams();
  const dogName = Array.isArray(params.dogName) ? params.dogName[0] : params.dogName;
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => { loadDog(); }, []);

  async function loadDog() {
    const { data } = await supabase.from('dogs').select('*').eq('name', dogName).single();
    if (data) setDog(data);
    setLoading(false);
  }

  if (loading) return (
    <View style={s.loader}>
      <Text style={{ fontSize: 48 }}>🐾</Text>
      <Text style={{ color: '#666', marginTop: 8 }}>Loading profile...</Text>
    </View>
  );

  if (!dog) return (
    <View style={s.loader}>
      <Text style={{ fontSize: 48 }}>❌</Text>
      <Text style={{ color: '#666', marginTop: 8 }}>Pet not found</Text>
    </View>
  );

  const allPhotos = [dog.photo_url, ...(dog.photos || [])].filter(Boolean);
  const tags = dog.personality?.split(',').map(t => t.trim()).filter(Boolean) || [];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.appName}>🐾 SmartPet Tag</Text>
        <Text style={s.appSub}>Pet Safety Network · CDMX</Text>
      </View>

      {/* Photo */}
      <View style={s.heroWrap}>
        {allPhotos.length > 0 ? (
          <Image source={{ uri: allPhotos[activePhoto] }} style={s.heroPhoto} resizeMode="cover" />
        ) : (
          <View style={s.heroPlaceholder}>
            <Text style={{ fontSize: 80 }}>{dog.emoji || '🐾'}</Text>
          </View>
        )}
        {allPhotos.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbRow}>
            {allPhotos.map((p, i) => (
              <TouchableOpacity key={i} onPress={() => setActivePhoto(i)}>
                <Image source={{ uri: p }} style={[s.thumb, activePhoto === i && s.thumbActive]} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Name */}
      <View style={s.nameWrap}>
        <Text style={s.petName}>{dog.name}</Text>
        <Text style={s.petBreed}>{dog.breed}{dog.age ? ` · ${dog.age} years old` : ''}</Text>
      </View>

      {/* Badges */}
      <View style={s.badges}>
        {dog.vaccinated !== false && <View style={[s.badge, { borderColor: '#10B981', backgroundColor: '#ECFDF5' }]}><Text style={[s.badgeText, { color: '#10B981' }]}>💉 Vaccinated</Text></View>}
        {dog.has_microchip && <View style={[s.badge, { borderColor: '#6366F1', backgroundColor: '#EEF2FF' }]}><Text style={[s.badgeText, { color: '#6366F1' }]}>📡 Microchipped</Text></View>}
        {dog.has_gps_tag && <View style={[s.badge, { borderColor: '#F59E0B', backgroundColor: '#FEF3C7' }]}><Text style={[s.badgeText, { color: '#F59E0B' }]}>📍 GPS Tag</Text></View>}
      </View>

      {/* Personality */}
      {tags.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>✨ Personality</Text>
          <View style={s.tagsWrap}>
            {tags.map((tag, i) => <View key={i} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>)}
          </View>
        </View>
      )}

      {/* Basic info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>🐕 About {dog.name}</Text>
        {dog.color && <View style={s.row}><Text style={s.rowLabel}>Color</Text><Text style={s.rowValue}>{dog.color}</Text></View>}
        {dog.size && <View style={s.row}><Text style={s.rowLabel}>Size</Text><Text style={s.rowValue}>{dog.size}</Text></View>}
        {dog.markings && <View style={s.row}><Text style={s.rowLabel}>Markings</Text><Text style={s.rowValue}>{dog.markings}</Text></View>}
        {dog.responds_to && <View style={s.row}><Text style={s.rowLabel}>Responds to</Text><Text style={s.rowValue}>{dog.responds_to}</Text></View>}
        {dog.neighbourhood && <View style={s.row}><Text style={s.rowLabel}>Home area</Text><Text style={s.rowValue}>{dog.neighbourhood}</Text></View>}
      </View>

      {/* Behaviour */}
      {(dog.behaviour_notes || dog.favourite_spots) && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>🧠 Behaviour</Text>
          {dog.behaviour_notes && <Text style={s.noteText}>{dog.behaviour_notes}</Text>}
          {dog.favourite_spots && <View style={s.row}><Text style={s.rowLabel}>Favourite spots</Text><Text style={s.rowValue}>{dog.favourite_spots}</Text></View>}
        </View>
      )}

      {/* If found — most important section */}
      {dog.if_found_instructions && (
        <View style={[s.section, s.ifFoundSection]}>
          <Text style={s.ifFoundTitle}>🚨 If you found {dog.name}</Text>
          <Text style={s.ifFoundText}>{dog.if_found_instructions}</Text>
        </View>
      )}

      {/* Contact owner */}
      <View style={s.contactSection}>
        <Text style={s.contactTitle}>Contact the owner</Text>
        {dog.owner_phone && (
          <TouchableOpacity style={s.callBtn} onPress={() => Linking.openURL(`tel:${dog.owner_phone}`)}>
            <Text style={s.callBtnIcon}>📞</Text>
            <View>
              <Text style={s.callBtnName}>{dog.owner_name}</Text>
              <Text style={s.callBtnPhone}>{dog.owner_phone}</Text>
            </View>
            <Text style={s.callBtnArrow}>→</Text>
          </TouchableOpacity>
        )}
        {dog.owner_phone && (
          <TouchableOpacity style={s.waBtn} onPress={() => Linking.openURL(`https://wa.me/${dog.owner_phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Hola! Encontré a ${dog.name}. ¿Puedes contactarme?`)}`)}>
            <View style={s.waLogo}><Text style={s.waLogoText}>W</Text></View>
            <Text style={s.waBtnText}>Send WhatsApp message</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Medical */}
      {(dog.allergies || dog.medications || dog.vet_name) && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>⚕️ Medical info</Text>
          {dog.allergies && <View style={s.row}><Text style={s.rowLabel}>Allergies</Text><Text style={s.rowValue}>{dog.allergies}</Text></View>}
          {dog.medications && <View style={s.row}><Text style={s.rowLabel}>Medications</Text><Text style={s.rowValue}>{dog.medications}</Text></View>}
          {dog.vet_name && <View style={s.row}><Text style={s.rowLabel}>Vet</Text><Text style={s.rowValue}>{dog.vet_name}</Text></View>}
          {dog.vet_phone && (
            <TouchableOpacity style={s.vetCallBtn} onPress={() => Linking.openURL(`tel:${dog.vet_phone}`)}>
              <Text style={s.vetCallBtnText}>📞 Call vet: {dog.vet_phone}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={s.footer}>
        <Text style={s.footerText}>🐾 SmartPet Tag · Pet Safety Network</Text>
        <Text style={s.footerSub}>smartpettag.app</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loader: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', paddingTop: 40, paddingBottom: 16 },
  appName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', fontStyle: 'italic' },
  appSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  heroWrap: { width: '100%' },
  heroPhoto: { width: '100%', height: 300, overflow: 'hidden' },
  heroPlaceholder: { width: '100%', height: 300, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  thumbRow: { gap: 8, padding: 10, backgroundColor: '#FFFFFF' },
  thumb: { width: 60, height: 60, borderRadius: 10, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  thumbActive: { borderColor: '#F59E0B' },
  nameWrap: { padding: 20, paddingBottom: 8 },
  petName: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  petBreed: { fontSize: 15, color: '#64748B', marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 0.5 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 0.5, borderColor: '#64748B', overflow: 'hidden' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#64748B' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: '#64748B' },
  rowLabel: { fontSize: 13, color: '#64748B' },
  rowValue: { fontSize: 13, color: '#FFFFFF', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  tag: { backgroundColor: '#64748B', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, color: '#64748B' },
  noteText: { fontSize: 13, color: '#64748B', lineHeight: 20, padding: 14 },
  ifFoundSection: { borderColor: '#EF4444', borderWidth: 1 },
  ifFoundTitle: { fontSize: 15, fontWeight: '800', color: '#EF4444', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#64748B' },
  ifFoundText: { fontSize: 13, color: '#FFFFFF', lineHeight: 22, padding: 16 },
  contactSection: { marginHorizontal: 16, marginBottom: 12 },
  contactTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ECFDF5', borderRadius: 14, borderWidth: 1.5, borderColor: '#10B981', padding: 16, marginBottom: 8 },
  callBtnIcon: { fontSize: 26 },
  callBtnName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  callBtnPhone: { fontSize: 14, color: '#10B981' },
  callBtnArrow: { color: '#10B981', fontSize: 20, marginLeft: 'auto' },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ECFDF5', borderRadius: 14, borderWidth: 0.5, borderColor: '#10B981', paddingVertical: 12, paddingHorizontal: 16, justifyContent: 'center' },
  waLogo: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  waLogoText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  waBtnText: { color: '#10B981', fontSize: 14, fontWeight: '600' },
  vetCallBtn: { margin: 14, backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: '#6366F1' },
  vetCallBtnText: { color: '#6366F1', fontSize: 13, fontWeight: '600' },
  footer: { alignItems: 'center', padding: 24 },
  footerText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  footerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
});
