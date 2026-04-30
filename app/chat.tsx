import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { colors } from '../lib/design';
import { useLanguage, t } from '../lib/i18n';

export default function ChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myDog, setMyDog] = useState(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    loadMyDog();
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadMyDog() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { const { data } = await supabase.from('dogs').select('*').single(); if (data) setMyDog(data); return; }
    const { data } = await supabase.from('dogs').select('*').eq('owner_email', user.email).single();
    if (data) setMyDog(data);
  }

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

  async function startNewChat() {
    const { data } = await supabase
      .from('conversations')
      .insert({
        dog1_name: myDog?.name || 'Me',
        dog2_name: otherDog || 'Unknown',
        owner1_phone: '+52 55 4532-0981',
        owner2_phone: '',
        last_message: '',
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (data) {
      router.push({
        pathname: '/message',
        params: { conversationId: data.id, otherDog: '', otherOwner: '' }
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && <ActivityIndicator size="large" color="#00D4AA" style={{ marginTop: 60 }} />}

      {!loading && conversations.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>Chats start when you connect with other dog owners — through lost alerts, found reports, or meetups.</Text>
          <TouchableOpacity style={styles.startBtn} onPress={startNewChat}>
            <Text style={styles.startBtnText}>Start a new conversation</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        {conversations.map(conv => (
          <TouchableOpacity
            key={conv.id}
            style={styles.convRow}
            onPress={() => router.push({
              pathname: '/message',
              params: {
                conversationId: conv.id,
                otherDog: conv.dog1_name === (myDog?.name || 'Me') ? conv.dog2_name : conv.dog1_name,
                otherOwner: conv.dog1_name === (myDog?.name || 'Me') ? conv.owner2_phone : conv.owner1_phone,
              }
            })}
          >
            <View style={styles.convAvatar}>
              <Text style={styles.convAvatarEmoji}>🐕</Text>
            </View>
            <View style={styles.convBody}>
              <View style={styles.convHeader}>
                <Text style={styles.convDogName}>
                  {conv.dog1_name === (myDog?.name || 'Me') ? conv.dog2_name : conv.dog1_name}
                </Text>
                <Text style={styles.convTime}>{getTimeAgo(conv.last_message_at)}</Text>
              </View>
              {conv.alert_id && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>🚨 Lost dog coordination</Text>
                </View>
              )}
              <Text style={styles.convLastMsg} numberOfLines={1}>
                {conv.last_message || 'Tap to start chatting...'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {conversations.length > 0 && (
        <TouchableOpacity style={styles.newChatBtn} onPress={startNewChat}>
          <Text style={styles.newChatBtnText}>+ New conversation</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  backBtn: { color: '#555', fontSize: 20 },
  title: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  goToMapBtn: { marginTop: 16, backgroundColor: colors.amberDim, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, borderWidth: 0.5, borderColor: colors.amber },
  goToMapBtnText: { color: colors.amber, fontSize: 13, fontWeight: '700' },
  emptySub: { fontSize: 13, color: '#444', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  startBtn: { backgroundColor: '#003d30', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, borderWidth: 0.5, borderColor: '#00D4AA' },
  startBtnText: { color: '#00D4AA', fontWeight: '600', fontSize: 14 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#0d0d0d' },
  convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00D4AA' },
  convAvatarEmoji: { fontSize: 24 },
  convBody: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convDogName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  convTime: { fontSize: 11, color: '#444' },
  alertBadge: { backgroundColor: '#1a0505', borderWidth: 0.5, borderColor: '#C0392B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  alertBadgeText: { fontSize: 10, color: '#C0392B', fontWeight: '600' },
  convLastMsg: { fontSize: 12, color: '#555' },
  newChatBtn: { margin: 16, backgroundColor: '#003d30', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: '#00D4AA' },
  newChatBtnText: { color: '#00D4AA', fontWeight: '600', fontSize: 14 },
});
