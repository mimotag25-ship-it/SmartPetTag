import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';

const { width } = Dimensions.get('window');
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows } from '../lib/design';

const ENERGY_COLORS = ['#6366F1', '#6366F1', '#10B981', '#F59E0B', '#F97316', '#EF4444'];
const ENERGY_LABELS = ['', 'Very Calm', 'Calm', 'Active', 'High Energy', 'Extreme'];

function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.infoRow}>
      <View style={s.infoRowLeft}>
        <Text style={s.infoRowIcon}>{icon}</Text>
        <Text style={s.infoRowLabel}>{label}</Text>
      </View>
      <Text style={s.infoRowValue}>{value}</Text>
    </View>
  );
}

function Badge({ icon, label, color, bg }) {
  return (
    <View style={[s.badge, { backgroundColor: bg, borderColor: color }]}>
      <Text style={s.badgeIcon}>{icon}</Text>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function PetProfile() {
  const params = useLocalSearchParams();
  const dogName = Array.isArray(params.dogName) ? params.dogName[0] : params.dogName;
  const alertId = Array.isArray(params.alertId) ? params.alertId[0] : params.alertId;
  const isLost = params.isLost === 'true';
  const [dog, setDog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const energyLevel = 4;

  useEffect(() => { loadDog(); }, []);

  async function loadDog() {
    const { data: locData } = await supabase.from('dog_locations').select('*').eq('dog_name', dogName).single();
    const { data: dogData } = await supabase.from('dogs').select('*').eq('name', dogName).single();
    if (dogData) setDog({ ...locData, ...dogData });
    else if (locData) setDog(locData);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && dogData?.owner_email === user.email) setIsOwner(true);
    setLoading(false);
  }

  const tags = dog?.personality?.split(',').map(t => t.trim()).filter(Boolean) || [];

  if (loading) return <View style={s.loader}><Text style={{ fontSize: 48 }}>🐾</Text></View>;
  if (!dog) return <View style={s.loader}><Text style={{ color: colors.textMuted }}>Pet not found</Text></View>;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pet Profile</Text>
        {isOwner
          ? <TouchableOpacity style={s.headerEdit} onPress={() => router.push('/edit-profile')}><Text style={s.headerEditText}>Edit</Text></TouchableOpacity>
          : <View style={{ width: 60 }} />
        }
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {(() => {
          const allPhotos = [dog.photo_url, ...(dog.photos || [])].filter(Boolean);
          if (allPhotos.length === 0) return (
            <View style={s.heroPlaceholder}>
              <Text style={{ fontSize: 100 }}>{dog.emoji || '🐾'}</Text>
            </View>
          );
          return (
            <View>
              <View style={s.heroWrap}>
                <Image source={{ uri: allPhotos[activePhoto] }} style={s.heroPhoto} resizeMode="cover" />
                <View style={s.onlineIndicator}>
                  <View style={s.onlineDot} />
                  <Text style={s.onlineText}>{dog.is_moving ? 'Moving now' : 'Online'}</Text>
                </View>
                {allPhotos.length > 1 && (
                  <View style={s.photoCounter}>
                    <Text style={s.photoCounterText}>{activePhoto + 1} / {allPhotos.length}</Text>
                  </View>
                )}
                {activePhoto === 0 && (
                  <View style={s.profilePicBadge}>
                    <Text style={s.profilePicBadgeText}>⭐ Profile photo</Text>
                  </View>
                )}
              </View>
              {allPhotos.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbnailRow}>
                  {allPhotos.map((photo, i) => (
                    <TouchableOpacity key={i} onPress={() => setActivePhoto(i)} style={[s.thumbnailWrap, activePhoto === i && s.thumbnailWrapActive]}>
                      <Image source={{ uri: photo }} style={s.thumbnail} resizeMode="cover" />
                      {i === 0 && <View style={s.thumbnailBadge}><Text style={s.thumbnailBadgeText}>MAIN</Text></View>}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })()}

        {isLost && (
          <View style={s.lostBanner}>
            <View style={s.lostBannerDot} />
            <View style={{ flex: 1 }}>
              <Text style={s.lostBannerTitle}>🚨 {dog.name} is missing</Text>
              <Text style={s.lostBannerSub}>Last seen near {dog.neighbourhood} — owner is looking</Text>
            </View>
          </View>
        )}

        <View style={s.nameSection}>
          <View>
            <Text style={s.petName}>{dog.name}</Text>
            <Text style={s.petBreed}>{dog.breed}{dog.age ? ` · ${dog.age} yrs` : ''}</Text>
          </View>
          {!isOwner && (
            <TouchableOpacity style={s.chatBtn} onPress={() => router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: dog.name, otherOwner: dog.owner_phone || '' } })}>
              <Text style={s.chatBtnText}>💬 Say hello</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.energyWrap}>
          <View style={s.energyTrack}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[s.energySeg, { backgroundColor: i <= energyLevel ? ENERGY_COLORS[energyLevel] : colors.bgBorder }]} />
            ))}
          </View>
          <Text style={[s.energyLabel, { color: ENERGY_COLORS[energyLevel] }]}>{ENERGY_LABELS[energyLevel]}</Text>
        </View>

        <View style={s.badgesRow}>
          {dog.vaccinated !== false && <Badge icon="💉" label="Vaccinated" color="#10B981" bg="#ECFDF5" />}
          {dog.has_microchip && <Badge icon="📡" label="Microchipped" color="#6366F1" bg="#EEF2FF" />}
          {dog.has_gps_tag && <Badge icon="📍" label="GPS Tag" color={colors.amber} bg={colors.amberDim} />}
          {dog.is_moving && <Badge icon="🟢" label="Moving now" color="#10B981" bg="#ECFDF5" />}
        </View>

        {tags.length > 0 && (
          <Section title="✨ Personality">
            <View style={s.tagsWrap}>
              {tags.map((tag, i) => (
                <View key={i} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>
              ))}
            </View>
          </Section>
        )}

        <Section title="🐕 Basic Info">
          <InfoRow icon="🎂" label="Age" value={dog.age ? `${dog.age} years old` : null} />
          <InfoRow icon="🎨" label="Color" value={dog.color} />
          <InfoRow icon="📏" label="Size" value={dog.size} />
          <InfoRow icon="📍" label="Area" value={dog.neighbourhood} />
          <InfoRow icon="👤" label="Owner" value={dog.owner_name} />
          <InfoRow icon="👂" label="Responds to" value={dog.responds_to} />
          <InfoRow icon="🔍" label="Markings" value={dog.markings} />
        </Section>

        {(dog.behaviour_notes || dog.favourite_spots) && (
          <Section title="🧠 Behaviour">
            {dog.behaviour_notes && (
              <View style={s.noteCard}><Text style={s.noteCardText}>{dog.behaviour_notes}</Text></View>
            )}
            {dog.favourite_spots && <InfoRow icon="🌳" label="Favourite spots" value={dog.favourite_spots} />}
          </Section>
        )}

        {(dog.vet_name || dog.allergies || dog.medications || dog.microchip) && (
          <Section title="⚕️ Medical">
            {dog.vet_name && <InfoRow icon="🏥" label="Vet" value={dog.vet_name} />}
            {dog.vet_phone && <InfoRow icon="📞" label="Vet phone" value={dog.vet_phone} />}
            {dog.allergies && <InfoRow icon="⚠️" label="Allergies" value={dog.allergies} />}
            {dog.medications && <InfoRow icon="💊" label="Medications" value={dog.medications} />}
            {dog.microchip && <InfoRow icon="📡" label="Microchip #" value={dog.microchip} />}
          </Section>
        )}

        {dog.if_found_instructions && (
          <Section title="🚨 If Found">
            <View style={s.ifFoundCard}><Text style={s.ifFoundText}>{dog.if_found_instructions}</Text></View>
            <InfoRow icon="📞" label="Owner phone" value={dog.owner_phone} />
          </Section>
        )}

        <TouchableOpacity style={s.shareProfileBtn} onPress={() => {
          if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: dog.name + ' on SmartPet Tag', url: window.location.origin + '/public-profile?dogName=' + dog.name });
          }
        }}>
          <Text style={s.shareProfileBtnText}>🔗 Share {dog.name}'s profile</Text>
        </TouchableOpacity>

        {isLost && !isOwner && (
          <TouchableOpacity
            style={s.reportFoundBtn}
            onPress={() => router.push({ pathname: '/found', params: { alertId, dogName: dog.name, ownerName: dog.owner_name, ownerPhone: dog.owner_phone, neighbourhood: dog.neighbourhood } })}
          >
            <Text style={s.reportFoundBtnText}>🙋 I found {dog.name} — report it</Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <TouchableOpacity style={s.lostBtn} onPress={() => router.push('/emergency')}>
            <Text style={s.lostBtnText}>🚨 Report {dog.name} as lost</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: colors.textPrimary, fontSize: 24, fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerEdit: { backgroundColor: colors.amberDim, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 0.5, borderColor: colors.amber },
  headerEditText: { color: colors.amber, fontSize: 13, fontWeight: '600' },
  heroWrap: { width: '100%', height: 320, position: 'relative', backgroundColor: '#111827', overflow: 'hidden' },
  photoCounter: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 5 },
  photoCounterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  profilePicBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(245,158,11,0.9)', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  profilePicBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  thumbnailRow: { gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.bgCard, flexDirection: 'row' },
  thumbnailWrap: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', borderWidth: 2.5, borderColor: 'transparent', position: 'relative' },
  thumbnailWrapActive: { borderColor: colors.amber },
  thumbnail: { width: '100%', height: '100%', overflow: 'hidden' },
  thumbnailBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(245,158,11,0.85)', alignItems: 'center', paddingVertical: 2 },
  thumbnailBadgeText: { fontSize: 8, color: '#FFFFFF', fontWeight: '800' },
  heroPhoto: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: 320, backgroundColor: colors.amberDim, alignItems: 'center', justifyContent: 'center' },
  onlineIndicator: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#10B981' },
  onlineText: { fontSize: 11, color: '#FFFFFF', fontWeight: '600' },
  nameSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  petName: { fontSize: 34, fontWeight: '900', color: colors.textPrimary, letterSpacing: -1 },
  petBreed: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  chatBtn: { backgroundColor: colors.amberDim, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.amber },
  chatBtnText: { color: colors.amber, fontSize: 13, fontWeight: '700' },
  energyWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 14 },
  energyTrack: { flexDirection: 'row', gap: 4, flex: 1 },
  energySeg: { flex: 1, height: 6, borderRadius: 3 },
  energyLabel: { fontSize: 12, fontWeight: '700', width: 90 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, overflow: 'hidden', borderWidth: 0.5 },
  badgeIcon: { fontSize: 13 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  section: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.bgCard, borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.bgBorder, overflow: 'hidden' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: colors.bgBorder },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoRowIcon: { fontSize: 16, width: 24 },
  infoRowLabel: { fontSize: 13, color: colors.textMuted },
  infoRowValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '500', maxWidth: '55%', textAlign: 'right' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14 },
  tag: { backgroundColor: colors.bgBorder, borderRadius: 20, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  noteCard: { margin: 14, backgroundColor: colors.bg, borderRadius: 10, overflow: 'hidden', padding: 14, borderWidth: 0.5, borderColor: colors.bgBorder },
  noteCardText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  ifFoundCard: { margin: 14, backgroundColor: colors.emergencyDim, borderRadius: 10, overflow: 'hidden', padding: 14, borderWidth: 0.5, borderColor: colors.emergency + '60' },
  ifFoundText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  shareProfileBtn: { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.communityDim, borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: colors.community, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  shareProfileBtnText: { color: colors.community, fontWeight: '600', fontSize: 13 },
  lostBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.emergencyDim, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.emergency, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 4 },
  lostBannerDot: { width: 10, height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.emergency },
  lostBannerTitle: { fontSize: 15, fontWeight: '800', color: colors.emergency, marginBottom: 2 },
  lostBannerSub: { fontSize: 12, color: colors.textMuted },
  reportFoundBtn: { marginHorizontal: 16, marginTop: 8, marginBottom: 4, backgroundColor: colors.safeDim, borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.safe, paddingVertical: 16, alignItems: 'center' },
  reportFoundBtnText: { color: colors.safe, fontWeight: '800', fontSize: 15 },
  lostBtn: { marginHorizontal: 16, marginTop: 8, backgroundColor: colors.emergencyDim, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.emergency, paddingVertical: 14, alignItems: 'center' },
  lostBtnText: { color: colors.emergency, fontWeight: '700', fontSize: 14 },
});
