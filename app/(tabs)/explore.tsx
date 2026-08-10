import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, RefreshControl } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, shadows } from '../../lib/design';
import { useLanguage } from '../../lib/i18n';

const POST_TYPES = [
  { key: 'spotted', label: 'Spotted', icon: '👀', color: '#F59E0B' },
  { key: 'warning', label: 'Warning', icon: '⚠️', color: '#F97316' },
  { key: 'lost', label: 'Lost', icon: '🚨', color: '#EF4444' },
];

function timeAgo(ts) {
  const mins = Math.floor((new Date() - new Date(ts)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function PostCard({ post, lang }) {
  const typeColors = {
    spotted: { bg: '#FFFBEB', border: '#F59E0B', label: '👀 SPOTTED', color: '#D97706' },
    warning: { bg: '#FFF7ED', border: '#F97316', label: '⚠️ WARNING', color: '#EA580C' },
    lost: { bg: '#FFF1F1', border: '#EF4444', label: '🚨 LOST', color: '#DC2626' },
  };
  const cfg = typeColors[post.type] || { bg: '#F8FAFC', border: '#E2E8F0', label: null, color: '#64748B' };

  return (
    <View style={[s.post, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      {cfg.label && (
        <View style={[s.postBadge, { backgroundColor: cfg.border + '20' }]}>
          <Text style={[s.postBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      )}
      <View style={s.postHeader}>
        <View style={s.postAvatar}>
          <Text style={{ fontSize: 20 }}>🐾</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.postDogName}>{post.dog_name || 'Anonymous'}</Text>
          <View style={s.postMeta}>
            {post.owner_name && <Text style={s.postOwner}>by {post.owner_name}</Text>}
            {post.location && <Text style={s.postLocation}>📍 {post.location}</Text>}
            <Text style={s.postTime}>{timeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>
      {post.text && <Text style={s.postText}>{post.text}</Text>}
      {post.image_url && (
        <Image source={{ uri: post.image_url }} style={s.postImage} resizeMode="cover" />
      )}
      {post.type === 'lost' && (
        <TouchableOpacity
          style={s.helpBtn}
          onPress={() => router.push({ pathname: '/found', params: { dogName: post.dog_name, ownerName: post.owner_name } })}
        >
          <Text style={s.helpBtnText}>🙋 {lang === 'es' ? 'Encontré a esta mascota' : 'I found this pet'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CommunityScreen() {
  const [posts, setPosts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState('all');
  const [showComposer, setShowComposer] = useState(false);
  const [postType, setPostType] = useState('spotted');
  const [postText, setPostText] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [posting, setPosting] = useState(false);
  const [currentDog, setCurrentDog] = useState(null);
  const { lang } = useLanguage();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadPosts(), loadAlerts(), loadCurrentDog()]);
    setLoading(false);
  }

  async function loadPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setPosts(data);
  }

  async function loadAlerts() {
    const { data } = await supabase
      .from('lost_alerts')
      .select('*')
      .eq('status', 'lost')
      .order('created_at', { ascending: false });
    if (data) setAlerts(data);
  }

  async function loadCurrentDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('dogs').select('*').eq('owner_email', user.email).limit(1);
    if (data?.[0]) setCurrentDog(data[0]);
  }

  async function submitPost() {
    if (!postText.trim()) return;
    setPosting(true);
    await supabase.from('posts').insert({
      type: postType,
      text: postText,
      dog_name: currentDog?.name || lang === 'es' ? 'Anónimo' : 'Anonymous',
      owner_name: currentDog?.owner_name || '',
      location: postLocation || currentDog?.neighbourhood || 'CDMX',
      paws: 0,
    });
    setPostText('');
    setPostLocation('');
    setShowComposer(false);
    setPosting(false);
    loadPosts();
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  const displayPosts = feedMode === 'nearby'
    ? posts.filter(p => ['warning', 'spotted'].includes(p.type))
    : posts;

  if (loading) return (
    <View style={s.loader}>
      <Text style={{ fontSize: 32 }}>🐾</Text>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{lang === 'es' ? 'Comunidad' : 'Community'}</Text>
        <TouchableOpacity style={s.newPostBtn} onPress={() => setShowComposer(!showComposer)}>
          <Text style={s.newPostBtnText}>{showComposer ? '✕' : '+ ' + (lang === 'es' ? 'Publicar' : 'Post')}</Text>
        </TouchableOpacity>
      </View>

      {/* Feed mode tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, feedMode === 'all' && s.tabActive]} onPress={() => setFeedMode('all')}>
          <Text style={[s.tabText, feedMode === 'all' && s.tabTextActive]}>{lang === 'es' ? 'Todo' : 'All'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, feedMode === 'nearby' && s.tabActive]} onPress={() => setFeedMode('nearby')}>
          <Text style={[s.tabText, feedMode === 'nearby' && s.tabTextActive]}>📍 {lang === 'es' ? 'Cerca' : 'Nearby'}</Text>
        </TouchableOpacity>
      </View>

      {/* Post composer */}
      {showComposer && (
        <View style={s.composer}>
          <View style={s.typeRow}>
            {POST_TYPES.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.typeBtn, postType === t.key && { backgroundColor: t.color + '20', borderColor: t.color }]}
                onPress={() => setPostType(t.key)}
              >
                <Text style={s.typeBtnIcon}>{t.icon}</Text>
                <Text style={[s.typeBtnText, postType === t.key && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={s.composerInput}
            placeholder={lang === 'es' ? '¿Qué está pasando?' : "What's happening?"}
            placeholderTextColor="#94A3B8"
            value={postText}
            onChangeText={setPostText}
            multiline
          />
          <TextInput
            style={[s.composerInput, { marginTop: 8 }]}
            placeholder={lang === 'es' ? '📍 Ubicación' : '📍 Location'}
            placeholderTextColor="#94A3B8"
            value={postLocation}
            onChangeText={setPostLocation}
          />
          <TouchableOpacity
            style={[s.submitBtn, (!postText.trim() || posting) && { opacity: 0.5 }]}
            onPress={submitPost}
            disabled={!postText.trim() || posting}
          >
            <Text style={s.submitBtnText}>{posting ? (lang === 'es' ? 'Publicando...' : 'Posting...') : (lang === 'es' ? 'Publicar' : 'Share')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      >
        {/* Active alerts */}
        {alerts.length > 0 && (
          <View style={s.alertsSection}>
            <Text style={s.sectionLabel}>🚨 {lang === 'es' ? 'ALERTAS ACTIVAS' : 'ACTIVE ALERTS'}</Text>
            {alerts.map(alert => (
              <TouchableOpacity
                key={alert.id}
                style={s.alertCard}
                onPress={() => router.push({ pathname: '/found', params: { alertId: alert.id, dogName: alert.dog_name, ownerName: alert.owner_name, ownerPhone: alert.owner_phone, neighbourhood: alert.neighbourhood } })}
              >
                <View style={s.alertCardLeft}>
                  {alert.dog_photo
                    ? <Image source={{ uri: alert.dog_photo }} style={s.alertPhoto} resizeMode="cover" />
                    : <View style={s.alertPhotoPlaceholder}><Text style={{ fontSize: 20 }}>🐾</Text></View>
                  }
                  <View style={{ flex: 1 }}>
                    <Text style={s.alertName}>{alert.dog_name} {lang === 'es' ? 'está perdido' : 'is lost'}</Text>
                    <Text style={s.alertLocation}>📍 {alert.neighbourhood}</Text>
                  </View>
                </View>
                <View style={s.helpTag}>
                  <Text style={s.helpTagText}>{lang === 'es' ? 'Ayudar' : 'Help'} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Posts */}
        <View style={s.postsSection}>
          {displayPosts.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>🐾</Text>
              <Text style={s.emptyTitle}>{lang === 'es' ? 'Sin publicaciones aún' : 'No posts yet'}</Text>
              <Text style={s.emptySub}>{lang === 'es' ? 'Sé el primero en publicar algo' : 'Be the first to post something'}</Text>
            </View>
          ) : (
            displayPosts.map(post => <PostCard key={post.id} post={post} lang={lang} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  newPostBtn: { backgroundColor: '#F59E0B', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  newPostBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9' },
  tabActive: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#F59E0B' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#D97706' },
  composer: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeBtnIcon: { fontSize: 14 },
  typeBtnText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  composerInput: { backgroundColor: '#F8FAFC', borderWidth: 0.5, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0F172A', minHeight: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  alertsSection: { padding: 16, paddingBottom: 0 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 1.5, marginBottom: 10 },
  alertCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF1F1', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginBottom: 8 },
  alertCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  alertPhoto: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#EF4444' },
  alertPhotoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  alertName: { fontSize: 14, fontWeight: '700', color: '#EF4444', marginBottom: 2 },
  alertLocation: { fontSize: 12, color: '#64748B' },
  helpTag: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  helpTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  postsSection: { padding: 16, gap: 12 },
  post: { borderRadius: 16, borderWidth: 1, padding: 14, ...shadows.sm },
  postBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 10 },
  postBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 8 },
  postAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FCD34D' },
  postDogName: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  postMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  postOwner: { fontSize: 11, color: '#64748B' },
  postLocation: { fontSize: 11, color: '#64748B' },
  postTime: { fontSize: 11, color: '#94A3B8' },
  postText: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 8 },
  postImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 8 },
  helpBtn: { backgroundColor: '#ECFDF5', borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#10B981' },
  helpBtnText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },
});
