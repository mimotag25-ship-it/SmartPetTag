import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Image, RefreshControl, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../lib/design';
import { useLanguage, t } from '../../lib/i18n';

const POST_TYPES = [
  { key: 'checkin', label: t('checkin'), icon: '📍', color: colors.safe },
  { key: 'lost', label: t('lost'), icon: '🚨', color: colors.emergency },
  { key: 'spotted', label: t('spotted'), icon: '👀', color: colors.amber },
  { key: 'event', label: t('event'), icon: '🎉', color: colors.community },
  { key: 'warning', label: t('warning'), icon: '⚠️', color: '#F97316' },
];

function getTypeConfig(type) {
  switch(type) {
    case 'lost': return { border: colors.emergency, bg: colors.emergencyDim, label: '🚨 ' + t('lost').toUpperCase(), labelColor: colors.emergency };
    case 'spotted': return { border: colors.amber, bg: colors.amberDim, label: '👀 ' + t('spotted').toUpperCase(), labelColor: colors.amber };
    case 'event': return { border: colors.community, bg: colors.communityDim, label: '🎉 ' + t('event').toUpperCase(), labelColor: colors.community };
    case 'checkin': return { border: colors.safe, bg: colors.safeDim, label: '📍 ' + t('checkin').toUpperCase(), labelColor: colors.safe };
    case 'warning': return { border: '#F97316', bg: '#1C0E07', label: '⚠️ ' + t('warning').toUpperCase(), labelColor: '#F97316' };
    default: return { border: colors.bgBorder, bg: colors.bgCard, label: null, labelColor: null };
  }
}

function Post({ post }) {
  const [pawned, setPawned] = useState(false);
  const [paws, setPaws] = useState(post.paws || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t } = useLanguage();
  const typeConfig = getTypeConfig(post.type);

  function handlePaw() {
    if (pawned) return;
    setPawned(true);
    setPaws(p => p + 1);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    supabase.from('paws').insert({ post_id: post.id, user_id: 'anon' });
    supabase.from('posts').update({ paws: paws + 1 }).eq('id', post.id);
  }

  async function loadComments() {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at');
    if (data) setComments(data);
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    await supabase.from('comments').insert({ post_id: post.id, author: post.dog_name || 'Athena', text: commentText });
    setCommentText('');
    loadComments();
  }

  function getTimeAgo(ts) {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
  }

  return (
    <View style={[styles.post, { borderColor: typeConfig.border + '60', backgroundColor: typeConfig.bg }]}>
      {typeConfig.label && (
        <View style={[styles.postTypeBadge, { backgroundColor: typeConfig.border + '20' }]}>
          <Text style={[styles.postTypeBadgeText, { color: typeConfig.labelColor }]}>{typeConfig.label}</Text>
        </View>
      )}
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          {post.dog_photo ? (
            <Image source={{ uri: post.dog_photo }} style={styles.postAvatarPhoto} />
          ) : (
            <Text style={styles.postAvatarEmoji}>{post.emoji || '🐾'}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.postMeta}>
            <Text style={styles.postDogName}>{post.dog_name || 'Athena'}</Text>
            {post.breed && <View style={styles.breedBadge}><Text style={styles.breedBadgeText}>{post.breed}</Text></View>}
            {post.energy && (
              <View style={{ flexDirection: 'row', gap: 2 }}>
                {[1,2,3,4,5].map(i => (
                  <View key={i} style={{ width: 8, height: 4, borderRadius: 1, backgroundColor: i <= post.energy ? colors.amber : colors.bgBorder }} />
                ))}
              </View>
            )}
          </View>
          <View style={styles.postSubMeta}>
            <Text style={styles.postOwner}>by {post.owner_name || 'liliana.gutierrez'}</Text>
            {post.location && <Text style={styles.postLocation}>📍 {post.location}</Text>}
            <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
          </View>
        </View>
      </View>

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}

      {post.text && <Text style={styles.postText}>{post.text}</Text>}

      {post.tags && (
        <View style={styles.postTags}>
          {post.tags.split(',').map((tag, i) => (
            <View key={i} style={styles.postTag}>
              <Text style={styles.postTagText}>{tag.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.postAction} onPress={handlePaw}>
          <Animated.Text style={[styles.postActionIcon, { transform: [{ scale: scaleAnim }] }]}>
            {pawned ? '🐾' : '🤍'}
          </Animated.Text>
          <Text style={[styles.postActionText, pawned && { color: colors.amber }]}>{paws} {t('paws')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction} onPress={() => { setShowComments(!showComments); if (!showComments) loadComments(); }}>
          <Text style={styles.postActionIcon}>💬</Text>
          <Text style={styles.postActionText}>{t('comments')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postAction}>
          <Text style={styles.postActionIcon}>↗️</Text>
          <Text style={styles.postActionText}>{t('share')}</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsWrap}>
          {comments.map((c, i) => (
            <View key={i} style={styles.comment}>
              <Text style={styles.commentAuthor}>{c.author}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentBox}
              placeholder={t('commentAs') + ' Athena...'}
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity style={styles.commentSend} onPress={submitComment}>
              <Text style={styles.commentSendText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function AlertCard({ alert }) {
  function getTimeAgo(ts) {
    const mins = Math.floor((new Date() - new Date(ts)) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertCardHeader}>
        <View style={styles.alertPulse} />
        <Text style={styles.alertCardTitle}>{t('emergencyLostDog')}</Text>
        <Text style={styles.alertCardTime}>{getTimeAgo(alert.created_at)}</Text>
      </View>
      <View style={styles.alertCardBody}>
        <View style={styles.alertAvatar}>
          {alert.dog_photo ? (
            <Image source={{ uri: alert.dog_photo }} style={styles.alertAvatarPhoto} />
          ) : (
            <Text style={{ fontSize: 24 }}>🐕</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertDogName}>{alert.dog_name}</Text>
          <Text style={styles.alertLocation}>📍 {alert.neighbourhood}</Text>
          <Text style={styles.alertOwner}>Owner: {alert.owner_name} · {alert.owner_phone}</Text>
        </View>
      </View>
      <View style={styles.alertCardActions}>
        <TouchableOpacity
          style={styles.foundBtn}
          onPress={() => router.push({ pathname: '/found', params: { alertId: alert.id, dogName: alert.dog_name, ownerName: alert.owner_name, ownerPhone: alert.owner_phone, neighbourhood: alert.neighbourhood } })}
        >
          <Text style={styles.foundBtnText}>🙋 {t('iFoundThisDog')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>↗ {t('share')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const [alerts, setAlerts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [postType, setPostType] = useState('checkin');
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [posting, setPosting] = useState(false);
  const [feedMode, setFeedMode] = useState('feed');
  const [refreshing, setRefreshing] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    await Promise.all([loadAlerts(), loadPosts()]);
  }

  async function loadAlerts() {
    const { data } = await supabase.from('lost_alerts').select('*').eq('status', 'lost').order('created_at', { ascending: false });
    if (data) setAlerts(data);
  }

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setPosts(data);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!result.canceled) setPostImage(result.assets[0].uri);
  }

  async function submitPost() {
    if (!postText.trim() && !postImage) return;
    setPosting(true);
    let imageUrl = null;
    if (postImage) {
      try {
        const response = await fetch(postImage);
        const blob = await response.blob();
        const fileName = `post-${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
        if (!error) {
          const { data } = supabase.storage.from('posts').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      } catch (e) {}
    }
    await supabase.from('posts').insert({
      type: postType, text: postText, image: imageUrl,
      dog_name: 'Athena', owner_name: 'liliana.gutierrez',
      location: 'Portales, CDMX', paws: 0,
    });
    setPostText(''); setPostImage(null); setShowComposer(false); setPosting(false);
    loadPosts();
  }

  return (
    <View style={[styles.container, { key: lang }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🐾 {t('community')}</Text>
        <TouchableOpacity style={styles.newPostBtn} onPress={() => setShowComposer(!showComposer)}>
          <Text style={styles.newPostBtnText}>{showComposer ? '✕' : '+ ' + t('newPost')}</Text>
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, feedMode === 'feed' && styles.modeBtnActive]}
          onPress={() => setFeedMode('feed')}
        >
          <Text style={[styles.modeBtnText, feedMode === 'feed' && styles.modeBtnTextActive]}>📸 {t('feed')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, feedMode === 'nearby' && styles.modeBtnActive]}
          onPress={() => setFeedMode('nearby')}
        >
          <Text style={[styles.modeBtnText, feedMode === 'nearby' && styles.modeBtnTextActive]}>🗺️ {t('nearMe')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.amber} />}
      >
        {/* Composer */}
        {showComposer && (
          <View style={styles.composer}>
            <Text style={styles.composerTitle}>{t('newPostAs')} Athena 🐾</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
              {POST_TYPES.map(pt => (
                <TouchableOpacity
                  key={pt.key}
                  style={[styles.typeBtn, postType === pt.key && { backgroundColor: pt.color + '20', borderColor: pt.color }]}
                  onPress={() => setPostType(pt.key)}
                >
                  <Text style={styles.typeBtnIcon}>{pt.icon}</Text>
                  <Text style={[styles.typeBtnText, postType === pt.key && { color: pt.color }]}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              {postImage ? (
                <Image source={{ uri: postImage }} style={styles.pickedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderIcon}>📷</Text>
                  <Text style={styles.imagePlaceholderText}>{t('tapAddPhoto')}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder={t('whatsUpTo')}
              placeholderTextColor={colors.textMuted}
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            <View style={styles.composerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowComposer(false)}>
                <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sharePostBtn} onPress={submitPost} disabled={posting}>
                <Text style={styles.sharePostBtnText}>{posting ? t('posting') : t('sharePost')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Active alerts */}
        {alerts.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{t('activeAlertsNearYou')}</Text>
              <View style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>{alerts.length}</Text></View>
            </View>
            {alerts.map(a => <AlertCard key={a.id} alert={a} />)}
          </View>
        )}

        {/* Posts */}
        <View style={styles.postsSection}>
          {posts.length === 0 ? (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedEmoji}>🐾</Text>
              <Text style={styles.emptyFeedTitle}>No posts yet</Text>
              <Text style={styles.emptyFeedSub}>Be the first to share something with the community</Text>
            </View>
          ) : (
            posts.map(post => <Post key={post.id} post={post} />)
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingTop: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  newPostBtn: { backgroundColor: colors.amberDim, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.amber },
  newPostBtnText: { color: colors.amber, fontSize: 13, fontWeight: '700' },

  modeToggle: { flexDirection: 'row', marginHorizontal: spacing.xl, marginBottom: 16, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: 4, borderWidth: 0.5, borderColor: colors.bgBorder },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md },
  modeBtnActive: { backgroundColor: colors.amber },
  modeBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  modeBtnTextActive: { color: colors.bg },

  composer: { marginHorizontal: spacing.xl, marginBottom: 20, backgroundColor: colors.bgCard, borderRadius: radius.xl, borderWidth: 0.5, borderColor: colors.bgBorder, padding: 16 },
  composerTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.bgBorder, borderWidth: 0.5, borderColor: colors.bgBorder },
  typeBtnIcon: { fontSize: 14 },
  typeBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  imagePickerBtn: { borderRadius: radius.lg, overflow: 'hidden', marginBottom: 10, height: 160, backgroundColor: colors.bg, borderWidth: 0.5, borderColor: colors.bgBorder },
  pickedImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePlaceholderIcon: { fontSize: 32 },
  imagePlaceholderText: { fontSize: 13, color: colors.textMuted },
  textInput: { backgroundColor: colors.bg, borderRadius: radius.md, padding: 12, fontSize: 14, color: colors.textPrimary, borderWidth: 0.5, borderColor: colors.bgBorder, minHeight: 60, textAlignVertical: 'top', marginBottom: 10 },
  composerActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.bgBorder },
  cancelBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  sharePostBtn: { flex: 2, paddingVertical: 11, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.amber },
  sharePostBtnText: { color: colors.bg, fontSize: 14, fontWeight: '800' },

  alertSection: { paddingHorizontal: spacing.xl, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emergency },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.textMuted, letterSpacing: 1.5, flex: 1 },
  sectionBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.emergency, alignItems: 'center', justifyContent: 'center' },
  sectionBadgeText: { fontSize: 10, color: colors.white, fontWeight: '700' },

  alertCard: { backgroundColor: colors.emergencyDim, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.emergency + '60', padding: 14, marginBottom: 10, ...shadows.emergency },
  alertCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  alertPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency },
  alertCardTitle: { fontSize: 12, fontWeight: '800', color: colors.emergency, flex: 1, letterSpacing: 0.5 },
  alertCardTime: { fontSize: 11, color: colors.textMuted },
  alertCardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  alertAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.emergencyDim, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.emergency },
  alertAvatarPhoto: { width: 52, height: 52, borderRadius: 26 },
  alertDogName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  alertLocation: { fontSize: 12, color: colors.textSecondary, marginBottom: 2 },
  alertOwner: { fontSize: 11, color: colors.textMuted },
  alertCardActions: { flexDirection: 'row', gap: 8 },
  foundBtn: { flex: 2, backgroundColor: colors.emergency, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center' },
  foundBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  shareBtn: { flex: 1, backgroundColor: colors.emergencyDim, borderRadius: radius.md, paddingVertical: 11, alignItems: 'center', borderWidth: 0.5, borderColor: colors.emergency },
  shareBtnText: { color: colors.emergency, fontWeight: '600', fontSize: 13 },

  postsSection: { paddingHorizontal: spacing.xl },
  post: { borderRadius: radius.xl, borderWidth: 0.5, padding: 14, marginBottom: 14, overflow: 'hidden' },
  postTypeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, marginBottom: 10 },
  postTypeBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  postHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  postAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.amber },
  postAvatarPhoto: { width: 44, height: 44, borderRadius: 22 },
  postAvatarEmoji: { fontSize: 22 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  postDogName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  breedBadge: { backgroundColor: colors.amberDim, borderWidth: 0.5, borderColor: colors.amber, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  breedBadgeText: { fontSize: 9, color: colors.amber, fontWeight: '700' },
  postSubMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postOwner: { fontSize: 11, color: colors.textMuted },
  postLocation: { fontSize: 11, color: colors.textMuted },
  postTime: { fontSize: 11, color: colors.textMuted },
  postImage: { width: '100%', height: 200, borderRadius: radius.lg, marginBottom: 10 },
  postText: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  postTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  postTag: { backgroundColor: colors.bgBorder, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  postTagText: { fontSize: 11, color: colors.textMuted },
  postActions: { flexDirection: 'row', gap: 0, borderTopWidth: 0.5, borderTopColor: colors.bgBorder, paddingTop: 10 },
  postAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  postActionIcon: { fontSize: 16 },
  postActionText: { fontSize: 12, color: colors.textMuted },
  commentsWrap: { borderTopWidth: 0.5, borderTopColor: colors.bgBorder, paddingTop: 10, marginTop: 4 },
  comment: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  commentAuthor: { fontSize: 12, fontWeight: '700', color: colors.amber },
  commentText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  commentInput: { flexDirection: 'row', gap: 8, marginTop: 6 },
  commentBox: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, color: colors.textPrimary, borderWidth: 0.5, borderColor: colors.bgBorder },
  commentSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  commentSendText: { color: colors.bg, fontSize: 16, fontWeight: '700' },

  emptyFeed: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyFeedEmoji: { fontSize: 48 },
  emptyFeedTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyFeedSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
