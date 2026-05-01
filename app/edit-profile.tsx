import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

const SIZES = ['Tiny (< 5kg)', 'Small (5-10kg)', 'Medium (10-25kg)', 'Large (25-40kg)', 'XL (40kg+)'];
const COLORS = ['Black', 'White', 'Brown', 'Golden', 'Grey', 'Cream', 'Spotted', 'Brindle', 'Mixed'];

export default function EditProfile() {
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [markings, setMarkings] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [hasMicrochip, setHasMicrochip] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    phone: true, age: true, colour: true, size: true,
    behaviour: true, medical: false, vet: false, markings: true,
    favourite_spots: true, if_found: true,
  });
  const [hasGpsTag, setHasGpsTag] = useState(false);
  const [vaccinated, setVaccinated] = useState(true);
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [behaviourNotes, setBehaviourNotes] = useState('');
  const [favouriteSpots, setFavouriteSpots] = useState('');
  const [ifFoundInstructions, setIfFoundInstructions] = useState('');
  const [respondsTo, setRespondsTo] = useState('');

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/login'); return; }
      const { data } = await supabase.from('dogs').select('*')
        .eq('owner_email', user.email)
        .single();
      if (data) {
        setDog(data);
        setColor(data.color || '');
        setSize(data.size || '');
        setMarkings(data.markings || '');
        setMicrochip(data.microchip || '');
        setHasMicrochip(data.has_microchip || false);
        setHasGpsTag(data.has_gps_tag || false);
        setVaccinated(data.vaccinated !== false);
        setAllergies(data.allergies || '');
        setMedications(data.medications || '');
        setVetName(data.vet_name || '');
        setVetPhone(data.vet_phone || '');
        setBehaviourNotes(data.behaviour_notes || '');
        setFavouriteSpots(data.favourite_spots || '');
        setIfFoundInstructions(data.if_found_instructions || '');
        setRespondsTo(data.responds_to || '');
        setPhotos(data.photos || []);
        if (data.visible_fields) setVisibleFields(JSON.parse(data.visible_fields));
      }
      setLoading(false);
    }
    load();
  }, []);

  function toggleFieldVisibility(field) {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  }

  async function addPhoto() {
    if (photos.length >= 6) { alert('Maximum 6 photos allowed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const fileName = `pet-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
        setPhotos(prev => [...prev, data.publicUrl]);
      }
    } catch (e) {}
    setUploadingPhoto(false);
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  function setProfilePhoto(index) {
    const newPhotos = [...photos];
    const [selected] = newPhotos.splice(index, 1);
    newPhotos.unshift(selected);
    setPhotos(newPhotos);
  }

  async function save() {
    if (!dog) return;
    setSaving(true);
    const { error } = await supabase.from('dogs').update({
      color, size, markings, microchip,
      has_microchip: hasMicrochip,
      has_gps_tag: hasGpsTag,
      vaccinated, allergies, medications,
      vet_name: vetName, vet_phone: vetPhone,
      behaviour_notes: behaviourNotes,
      favourite_spots: favouriteSpots,
      if_found_instructions: ifFoundInstructions,
      responds_to: respondsTo,
      photos,
      visible_fields: JSON.stringify(visibleFields),
      photo_url: photos[0] || dog.photo_url,
    }).eq('id', dog.id);
    if (!error && photos[0]) {
      await supabase.from('dog_locations').update({ photo_url: photos[0] }).eq('dog_name', dog.name);
    }
    setSaving(false);
    if (!error) setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00D4AA" style={{ marginTop: 100 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{dog?.name}'s Profile</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          <Text style={styles.saveBtn}>{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Photos section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Pet Photos</Text>
          <Text style={styles.sectionSub}>First photo is the profile picture. Add up to 6 for identification.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {photos.map((photo, i) => (
              <View key={i} style={{ position: 'relative' }}>
                <Image source={{ uri: photo }} style={{ width: 90, height: 90, borderRadius: 10, borderWidth: i === 0 ? 2.5 : 0.5, borderColor: i === 0 ? '#F59E0B' : '#E2E8F0' }} resizeMode='contain' />
                {i === 0 && (
                  <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, color: '#0F172A', fontWeight: '800' }}>PROFILE</Text>
                  </View>
                )}
                {i !== 0 && (
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(245,158,11,0.9)', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 }}
                    onPress={() => setProfilePhoto(i)}
                  >
                    <Text style={{ fontSize: 9, color: '#0F172A', fontWeight: '800' }}>SET MAIN</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => removePhoto(i)}
                >
                  <Text style={{ color: '#0F172A', fontSize: 12, fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity
                style={{ width: 90, height: 90, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#F59E0B', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onPress={addPhoto}
                disabled={uploadingPhoto}
              >
                <Text style={{ fontSize: 24 }}>📷</Text>
                <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '600' }}>{uploadingPhoto ? 'Uploading...' : `Add photo`}</Text>
                <Text style={{ fontSize: 9, color: '#64748B' }}>{photos.length}/6</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Physical description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐕 Physical Description</Text>
          <Text style={styles.sectionSub}>Helps strangers identify {dog?.name} quickly</Text>

          <Text style={styles.fieldLabel}>Coat color</Text>
          <View style={styles.optionGrid}>
            {COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.optionBtn, color === c && styles.optionBtnActive]}
                onPress={() => setColor(c)}
              >
                <Text style={[styles.optionBtnText, color === c && styles.optionBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Size</Text>
          <View style={styles.optionGrid}>
            {SIZES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.optionBtn, size === s && styles.optionBtnActive]}
                onPress={() => setSize(s)}
              >
                <Text style={[styles.optionBtnText, size === s && styles.optionBtnTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Distinctive markings</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. White patch on left ear, scar on nose"
            placeholderTextColor="#333"
            value={markings}
            onChangeText={setMarkings}
          />

          <Text style={styles.fieldLabel}>Responds to</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Name, whistle, clapping"
            placeholderTextColor="#333"
            value={respondsTo}
            onChangeText={setRespondsTo}
          />
        </View>

        {/* Medical info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚕️ Medical Info</Text>
          <Text style={styles.sectionSub}>Critical for emergencies and finder handoff</Text>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Vaccinated</Text>
              <Text style={styles.toggleSub}>Up to date on vaccines</Text>
            </View>
            <Switch
              value={vaccinated}
              onValueChange={setVaccinated}
              trackColor={{ false: '#1a1a1a', true: '#003d30' }}
              thumbColor={vaccinated ? '#10B981' : '#D1D5DB'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Has microchip</Text>
              <Text style={styles.toggleSub}>Registered microchip implanted</Text>
            </View>
            <Switch
              value={hasMicrochip}
              onValueChange={setHasMicrochip}
              trackColor={{ false: '#1a1a1a', true: '#003d30' }}
              thumbColor={hasMicrochip ? '#10B981' : '#D1D5DB'}
            />
          </View>

          {hasMicrochip && (
            <>
              <Text style={styles.fieldLabel}>Microchip number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 956000012345"
                placeholderTextColor="#333"
                value={microchip}
                onChangeText={setMicrochip}
                keyboardType="numeric"
              />
            </>
          )}

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Has GPS tag</Text>
              <Text style={styles.toggleSub}>SmartPet Tag or other GPS device</Text>
            </View>
            <Switch
              value={hasGpsTag}
              onValueChange={setHasGpsTag}
              trackColor={{ false: '#1a1a1a', true: '#003d30' }}
              thumbColor={hasGpsTag ? '#10B981' : '#D1D5DB'}
            />
          </View>

          <Text style={styles.fieldLabel}>Allergies</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Chicken, pollen, none"
            placeholderTextColor="#333"
            value={allergies}
            onChangeText={setAllergies}
          />

          <Text style={styles.fieldLabel}>Current medications</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. None, monthly flea prevention"
            placeholderTextColor="#333"
            value={medications}
            onChangeText={setMedications}
          />

          <Text style={styles.fieldLabel}>Vet name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Clínica Veterinaria Condesa"
            placeholderTextColor="#333"
            value={vetName}
            onChangeText={setVetName}
          />

          <Text style={styles.fieldLabel}>Vet phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+52 55 XXXX XXXX"
            placeholderTextColor="#333"
            value={vetPhone}
            onChangeText={setVetPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Behaviour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Behaviour</Text>
          <Text style={styles.sectionSub}>Helps finders approach {dog?.name} safely</Text>

          <Text style={styles.fieldLabel}>Behaviour notes</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="e.g. Friendly with strangers, scared of loud noises, may hide under cars"
            placeholderTextColor="#333"
            value={behaviourNotes}
            onChangeText={setBehaviourNotes}
            multiline
          />

          <Text style={styles.fieldLabel}>Favourite spots</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            placeholder="e.g. Parque España near the fountain, morning walks on Amsterdam"
            placeholderTextColor="#333"
            value={favouriteSpots}
            onChangeText={setFavouriteSpots}
            multiline
          />
        </View>

        {/* If found */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 If Found Instructions</Text>
          <Text style={styles.sectionSub}>What should a finder do immediately?</Text>

          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="e.g. Call immediately, do not feed, she knows sit and stay, friendly with children"
            placeholderTextColor="#333"
            value={ifFoundInstructions}
            onChangeText={setIfFoundInstructions}
            multiline
          />

          <View style={styles.tipBox}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>This appears on {dog?.name}'s public profile when someone scans the QR code on the tag. Be specific — it helps finders act fast.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.saveBottomBtn} onPress={save} disabled={saving}>
          <Text style={styles.saveBottomBtnText}>{saving ? 'Saving...' : saved ? '✓ Saved!' : `Save ${dog?.name}'s profile`}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  backBtn: { color: '#555', fontSize: 14 },
  title: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  saveBtn: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  visToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5, borderColor: '#E2E8F0' },
  visToggleOn: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  visToggleText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  visToggleTextOn: { color: '#10B981' },
  savedBtn: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  scroll: { flex: 1 },
  section: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 0.5, borderColor: '#E2E8F0', padding: 16, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  sectionSub: { fontSize: 12, color: '#444', marginBottom: 16, lineHeight: 18 },
  fieldLabel: { fontSize: 11, color: '#444', fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 0.5, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 13, color: '#0F172A', marginBottom: 4 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 0.5, borderColor: '#E2E8F0' },
  optionBtnActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  optionBtnText: { fontSize: 12, color: '#555', fontWeight: '500' },
  optionBtnTextActive: { color: '#10B981' },
  toggleRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0' },
  toggleLabel: { fontSize: 14, color: '#0F172A', color: '#0F172A', fontWeight: '500', marginBottom: 2 },
  toggleSub: { fontSize: 11, color: '#444' },
  tipBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 0.5, borderColor: '#E2E8F0' },
  tipIcon: { fontSize: 16 },
  tipText: { fontSize: 12, color: '#444', lineHeight: 18, flex: 1 },
  saveBottomBtn: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#F59E0B', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBottomBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 16 },
});
