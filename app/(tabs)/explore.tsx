import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { supabase } from '../../lib/supabase';

const DEMO_POSTS = [
  { id: 1, dog_name: 'Luna', owner: 'Ana García', emoji: '🐩', caption: 'Post-grooming glow ✨ She absolutely knows she is fabulous.', likes: 47, time: '5h ago', comments: ['So cute! 😍', 'Goals 🐾'] },
  { id: 2, dog_name: 'Rocky', owner: 'Rodrigo Vega', emoji: '🐾', caption: 'Rocky was found safe thanks to SmartPet Tag alerts 🦸 Thank you Condesa community!', likes: 103, time: 'Yesterday', comments: ['So happy he is safe! ❤️', 'Amazing app 🐶'] },
  { id: 3, dog_name: 'Coco', owner: 'María López', emoji: '🐕', caption: 'Best day at Parque España 🌳 Made 6 new friends.', likes: 31, time: '2 days ago', comments: ['Coco is the best 🌟'] },
];

export default function FeedScreen() {
  const [posts, setPosts] = useState(DEMO_POSTS);
  const [liked, setLiked] = useState({});
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [myPost, setMyPost] = useState('');
  const [posting, setPosting] = useState(false);

  function toggleLike(id) {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, likes: liked[id] ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  }

  function addComment(id) {
    if (!commentText.trim()) return;
    setPosts(prev => prev.map(p =>
      p.id === id
        ? { ...p, comments: [...p.comments, commentText] }
        : p
    ));
    setCommentText('');
    setCommenting(null);
  }

  function submitPost() {
    if (!myPost.trim()) return;
    setPosting(true);
    const newPost = {
      id: Date.now(),
      dog_name: 'Athena',
      owner: 'Liliana Gutierrez',
      emoji: '🐕',
      caption: myPost,
      likes: 0,
      time: 'Just now',
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
    setMyPost('');
    setPosting(false);
  }

  return (
    <ScrollView style={styles.container}>

      {/* New post composer */}
      <View style={styles.composer}>
        <Text style={styles.composerTitle}>📸 New post as Athena</Text>
        <TextInput
          style={styles.composerInput}
          placeholder="What is Athena up to today?"
          value={myPost}
          onChangeText={setMyPost}
          multiline
        />
        <TouchableOpacity
          style={[styles.postBtn, !myPost.trim() && styles.postBtnDisabled]}
          onPress={submitPost}
          disabled={!myPost.trim()}
        >
          <Text style={styles.postBtnText}>Post 🐾</Text>
        </TouchableOpacity>
      </View>

      {/* Feed */}
      {posts.map(post => (
        <View key={post.id} style={styles.card}>

          {/* Header */}
          <View style={styles.postHeader}>
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarEmoji}>{post.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.postDogName}>{post.dog_name}</Text>
              <Text style={styles.postMeta}>{post.owner} · {post.time}</Text>
            </View>
          </View>

          {/* Caption */}
          <Text style={styles.caption}>{post.caption}</Text>

          {/* Photo placeholder */}
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoEmoji}>{post.emoji}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
              <Text style={styles.actionText}>
                {liked[post.id] ? '❤️' : '🤍'} {post.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setCommenting(commenting === post.id ? null : post.id)}>
              <Text style={styles.actionText}>💬 {post.comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Text style={styles.actionText}>↗ Share</Text>
            </TouchableOpacity>
          </View>

          {/* Comments */}
          {post.comments.map((c, i) => (
            <View key={i} style={styles.comment}>
              <Text style={styles.commentDot}>🐾</Text>
              <Text style={styles.commentText}>{c}</Text>
            </View>
          ))}

          {/* Comment input */}
          {commenting === post.id && (
            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentBox}
                placeholder="Add a comment..."
                value={commentText}
                onChangeText={setCommentText}
                autoFocus
              />
              <TouchableOpacity style={styles.commentSend} onPress={() => addComment(post.id)}>
                <Text style={styles.commentSendText}>Post</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  composer: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e0e0e0' },
  composerTitle: { fontSize: 13, fontWeight: '600', color: '#E8640A', marginBottom: 10 },
  composerInput: { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 13, minHeight: 70, backgroundColor: '#fafafa', textAlignVertical: 'top' },
  postBtn: { backgroundColor: '#E8640A', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 10 },
  postBtnDisabled: { backgroundColor: '#ccc' },
  postBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: '#e0e0e0' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  postAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FDF0E6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F5B87A' },
  postAvatarEmoji: { fontSize: 20 },
  postDogName: { fontSize: 14, fontWeight: '600', color: '#222' },
  postMeta: { fontSize: 12, color: '#888' },
  caption: { fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 10 },
  photoPlaceholder: { backgroundColor: '#f0f0f0', borderRadius: 12, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  photoEmoji: { fontSize: 60 },
  actions: { flexDirection: 'row', gap: 16, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: '#f0f0f0' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#666' },
  comment: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  commentDot: { fontSize: 12 },
  commentText: { fontSize: 12, color: '#555', flex: 1 },
  commentInput: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  commentBox: { flex: 1, borderWidth: 0.5, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, backgroundColor: '#fafafa' },
  commentSend: { backgroundColor: '#E8640A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  commentSendText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});