import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function StoryScreen() {
  const { storyId, dogName, mode } = useLocalSearchParams();
  const [story, setStory] = useState(null);
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressRef = useRef(null);

  useEffect(() => {
    if (mode === 'view') loadStories();
    if (mode === 'create') return;
  }, []);

  useEffect(() => {
    if (mode === 'view' && stories.length > 0) {
      startProgress();
    }
  }, [stories, currentIndex]);

  async function loadStories() {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (data && data.length > 0) {
      if (dogName) {
        const idx = data.findIndex(s => s.dog_name === dogName);
        setCurrentIndex(idx >= 0 ? idx : 0);
      }
      setStories(data);
    }
  }

  function startProgress() {
    progressAnim.setValue(0);
    if (progressRef.current) progressRef.current.stop();
    progressRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    progressRef.current.start(({ finished }) => {
      if (finished) nextStory();
    });
  }

  function nextStory() {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      router.back();
    }
  }

  function prevStory() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function publishStory() {
    if (!photo) return;
    setUploading(true);
    try {
      const response = await fetch(photo);
      const blob = await response.blob();
      const fileName = `story-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('posts').upload(fileName, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('posts').getPublicUrl(fileName);

      const { data: dog } = await supabase.from('dogs').select('*').single();
      await supabase.from('stories').insert({
        dog_name: dog?.name || '',
        owner_name: dog?.owner_name || '',
        emoji: dog?.emoji || '🐕',
        photo_url: urlData.publicUrl,
        caption,
      });
      router.back();
    } catch (e) {
      
    }
    setUploading(false);
  }

  const currentStory = stories[currentIndex];

  if (mode === 'create') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        {photo ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: photo }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.captionWrap}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>
            <View style={styles.storyActions}>
              <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhoto(null)}>
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.publishBtn} onPress={publishStory} disabled={uploading}>
                <Text style={styles.publishBtnText}>{uploading ? 'Sharing...' : 'Share story 🐾'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.createScreen}>
            <Text style={styles.createEmoji}>📸</Text>
            <Text style={styles.createTitle}>Share a story</Text>
            <Text style={styles.createSub}>Stories disappear after 24 hours</Text>
            <TouchableOpacity style={styles.pickPhotoBtn} onPress={pickPhoto}>
              <Text style={styles.pickPhotoBtnText}>Choose photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (mode === 'view' && stories.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.emptyScreen}>
          <Text style={styles.emptyEmoji}>🐾</Text>
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.emptySub}>Be the first to share a story!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentStory && (
        <>
          {/* Progress bars */}
          <View style={styles.progressBars}>
            {stories.map((_, i) => (
              <View key={i} style={styles.progressBarWrap}>
                <Animated.View style={[
                  styles.progressBarFill,
                  {
                    width: i < currentIndex ? '100%'
                      : i === currentIndex
                        ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%'
                  }
                ]} />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.storyHeader}>
            <View style={styles.storyAvatarWrap}>
              <Text style={styles.storyAvatarEmoji}>{currentStory.emoji}</Text>
            </View>
            <View>
              <Text style={styles.storyDogName}>{currentStory.dog_name}</Text>
              <Text style={styles.storyTime}>
                {Math.floor((new Date() - new Date(currentStory.created_at)) / 60000) < 60
                  ? `${Math.floor((new Date() - new Date(currentStory.created_at)) / 60000)}m ago`
                  : `${Math.floor((new Date() - new Date(currentStory.created_at)) / 3600000)}h ago`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Story image */}
          <TouchableOpacity
            style={styles.storyImageWrap}
            activeOpacity={1}
            onPress={(e) => {
              const x = e.nativeEvent.locationX;
              if (x < width / 2) prevStory();
              else nextStory();
            }}
          >
            {currentStory.photo_url ? (
              <Image source={{ uri: currentStory.photo_url }} style={styles.storyImage} resizeMode="cover" />
            ) : (
              <View style={styles.storyNoPhoto}>
                <Text style={{ fontSize: 80 }}>{currentStory.emoji}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Caption */}
          {currentStory.caption ? (
            <View style={styles.storyCaptionWrap}>
              <Text style={styles.storyCaption}>{currentStory.caption}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 100, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  progressBars: { position: 'absolute', top: 16, left: 12, right: 12, flexDirection: 'row', gap: 4, zIndex: 100 },
  progressBarWrap: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 1 },
  storyHeader: { position: 'absolute', top: 28, left: 12, right: 52, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 99 },
  storyAvatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#00D4AA' },
  storyAvatarEmoji: { fontSize: 18 },
  storyDogName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  storyTime: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  storyImageWrap: { flex: 1 },
  storyImage: { width: '100%', height: '100%' },
  storyNoPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  storyCaptionWrap: { position: 'absolute', bottom: 40, left: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 12 },
  storyCaption: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  createScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  createEmoji: { fontSize: 64 },
  createTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  createSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  pickPhotoBtn: { backgroundColor: '#00D4AA', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  pickPhotoBtnText: { color: '#050508', fontWeight: '700', fontSize: 16 },
  previewWrap: { flex: 1 },
  previewImage: { width: '100%', height: '100%', position: 'absolute' },
  captionWrap: { position: 'absolute', bottom: 120, left: 16, right: 16 },
  captionInput: { color: '#fff', fontSize: 18, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  storyActions: { position: 'absolute', bottom: 40, left: 16, right: 16, flexDirection: 'row', gap: 10 },
  retakeBtn: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#fff' },
  retakeBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  publishBtn: { flex: 2, backgroundColor: '#00D4AA', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  publishBtnText: { color: '#050508', fontWeight: '700', fontSize: 14 },
  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  emptySub: { fontSize: 14, color: '#666' },
});
