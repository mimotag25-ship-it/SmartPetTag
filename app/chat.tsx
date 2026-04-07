import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const sub = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, loadConversations)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (data) setConversations(data);
    setLoading(false);
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const mins = Math.floor((now - then) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && <ActivityIndicator size="large" color="#00D4AA" style={{ marginTop: 60 }} />}

      {!loading && conversations.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Chats start when you connect with other dog owners — through lost alerts, found reports, or meetups.</Text>
        </View>
      )}

      <ScrollView>
        {conversations.map(conv => (
          <TouchableOpacity
            key={conv.id}
            style={styles.convRow}
            onPress={() => router.push({ pathname: '/message', params: { conversationId: conv.id, otherDog: conv.dog2_name, otherOwner: conv.owner2_phone } })}
          >
            <View style={styles.convAvatar}>
              <Text style={styles.convAvatarEmoji}>🐕</Text>
            </View>
            <View style={styles.convBody}>
              <View style={styles.convHeader}>
                <Text style={styles.convDogName}>{conv.dog2_name}</Text>
                <Text style={styles.convTime}>{getTimeAgo(conv.last_message_at)}</Text>
              </View>
              {conv.alert_id && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>🚨 Lost dog coordination</Text>
                </View>
              )}
              <Text style={styles.convLastMsg} numberOfLines={1}>
                {conv.last_message || 'Start the conversation...'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.newChatBtn} onPress={() => router.push({ pathname: '/message', params: { conversationId: 'new', otherDog: 'New chat', otherOwner: '' } })}>
        <Text style={styles.newChatBtnText}>+ New conversation</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050508' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  backBtn: { color: '#555', fontSize: 20 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#444', textAlign: 'center', lineHeight: 20 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#0d0d0d' },
  convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00D4AA' },
  convAvatarEmoji: { fontSize: 24 },
  convBody: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convDogName: { fontSize: 14, fontWeight: '700', color: '#fff' },
  convTime: { fontSize: 11, color: '#444' },
  alertBadge: { backgroundColor: '#1a0505', borderWidth: 0.5, borderColor: '#C0392B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  alertBadgeText: { fontSize: 10, color: '#C0392B', fontWeight: '600' },
  convLastMsg: { fontSize: 12, color: '#555' },
  newChatBtn: { margin: 16, backgroundColor: '#003d30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#00D4AA' },
  newChatBtnText: { color: '#00D4AA', fontWeight: '600', fontSize: 14 },
});
