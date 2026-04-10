import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { resolveAlert } from '../../lib/alerts';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const IS_WEB = width > 768;
const ACCENT = '#00D4AA';
const ACCENT_DIM = '#003d30';

const STORIES = [
  { id: 1, name: 'your story', emoji: '🐕', isYou: true },
  { id: 2, name: 'Luna', emoji: '🐩' },
  { id: 3, name: 'Rocky', emoji: '🐾' },
  { id: 4, name: 'Coco', emoji: '🐕' },
  { id: 5, name: 'Max', emoji: '🦮' },
  { id: 6, name: 'Bella', emoji: '🐶' },
  { id: 7, name: 'Thor', emoji: '🐕‍🦺' },
];

const POST_TYPES = [
  { key: 'checkin', label: 'Check-in', icon: '📍', color: '#00D4AA' },
  { key: 'lost', label: 'Lost', icon: '🚨', color: '#C0392B' },
  { key: 'spotted', label: 'Spotted', icon: '👀', color: '#F5A623' },
  { key: 'event', label: 'Event', icon: '🎉', color: '#5856D6' },
  { key: 'warning', label: 'Warning', icon: '⚠️', color: '#E67E22' },
];

const SUGGESTED = [
  { user: 'Luna', owner: 'ana.garcia', emoji: '🐩', breed: 'Poodle', energy: 4, tags: ['Playful', 'Social'] },
  { user: 'Rocky', owner: 'rodrigo.vega', emoji: '🐾', breed: 'French Bulldog', energy: 3, tags: ['Chill', 'Friendly'] },
  { user: 'Coco', owner: 'maria.lopez', emoji: '🐕', breed: 'Schnauzer', energy: 5, tags: ['Crazy', 'Loud'] },
  { user: 'Max', owner: 'carlos.m', emoji: '🦮', breed: 'Golden', energy: 5, tags: ['Gentle', 'Loves kids'] },
];

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home', route: '/(tabs)/explore' },
  { icon: '🔍', label: 'Search', route: null },
  { icon: '🗺️', label: 'Map', route: '/(tabs)/map' },
  { icon: '❤️', label: 'Activity', route: null },
  { icon: '➕', label: 'New post', route: null },
  { icon: '🐕', label: 'Profile', route: '/(tabs)/index' },
];

const DEMO_POSTS = [
  {
    id: 1, dog: 'Athena', owner: 'liliana.gutierrez', emoji: '🐕',
    breed: 'Labrador', energy: 5, tags: ['Friendly', 'Playful'],
    type: 'normal', image: null, location: 'Parque España, CDMX',
    caption: 'Sunday zoomies at the park 🌳 She ran for 2 hours straight.',
    paws: 142, time: '2 MIN AGO',
    comments: [
      { dog: 'Luna', user: 'ana.garcia', text: 'Athena is everything 😍', emoji: '🐩' },
      { dog: 'Rocky', user: 'rodrigo.vega', text: 'Goals 🐾🐾', emoji: '🐾' },
    ],
  },
  {
    id: 2, dog: 'Luna', owner: 'ana.garcia', emoji: '🐩',
    breed: 'Poodle', energy: 4, tags: ['Playful', 'Social'],
    type: 'spotted', image: null, location: 'Roma Norte, CDMX',
    caption: 'Spotted this queen near Álvaro Obregón. Anyone know this dog? No collar 👀',
    paws: 89, time: '5 HRS AGO',
    comments: [{ dog: 'Coco', user: 'maria.lopez', text: 'That looks like Mochi from Roma!', emoji: '🐕' }],
  },
  {
    id: 3, dog: 'Coco', owner: 'maria.lopez', emoji: '🐕',
    breed: 'Schnauzer', energy: 5, tags: ['Crazy', 'Loud'],
    type: 'event', image: null, location: 'Parque México, CDMX',
    caption: '🎉 Dog meetup this Sunday 10am at Parque México! All breeds welcome.',
    paws: 203, time: 'YESTERDAY',
    comments: [{ dog: 'Athena', user: 'liliana.gutierrez', text: 'We will be there!! 🐕', emoji: '🐕' }],
  },
];

function getTypeStyle(type) {
  switch(type) {
    case 'lost': return { border: '#C0392B', bg: '#1a0505', label: '🚨 LOST DOG', labelColor: '#C0392B' };
    case 'spotted': return { border: '#F5A623', bg: '#1a1200', label: '👀 SPOTTED', labelColor: '#F5A623' };
    case 'event': return { border: '#5856D6', bg: '#0d0b1a', label: '🎉 EVENT', labelColor: '#5856D6' };
    case 'checkin': return { border: '#00D4AA', bg: '#001a14', label: '📍 CHECK-IN', labelColor: '#00D4AA' };
    case 'warning': return { border: '#E67E22', bg: '#1a0e00', label: '⚠️ WARNING', labelColor: '#E67E22' };
    default: return { border: '#1a1a1a', bg: '#0d0d0d', label: null, labelColor: null };
  }
}

function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EnergyMeter({ level }) {
  return (
    <View style={emStyles.wrap}>
      {[1,2,3,4,5].map(i => (
        <View key={i} style={[emStyles.bar, i <= level && emStyles.barActive]} />
      ))}
    </View>
  );
}

const emStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  bar: { width: 4, height: 10, borderRadius: 2, backgroundColor: '#1a1a1a' },
  barActive: { backgroundColor: '#00D4AA' },
});

function AlertCard({ alert, onResolved }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function handleFound() {
    router.push({
      pathname: '/found',
      params: {
        alertId: alert.id,
        dogName: alert.dog_name,
        ownerName: alert.owner_name,
        ownerPhone: alert.owner_phone,
        neighbourhood: alert.neighbourhood,
      }
    });
  }

  if (resolved) {
    return (
      <View style={alertStyles.resolvedCard}>
        <Text style={alertStyles.resolvedEmoji}>🎉</Text>
        <View>
          <Text style={alertStyles.resolvedTitle}>{alert.dog_name} has been found!</Text>
          <Text style={alertStyles.resolvedSub}>Thank you for helping the community 🐾</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={alertStyles.card}>
      <View style={alertStyles.header}>
        <Animated.View style={[alertStyles.pulsingDot, { transform: [{ scale: pulseAnim }] }]} />
        <Text style={alertStyles.headerText}>🚨 EMERGENCY — LOST DOG</Text>
        <Text style={alertStyles.timeText}>{getTimeAgo(alert.created_at)}</Text>
      </View>
      <View style={alertStyles.dogRow}>
        <View style={alertStyles.dogAvatar}>
          {alert.dog_photo
            ? <Image source={{ uri: alert.dog_photo }} style={alertStyles.dogPhoto} />
            : <Text style={alertStyles.dogEmoji}>🐕</Text>
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={alertStyles.dogName}>{alert.dog_name}</Text>
          <Text style={alertStyles.dogLocation}>📍 Last seen: {alert.neighbourhood}</Text>
          <Text style={alertStyles.ownerText}>Owner: {alert.owner_name} · {alert.owner_phone}</Text>
        </View>
      </View>
      <View style={alertStyles.actionRow}>
        <TouchableOpacity
          style={[alertStyles.foundBtn, resolving && { opacity: 0.6 }]}
          onPress={handleFound}
          disabled={resolving}
        >
          <Text style={alertStyles.foundBtnText}>
            {resolving ? 'Resolving...' : '🙋 I Found This Dog'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={alertStyles.shareBtn}>
          <Text style={alertStyles.shareBtnText}>↗ Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const alertStyles = StyleSheet.create({
  card: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#1a0505', borderRadius: 16, borderWidth: 1.5, borderColor: '#C0392B', overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#C0392B22', paddingHorizontal: 14, paddingVertical: 10 },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C0392B' },
  headerText: { color: '#C0392B', fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  timeText: { color: '#C0392B', fontSize: 10, opacity: 0.7 },
  dogRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  dogAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2a0a0a', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#C0392B' },
  dogEmoji: { fontSize: 26 },
  dogPhoto: { width: 48, height: 48, borderRadius: 24 },
  dogName: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  dogLocation: { fontSize: 12, color: '#888', marginBottom: 2 },
  ownerText: { fontSize: 11, color: '#666' },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  foundBtn: { flex: 1, backgroundColor: '#C0392B', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  foundBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  shareBtn: { backgroundColor: '#2a0a0a', borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#C0392B' },
  shareBtnText: { color: '#C0392B', fontWeight: '600', fontSize: 13 },
  resolvedCard: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#051a10', borderRadius: 16, borderWidth: 1.5, borderColor: '#1D9E75', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  resolvedEmoji: { fontSize: 32 },
  resolvedTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  resolvedSub: { fontSize: 12, color: '#1D9E75' },
});

function Post({ post }) {
  const [pawned, setPawned] = useState(false);
  const [paws, setPaws] = useState(post.paws);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments);
  const [saved, setSaved] = useState(false);
  const lastTap = useRef(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;
  const typeStyle = getTypeStyle(post.type);

  function handleDoubleTap() {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!pawned) { setPawned(true); setPaws(p => p + 1); }
      Animated.sequence([
        Animated.parallel([
          Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }),
          Animated.timing(heartOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(heartScale, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(heartOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    }
    lastTap.current = now;
  }

  function submitComment() {
    if (!commentText.trim()) return;
    setComments(c => [...c, { dog: 'Athena', user: 'liliana.gutierrez', text: commentText, emoji: '🐕' }]);
    setCommentText('');
  }

  return (
    <View style={[styles.post, { borderColor: typeStyle.border, backgroundColor: typeStyle.bg }]}>
      {typeStyle.label && (
        <View style={[styles.typeLabel, { backgroundColor: typeStyle.border + '22' }]}>
          <Text style={[styles.typeLabelText, { color: typeStyle.labelColor }]}>{typeStyle.label}</Text>
        </View>
      )}
      <View style={styles.postHeader}>
        <View style={[styles.storyRingSmall, { borderColor: typeStyle.border }]}>
          <View style={styles.postAvatarWrap}>
            <Text style={styles.postAvatarEmoji}>{post.emoji}</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.dogFirstName}>{post.dog}</Text>
            <Text style={styles.dogBreedBadge}>{post.breed}</Text>
            <EnergyMeter level={post.energy} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Text style={styles.byText}>by</Text>
            <Text style={styles.ownerText}>{post.owner}</Text>
            <Text style={styles.dotSep}>·</Text>
            <Text style={styles.locationText}>📍 {post.location}</Text>
          </View>
        </View>
      </View>
      <View style={styles.tagRow}>
        {post.tags.map((t, i) => (
          <View key={i} style={styles.tagPill}>
            <Text style={styles.tagPillText}>{t}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={styles.photoWrap}>
        {post.image ? (
          <Image source={{ uri: post.image }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: typeStyle.bg }]}>
            <Text style={styles.photoEmoji}>{post.emoji}</Text>
            <Text style={styles.photoCaption}>{post.caption}</Text>
          </View>
        )}
        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}>
          <Text style={{ fontSize: 80 }}>🐾</Text>
        </Animated.View>
      </TouchableOpacity>
      <View style={styles.postActions}>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity style={styles.pawBtn} onPress={() => { setPawned(!pawned); setPaws(p => pawned ? p - 1 : p + 1); }}>
            <Text style={styles.pawIcon}>{pawned ? '🐾' : '🤍'}</Text>
            <Text style={[styles.pawCount, pawned && { color: ACCENT }]}>{paws.toLocaleString()} paws</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => setShowComments(!showComments)}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{comments.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved(!saved)}>
          <Text style={styles.actionIcon}>{saved ? '🔖' : '📋'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.postBody}>
        {comments.length > 0 && (
          <TouchableOpacity onPress={() => setShowComments(!showComments)}>
            <Text style={styles.viewAll}>View all {comments.length} comments</Text>
          </TouchableOpacity>
        )}
        {showComments && comments.map((c, i) => (
          <View key={i} style={styles.commentRow}>
            <Text style={styles.commentEmoji}>{c.emoji}</Text>
            <Text style={styles.commentLine}>
              <Text style={styles.commentDog}>{c.dog} </Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </Text>
          </View>
        ))}
        <Text style={styles.timeText}>{post.time}</Text>
      </View>
      <View style={styles.commentInputWrap}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>🐕</Text>
        <TextInput
          style={styles.commentBox}
          placeholder="Comment as Athena..."
          placeholderTextColor="#333"
          value={commentText}
          onChangeText={setCommentText}
        />
        {commentText.trim() !== '' && (
          <TouchableOpacity onPress={submitComment}>
            <Text style={styles.postBtn}>Post</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [lostAlerts, setLostAlerts] = useState([]);
  const [nearbyActivity, setNearbyActivity] = useState([]);
  const [showComposer, setShowComposer] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [postType, setPostType] = useState('normal');
  const [uploading, setUploading] = useState(false);
  const [viewedStories, setViewedStories] = useState([]);
  const [feedMode, setFeedMode] = useState('feed');
  const [activeActivity, setActiveActivity] = useState(0);

  useEffect(() => {
    loadAlerts();
    loadActivity();
    const alertInterval = setInterval(loadAlerts, 30000);
    const activityInterval = setInterval(loadActivity, 60000);
    return () => { clearInterval(alertInterval); clearInterval(activityInterval); };
  }, []);

  async function loadAlerts() {
    const { data } = await supabase
      .from('lost_alerts')
      .select('*')
      .eq('status', 'lost')
      .order('created_at', { ascending: false });
    if (data) {
      setLostAlerts(data);
      if (data.length > 0) {
        const alertPills = data.map(a => ({
          id: 'alert-' + a.id,
          icon: '🚨',
          message: `Lost dog alert — ${a.neighbourhood}`,
          urgent: true,
        }));
        setNearbyActivity(prev => {
          const nonAlerts = prev.filter(p => !String(p.id).startsWith('alert-'));
          return [...alertPills, ...nonAlerts];
        });
      }
    }
  }

  async function loadActivity() {
    const { data } = await supabase
      .from('activity')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);
    if (data) {
      setNearbyActivity(prev => {
        const alerts = prev.filter(p => String(p.id).startsWith('alert-'));
        return [...alerts, ...data.map(a => ({ id: a.id, icon: a.icon, message: a.message, urgent: a.urgent }))];
      });
    }
  }

  function handleAlertResolved(alertId) {
    setLostAlerts(prev => prev.filter(a => a.id !== alertId));
    loadActivity();
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setNewImage(result.assets[0].uri);
  }

  async function uploadImage(uri) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `post-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) { console.log('Upload error:', e.message); return null; }
  }

  async function submitPost() {
    if (!newCaption.trim() && !newImage) return;
    setUploading(true);
    let imageUrl = null;
    if (newImage) imageUrl = await uploadImage(newImage);
    setPosts(p => [{
      id: Date.now(), dog: 'Athena', owner: 'liliana.gutierrez',
      emoji: '🐕', breed: 'Labrador', energy: 5,
      tags: ['Friendly', 'Playful'], type: postType,
      image: imageUrl || newImage, location: 'Portales, CDMX',
      caption: newCaption, paws: 0, time: 'JUST NOW', comments: [],
    }, ...p]);
    setNewCaption(''); setNewImage(null); setPostType('normal');
    setShowComposer(false); setUploading(false);
    await supabase.from('activity').insert({
      type: postType,
      icon: postType === 'lost' ? '🚨' : postType === 'spotted' ? '👀' : postType === 'event' ? '🎉' : '📸',
      message: `Athena posted in Portales`,
      neighbourhood: 'Portales', urgent: postType === 'lost',
    });
    loadActivity();
  }

  return (
    <View style={styles.container}>
      {IS_WEB && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarLogoWrap}>
            <Text style={styles.sidebarLogo}>🐾</Text>
            <Text style={styles.sidebarAppName}>SmartPet Tag</Text>
          </View>
          {NAV_ITEMS.map((item, i) => (
            <TouchableOpacity key={i} style={styles.navItem}
              onPress={() => {
                if (item.label === 'New post') setShowComposer(!showComposer);
                else if (item.route) router.push(item.route);
              }}>
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        <View style={styles.storiesWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingVertical: 12 }}>
            {STORIES.map(story => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={() => {
                  if (story.isYou) {
                    router.push({ pathname: '/story', params: { mode: 'create' } });
                  } else {
                    setViewedStories(v => [...v, story.id]);
                    router.push({ pathname: '/story', params: { mode: 'view', dogName: story.name } });
                  }
                }}
              >
                <View style={[styles.storyRing, viewedStories.includes(story.id) && styles.storyRingViewed]}>
                  <View style={styles.storyAvatarWrap}>
                    <Text style={styles.storyEmoji}>{story.emoji}</Text>
                    {story.isYou && <View style={styles.addBtn}><Text style={styles.addBtnText}>+</Text></View>}
                  </View>
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>{story.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {nearbyActivity.length > 0 && (
          <View style={styles.activityStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}>
              {nearbyActivity.map((a, i) => (
                <TouchableOpacity
                  key={a.id || i}
                  style={[styles.activityPill, activeActivity === i && styles.activityPillActive, a.urgent && styles.activityPillUrgent]}
                  onPress={() => setActiveActivity(i)}
                >
                  <Text style={styles.activityIcon}>{a.icon}</Text>
                  <Text style={[styles.activityText, activeActivity === i && styles.activityTextActive, a.urgent && styles.activityTextUrgent]}>{a.message}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeBtn, feedMode === 'feed' && styles.modeBtnActive]} onPress={() => setFeedMode('feed')}>
            <Text style={[styles.modeBtnText, feedMode === 'feed' && styles.modeBtnTextActive]}>📸 Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, feedMode === 'map' && styles.modeBtnActive]} onPress={() => setFeedMode('map')}>
            <Text style={[styles.modeBtnText, feedMode === 'map' && styles.modeBtnTextActive]}>🗺️ Near me</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hr} />

        {lostAlerts.length > 0 && (
          <View style={styles.alertSection}>
            <View style={styles.alertSectionHeader}>
              <View style={styles.alertSectionDot} />
              <Text style={styles.alertSectionTitle}>ACTIVE ALERTS NEAR YOU</Text>
              <Text style={styles.alertSectionCount}>{lostAlerts.length}</Text>
            </View>
            {lostAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} onResolved={handleAlertResolved} />
            ))}
          </View>
        )}

        {showComposer && (
          <View style={styles.composer}>
            <Text style={styles.composerTitle}>New post as Athena 🐕</Text>
            <View style={styles.postTypeRow}>
              {POST_TYPES.map(pt => (
                <TouchableOpacity key={pt.key}
                  style={[styles.postTypeBtn, postType === pt.key && { borderColor: pt.color, backgroundColor: pt.color + '22' }]}
                  onPress={() => setPostType(pt.key)}>
                  <Text style={styles.postTypeIcon}>{pt.icon}</Text>
                  <Text style={[styles.postTypeLabel, postType === pt.key && { color: pt.color }]}>{pt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {newImage ? (
                <Image source={{ uri: newImage }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerEmpty}>
                  <Text style={styles.imagePickerIcon}>📷</Text>
                  <Text style={styles.imagePickerText}>Tap to add a photo</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput style={styles.composerInput} placeholder="What's Athena up to?" placeholderTextColor="#333" value={newCaption} onChangeText={setNewCaption} multiline />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
              <TouchableOpacity onPress={() => { setShowComposer(false); setNewImage(null); setNewCaption(''); }}>
                <Text style={{ color: '#444', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareBtn, (!newCaption.trim() && !newImage) && { opacity: 0.3 }]}
                onPress={submitPost} disabled={(!newCaption.trim() && !newImage) || uploading}>
                <Text style={styles.shareBtnText}>{uploading ? 'Posting...' : 'Share'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {feedMode === 'map' && (
          <View style={styles.mapModePlaceholder}>
            <Text style={styles.mapModeEmoji}>🗺️</Text>
            <Text style={styles.mapModeTitle}>Live dog activity near you</Text>
            <Text style={styles.mapModeSub}>Switch to the Map tab to see real-time activity around Condesa and Roma</Text>
            <TouchableOpacity style={styles.mapModeBtn} onPress={() => router.push('/(tabs)/map')}>
              <Text style={styles.mapModeBtnText}>Open Dog Map</Text>
            </TouchableOpacity>
          </View>
        )}

        {feedMode === 'feed' && posts.map(post => <Post key={post.id} post={post} />)}
      </ScrollView>

      {IS_WEB && (
        <View style={styles.rightSidebar}>
          <View style={styles.accountRow}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/index')}>
              <View style={styles.accountAvatar}><Text style={{ fontSize: 22 }}>🐕</Text></View>
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.accountDog}>Athena</Text>
              <Text style={styles.accountOwner}>by liliana.gutierrez</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Nearby dogs</Text>
          {SUGGESTED.map((s, i) => (
            <View key={i} style={styles.suggestedRow}>
              <View style={styles.suggestedAvatar}><Text style={{ fontSize: 18 }}>{s.emoji}</Text></View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.suggestedDog}>{s.user}</Text>
                  <Text style={styles.suggestedBreedBadge}>{s.breed}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <EnergyMeter level={s.energy} />
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {s.tags.map((t, j) => <Text key={j} style={styles.suggestedTag}>{t}</Text>)}
                  </View>
                </View>
              </View>
              <TouchableOpacity><Text style={styles.followLink}>Follow</Text></TouchableOpacity>
            </View>
          ))}
          <Text style={styles.footer}>© 2026 SMARTPET TAG · MEXICO CITY</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508', flexDirection: 'row' },
  sidebar: { width: 240, backgroundColor: '#050508', borderRightWidth: 0.5, borderRightColor: '#111', paddingTop: 20, paddingHorizontal: 16 },
  sidebarLogoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28, paddingLeft: 4 },
  sidebarLogo: { fontSize: 28 },
  sidebarAppName: { fontSize: 18, fontWeight: '700', color: '#fff', fontStyle: 'italic' },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 14, color: '#666' },
  feed: { flex: 1, maxWidth: IS_WEB ? 520 : undefined },
  storiesWrap: { borderBottomWidth: 0.5, borderBottomColor: '#111' },
  storyItem: { alignItems: 'center', width: 64 },
  storyRing: { width: 64, height: 64, borderRadius: 32, padding: 2, borderWidth: 2, borderColor: ACCENT },
  storyRingViewed: { borderColor: '#222' },
  storyAvatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storyEmoji: { fontSize: 26 },
  addBtn: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#050508' },
  addBtnText: { color: '#050508', fontSize: 12, fontWeight: '700', lineHeight: 14 },
  storyLabel: { fontSize: 10, color: '#555', marginTop: 4, textAlign: 'center', width: 64 },
  activityStrip: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  activityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  activityPillActive: { borderColor: ACCENT, backgroundColor: ACCENT_DIM },
  activityPillUrgent: { borderColor: '#C0392B', backgroundColor: '#1a0505' },
  activityIcon: { fontSize: 13 },
  activityText: { fontSize: 11, color: '#444', maxWidth: 180 },
  activityTextActive: { color: ACCENT },
  activityTextUrgent: { color: '#C0392B' },
  modeToggle: { flexDirection: 'row', margin: 12, backgroundColor: '#0d0d0d', borderRadius: 12, borderWidth: 0.5, borderColor: '#1a1a1a', padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  modeBtnActive: { backgroundColor: ACCENT_DIM },
  modeBtnText: { fontSize: 13, color: '#444', fontWeight: '500' },
  modeBtnTextActive: { color: ACCENT },
  hr: { height: 0.5, backgroundColor: '#111' },
  alertSection: { paddingTop: 8 },
  alertSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  alertSectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C0392B' },
  alertSectionTitle: { fontSize: 10, fontWeight: '800', color: '#C0392B', letterSpacing: 1.5, flex: 1 },
  alertSectionCount: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#C0392B', color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 20 },
  post: { borderWidth: 0.5, borderRadius: 16, margin: 12, marginBottom: 6, overflow: 'hidden' },
  typeLabel: { paddingHorizontal: 14, paddingVertical: 6 },
  typeLabelText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  storyRingSmall: { width: 42, height: 42, borderRadius: 21, padding: 2, borderWidth: 1.5 },
  postAvatarWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  postAvatarEmoji: { fontSize: 18 },
  dogFirstName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dogBreedBadge: { fontSize: 10, color: ACCENT, backgroundColor: ACCENT_DIM, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, fontWeight: '600' },
  byText: { fontSize: 11, color: '#333' },
  ownerText: { fontSize: 11, color: '#555' },
  dotSep: { color: '#333', fontSize: 11 },
  locationText: { fontSize: 11, color: '#444' },
  tagRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingBottom: 8, flexWrap: 'wrap' },
  tagPill: { backgroundColor: '#111', borderWidth: 0.5, borderColor: '#222', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  tagPillText: { fontSize: 10, color: '#555' },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 1 },
  photoPlaceholder: { width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  photoEmoji: { fontSize: 80, marginBottom: 16 },
  photoCaption: { color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  heartOverlay: { position: 'absolute', top: '38%', left: '38%' },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  pawBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pawIcon: { fontSize: 22 },
  pawCount: { fontSize: 13, color: '#555', fontWeight: '500' },
  actionIconBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 20 },
  actionCount: { fontSize: 12, color: '#555' },
  postBody: { paddingHorizontal: 12, paddingBottom: 8 },
  viewAll: { color: '#444', fontSize: 12, marginBottom: 6 },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 4 },
  commentEmoji: { fontSize: 13, marginTop: 1 },
  commentLine: { flex: 1, fontSize: 12, lineHeight: 18 },
  commentDog: { color: '#fff', fontWeight: '600' },
  commentText: { color: '#666' },
  timeText: { color: '#333', fontSize: 10, letterSpacing: 0.5, marginTop: 6 },
  commentInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#111' },
  commentBox: { flex: 1, color: '#fff', fontSize: 13 },
  postBtn: { color: ACCENT, fontWeight: '600', fontSize: 13 },
  composer: { backgroundColor: '#0d0d0d', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#111', margin: 12, borderRadius: 16, borderWidth: 0.5, borderColor: '#1a1a1a' },
  composerTitle: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 12 },
  postTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  postTypeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, borderWidth: 0.5, borderColor: '#1a1a1a', backgroundColor: '#111', gap: 2 },
  postTypeIcon: { fontSize: 16 },
  postTypeLabel: { fontSize: 10, color: '#555', fontWeight: '600' },
  imagePicker: { width: '100%', aspectRatio: 2, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', borderWidth: 0.5, borderColor: '#1a1a1a', marginBottom: 10 },
  imagePickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  imagePickerIcon: { fontSize: 32 },
  imagePickerText: { color: '#333', fontSize: 12 },
  imagePreview: { width: '100%', height: '100%' },
  composerInput: { color: '#fff', fontSize: 14, minHeight: 60, backgroundColor: '#111', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#1a1a1a' },
  shareBtn: { backgroundColor: ACCENT, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  shareBtnText: { color: '#050508', fontWeight: '700', fontSize: 14 },
  mapModePlaceholder: { alignItems: 'center', padding: 40, gap: 12 },
  mapModeEmoji: { fontSize: 48 },
  mapModeTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  mapModeSub: { fontSize: 13, color: '#444', textAlign: 'center', lineHeight: 20 },
  mapModeBtn: { backgroundColor: ACCENT_DIM, borderWidth: 0.5, borderColor: ACCENT, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  mapModeBtnText: { color: ACCENT, fontWeight: '600', fontSize: 13 },
  rightSidebar: { width: 300, paddingTop: 20, paddingHorizontal: 20 },
  accountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ACCENT },
  accountDog: { color: '#fff', fontWeight: '700', fontSize: 14 },
  accountOwner: { color: '#444', fontSize: 12 },
  sectionTitle: { color: '#333', fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 14 },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  suggestedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  suggestedDog: { color: '#fff', fontWeight: '700', fontSize: 13 },
  suggestedBreedBadge: { fontSize: 10, color: ACCENT, backgroundColor: ACCENT_DIM, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5, fontWeight: '600' },
  suggestedTag: { fontSize: 10, color: '#444', backgroundColor: '#111', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  followLink: { color: ACCENT, fontWeight: '600', fontSize: 13 },
  footer: { color: '#222', fontSize: 10, marginTop: 24, lineHeight: 18 },
});
