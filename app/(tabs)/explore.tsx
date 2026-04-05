import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const IS_WEB = width > 768;

const STORIES = [
  { id: 1, name: 'your story', emoji: '🐕', isYou: true, gradient: ['#f09433','#e6683c','#dc2743','#cc2366','#bc1888'] },
  { id: 2, name: 'luna.poodle', emoji: '🐩', gradient: ['#f09433','#e6683c','#dc2743'] },
  { id: 3, name: 'rocky.bull', emoji: '🐾', gradient: ['#833ab4','#fd1d1d','#fcb045'] },
  { id: 4, name: 'coco.schnzr', emoji: '🐕', gradient: ['#405de6','#5851db','#833ab4'] },
  { id: 5, name: 'max.golden', emoji: '🦮', gradient: ['#f09433','#e6683c','#dc2743'] },
  { id: 6, name: 'bella.lab', emoji: '🐶', gradient: ['#833ab4','#fd1d1d','#fcb045'] },
  { id: 7, name: 'thor.husky', emoji: '🐕‍🦺', gradient: ['#405de6','#5851db','#833ab4'] },
];

const SUGGESTED = [
  { user: 'luna.poodle', emoji: '🐩', note: 'Followed by ana.garcia + 3' },
  { user: 'rocky.bulldog', emoji: '🐾', note: 'Followed by rodrigo.vega + 1' },
  { user: 'coco.schnauzer', emoji: '🐕', note: 'Followed by maria.lopez + 7' },
  { user: 'max.golden', emoji: '🦮', note: 'Followed by carlos.m + 2' },
  { user: 'bella.labrador', emoji: '🐶', note: 'Followed by sofia.r + 4' },
];

const NAV_ITEMS = [
  { icon: '🏠', label: 'Home' },
  { icon: '🔍', label: 'Search' },
  { icon: '🎬', label: 'Reels' },
  { icon: '🗺️', label: 'Map' },
  { icon: '❤️', label: 'Activity' },
  { icon: '➕', label: 'New post' },
  { icon: '🐕', label: 'Profile' },
];

const INITIAL_POSTS = [
  {
    id: 1,
    dog: 'Athena',
    owner: 'liliana.gutierrez',
    emoji: '🐕',
    verified: false,
    audio: 'Original audio',
    location: 'Parque España, CDMX',
    caption: 'Sunday zoomies at the park 🌳 She literally ran for 2 hours straight and still wanted more.',
    likes: 142,
    time: '2 MINUTES AGO',
    comments: [
      { user: 'luna.poodle', text: 'Athena is everything 😍' },
      { user: 'rocky.bulldog', text: 'Goals 🐾🐾' },
    ],
  },
  {
    id: 2,
    dog: 'Luna',
    owner: 'ana.garcia',
    emoji: '🐩',
    verified: true,
    audio: 'Original audio',
    location: 'Doggy Chic Grooming, Roma',
    caption: 'Fresh out of the groomer ✨ She walked out like she owns the entire city.',
    likes: 389,
    time: '1 HOUR AGO',
    comments: [
      { user: 'coco.schnauzer', text: 'STUNNING 👑' },
      { user: 'athena.lab', text: 'We need to do a playdate 🐾' },
      { user: 'bella.pup', text: 'What groomer is this??' },
    ],
  },
  {
    id: 3,
    dog: 'Rocky',
    owner: 'rodrigo.vega',
    emoji: '🐾',
    verified: false,
    audio: 'Original audio',
    location: 'Condesa, CDMX',
    caption: 'Found safe thanks to SmartPet Tag 🦸 Thank you everyone who helped. This community is everything ❤️',
    likes: 1204,
    time: '3 HOURS AGO',
    comments: [
      { user: 'liliana.gutierrez', text: 'So relieved!! 😭❤️' },
      { user: 'ana.garcia', text: 'Never letting Luna out without her tag again' },
      { user: 'smartpettag', text: 'This is why we built SmartPet Tag 🐾' },
    ],
  },
];

function Post({ post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showHeart, setShowHeart] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const lastTap = useRef(null);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  function handleDoubleTap() {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (!liked) { setLiked(true); setLikes(l => l + 1); }
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
    setComments(c => [...c, { user: 'liliana.gutierrez', text: commentText }]);
    setCommentText('');
  }

  return (
    <View style={styles.post}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.storyRingSmall}>
          <View style={styles.postAvatarWrap}>
            <Text style={styles.postAvatarEmoji}>{post.emoji}</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.postOwner}>{post.owner}</Text>
            {post.verified && <Text style={{ fontSize: 12 }}>✅</Text>}
            <Text style={styles.postDot}>•</Text>
            <TouchableOpacity onPress={() => setFollowing(!following)}>
              <Text style={styles.followBtn}>{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.postAudio}>🎵 {post.audio}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.moreBtn}>···</Text>
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <TouchableOpacity activeOpacity={1} onPress={handleDoubleTap} style={styles.photoWrap}>
        <View style={styles.photo}>
          <Text style={styles.photoEmoji}>{post.emoji}</Text>
          <Text style={styles.photoCaption}>{post.caption}</Text>
        </View>
        <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }], opacity: heartOpacity }]}>
          <Text style={{ fontSize: 80 }}>❤️</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <TouchableOpacity onPress={() => { setLiked(!liked); setLikes(l => liked ? l - 1 : l + 1); }}>
            <Text style={[styles.actionIcon, liked && styles.actionIconLiked]}>{liked ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(!showComments)}>
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.actionIcon}>✈️</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved(!saved)}>
          <Text style={styles.actionIcon}>{saved ? '🔖' : '📋'}</Text>
        </TouchableOpacity>
      </View>

      {/* Post body */}
      <View style={styles.postBody}>
        <Text style={styles.likesText}>{likes.toLocaleString()} likes</Text>
        <Text style={styles.captionLine}>
          <Text style={styles.postOwner}>{post.owner} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </Text>
        {comments.length > 0 && (
          <TouchableOpacity onPress={() => setShowComments(!showComments)}>
            <Text style={styles.viewAll}>View all {comments.length} comments</Text>
          </TouchableOpacity>
        )}
        {showComments && comments.map((c, i) => (
          <Text key={i} style={styles.commentLine}>
            <Text style={styles.postOwner}>{c.user} </Text>
            <Text style={styles.captionText}>{c.text}</Text>
          </Text>
        ))}
        <Text style={styles.timeText}>{post.time}</Text>
      </View>

      {/* Comment input */}
      <View style={styles.commentInputWrap}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🐕</Text>
        <TextInput
          style={styles.commentBox}
          placeholder="Add a comment..."
          placeholderTextColor="#555"
          value={commentText}
          onChangeText={setCommentText}
        />
        {commentText.trim() !== '' && (
          <TouchableOpacity onPress={submitComment}>
            <Text style={styles.postBtn}>Post</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={{ marginLeft: 8 }}>
          <Text style={{ fontSize: 16 }}>😊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newCaption, setNewCaption] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [viewedStories, setViewedStories] = useState([]);

  function submitPost() {
    if (!newCaption.trim()) return;
    setPosts(p => [{
      id: Date.now(),
      dog: 'Athena',
      owner: 'liliana.gutierrez',
      emoji: '🐕',
      verified: false,
      audio: 'Original audio',
      location: 'Portales, CDMX',
      caption: newCaption,
      likes: 0,
      time: 'JUST NOW',
      comments: [],
    }, ...p]);
    setNewCaption('');
    setShowComposer(false);
  }

  return (
    <View style={styles.container}>

      {/* Left sidebar — desktop only */}
      {IS_WEB && (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarLogo}>🐾</Text>
          <Text style={styles.sidebarAppName}>SmartPet Tag</Text>
          {NAV_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={styles.navItem}
              onPress={() => item.label === 'New post' && setShowComposer(!showComposer)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Center feed */}
      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>

        {/* Stories */}
        <View style={styles.storiesWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingVertical: 12 }}>
            {STORIES.map(story => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={() => setViewedStories(v => [...v, story.id])}
              >
                <View style={[styles.storyRing, viewedStories.includes(story.id) && styles.storyRingViewed]}>
                  <View style={styles.storyAvatarWrap}>
                    <Text style={styles.storyEmoji}>{story.emoji}</Text>
                    {story.isYou && (
                      <View style={styles.addBtn}>
                        <Text style={styles.addBtnText}>+</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.storyLabel} numberOfLines={1}>{story.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.hr} />

        {/* New post composer */}
        {showComposer && (
          <View style={styles.composer}>
            <Text style={styles.composerTitle}>Create new post</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 28 }}>🐕</Text>
              <TextInput
                style={styles.composerInput}
                placeholder="Write a caption..."
                placeholderTextColor="#555"
                value={newCaption}
                onChangeText={setNewCaption}
                multiline
                autoFocus
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <TouchableOpacity onPress={() => setShowComposer(false)}>
                <Text style={{ color: '#aaa', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shareBtn, !newCaption.trim() && { opacity: 0.4 }]}
                onPress={submitPost}
                disabled={!newCaption.trim()}
              >
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Posts */}
        {posts.map(post => <Post key={post.id} post={post} />)}

      </ScrollView>

      {/* Right sidebar — desktop only */}
      {IS_WEB && (
        <View style={styles.rightSidebar}>
          {/* Account */}
          <View style={styles.accountRow}>
            <View style={styles.accountAvatar}>
              <Text style={{ fontSize: 22 }}>🐕</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.accountUser}>liliana.gutierrez</Text>
              <Text style={styles.accountName}>Liliana Gutierrez</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.switchBtn}>Switch</Text>
            </TouchableOpacity>
          </View>

          {/* Suggested */}
          <View style={styles.suggestedHeader}>
            <Text style={styles.suggestedTitle}>Suggested for you</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllBtn}>See all</Text>
            </TouchableOpacity>
          </View>

          {SUGGESTED.map((s, i) => (
            <View key={i} style={styles.suggestedRow}>
              <View style={styles.suggestedAvatar}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.suggestedUser}>{s.user}</Text>
                <Text style={styles.suggestedNote} numberOfLines={1}>{s.note}</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.followLink}>Follow</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.footer}>© 2026 SMARTPET TAG FROM MEXICO CITY</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  sidebar: { width: 240, backgroundColor: '#000', borderRightWidth: 0.5, borderRightColor: '#262626', paddingTop: 20, paddingHorizontal: 16, paddingBottom: 20 },
  sidebarLogo: { fontSize: 32, marginBottom: 4, marginLeft: 12 },
  sidebarAppName: { fontSize: 22, fontWeight: '700', color: '#fff', fontStyle: 'italic', marginBottom: 24, marginLeft: 12 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  navIcon: { fontSize: 24 },
  navLabel: { fontSize: 15, color: '#fff', fontWeight: '400' },
  feed: { flex: 1, maxWidth: IS_WEB ? 470 : undefined },
  storiesWrap: { backgroundColor: '#000', borderBottomWidth: 0.5, borderBottomColor: '#262626' },
  storyItem: { alignItems: 'center', width: 66 },
  storyRing: { width: 66, height: 66, borderRadius: 33, padding: 2, borderWidth: 2, borderColor: '#c13584' },
  storyRingViewed: { borderColor: '#333' },
  storyAvatarWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  storyEmoji: { fontSize: 28 },
  addBtn: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#0095f6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000' },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  storyLabel: { fontSize: 11, color: '#fff', marginTop: 5, textAlign: 'center', width: 66 },
  hr: { height: 0.5, backgroundColor: '#262626' },
  post: { borderBottomWidth: 0.5, borderBottomColor: '#262626', marginBottom: 2 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  storyRingSmall: { width: 42, height: 42, borderRadius: 21, padding: 2, borderWidth: 1.5, borderColor: '#c13584' },
  postAvatarWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  postAvatarEmoji: { fontSize: 18 },
  postOwner: { color: '#fff', fontWeight: '600', fontSize: 13 },
  postDot: { color: '#aaa', fontSize: 13 },
  followBtn: { color: '#0095f6', fontWeight: '600', fontSize: 13 },
  postAudio: { color: '#aaa', fontSize: 12, marginTop: 1 },
  moreBtn: { color: '#fff', fontSize: 20, letterSpacing: 1 },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', aspectRatio: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', padding: 20 },
  photoEmoji: { fontSize: 100, marginBottom: 20 },
  photoCaption: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  heartOverlay: { position: 'absolute', top: '40%', left: '40%' },
  postActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  actionIcon: { fontSize: 24, color: '#fff' },
  actionIconLiked: { color: '#ed4956' },
  postBody: { paddingHorizontal: 14, paddingBottom: 8 },
  likesText: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 4 },
  captionLine: { marginBottom: 4 },
  captionText: { color: '#fff', fontSize: 13, lineHeight: 18 },
  viewAll: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  commentLine: { marginBottom: 2 },
  timeText: { color: '#555', fontSize: 10, letterSpacing: 0.5, marginTop: 6 },
  commentInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#262626' },
  commentBox: { flex: 1, color: '#fff', fontSize: 13 },
  postBtn: { color: '#0095f6', fontWeight: '600', fontSize: 13 },
  composer: { backgroundColor: '#111', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#262626' },
  composerTitle: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 12 },
  composerInput: { flex: 1, color: '#fff', fontSize: 14, minHeight: 80 },
  shareBtn: { backgroundColor: '#0095f6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rightSidebar: { width: 320, paddingTop: 20, paddingHorizontal: 20 },
  accountRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  accountAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  accountUser: { color: '#fff', fontWeight: '600', fontSize: 13 },
  accountName: { color: '#aaa', fontSize: 13 },
  switchBtn: { color: '#0095f6', fontWeight: '600', fontSize: 13 },
  suggestedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  suggestedTitle: { color: '#aaa', fontWeight: '600', fontSize: 13 },
  seeAllBtn: { color: '#fff', fontWeight: '600', fontSize: 13 },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  suggestedAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  suggestedUser: { color: '#fff', fontWeight: '600', fontSize: 13 },
  suggestedNote: { color: '#aaa', fontSize: 12 },
  followLink: { color: '#0095f6', fontWeight: '600', fontSize: 13 },
  footer: { color: '#333', fontSize: 10, marginTop: 24, lineHeight: 18 },
});