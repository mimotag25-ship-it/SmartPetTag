import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';

export default function MessageScreen() {
  const { conversationId, otherDog, otherOwner } = useLocalSearchParams();

  useEffect(() => {
    async function loadMyDogName() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { const { data } = await supabase.from('dogs').select('name').single(); if (data) setMyDogName(data.name); return; }
      const { data } = await supabase.from('dogs').select('name').eq('owner_email', user.email).single();
      if (data) setMyDogName(data.name);
    }
    loadMyDogName();
  }, []);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [convId, setConvId] = useState(conversationId !== 'new' ? conversationId : null);
  const scrollRef = useRef(null);
  const [myDogName, setMyDogName] = useState('Me');
  const MY_NAME = 'Liliana Gutierrez';

  useEffect(() => {
    if (convId && convId !== 'new') {
      loadMessages(convId);
      const interval = setInterval(() => loadMessages(convId), 2000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [convId]);

  async function loadMessages(id) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    const msgText = text.trim();
    setText('');

    let activeConvId = convId;

    if (!activeConvId) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ dog1_name: myDogName, dog2_name: otherDog, owner1_phone: '', owner2_phone: otherOwner || '', last_message: msgText })
        .select()
        .single();
      if (newConv) { activeConvId = newConv.id; setConvId(newConv.id); }
    }

    if (activeConvId) {
      const newMsg = { conversation_id: activeConvId, sender_dog: myDogName, sender_name: MY_NAME, text: msgText, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, { ...newMsg, id: Date.now() }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

      await supabase.from('messages').insert(newMsg);
      await supabase.from('conversations').update({ last_message: msgText, last_message_at: new Date().toISOString() }).eq('id', activeConvId);
    }

    setSending(false);
  }

  function getTime(timestamp) {
    const d = new Date(timestamp);
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarEmoji}>🐕</Text>
          </View>
          <View>
            <Text style={styles.headerDogName}>{otherDog}</Text>
            <Text style={styles.headerStatus}>● Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/chat')}>
          <Text style={styles.allChatsBtn}>All chats</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00D4AA" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        >
          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>🐾</Text>
              <Text style={styles.emptyChatText}>Say hello to {otherDog}!</Text>
            </View>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.sender_dog === myDogName;
            return (
              <View key={msg.id || i} style={[styles.msgRow, isMe && styles.msgRowMe, { marginBottom: 8 }]}>
                {!isMe && (
                  <View style={styles.msgAvatar}>
                    <Text style={{ fontSize: 14 }}>🐕</Text>
                  </View>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  {!isMe && <Text style={styles.bubbleSender}>{msg.sender_dog}</Text>}
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
                  <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{getTime(msg.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.inputBar}>
        <View style={styles.inputAvatar}>
          <Text style={{ fontSize: 16 }}>🐕</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={`Message as ${myDogName}...`}
          placeholderTextColor="#333"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.sendBtnText}>↑</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#111' },
  backBtn: { color: '#555', fontSize: 20, width: 30 },
  topBarCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00D4AA' },
  headerAvatarEmoji: { fontSize: 18 },
  headerDogName: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  headerStatus: { fontSize: 11, color: '#00D4AA' },
  allChatsBtn: { color: '#00D4AA', fontSize: 13, fontWeight: '500' },
  messageList: { flex: 1 },
  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyChatEmoji: { fontSize: 40 },
  emptyChatText: { fontSize: 14, color: '#444' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#222' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleMe: { backgroundColor: '#00D4AA', borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: '#111', borderBottomLeftRadius: 4, borderWidth: 0.5, borderColor: '#1a1a1a' },
  bubbleSender: { fontSize: 11, color: '#00D4AA', fontWeight: '600', marginBottom: 3 },
  bubbleText: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  bubbleTextMe: { color: '#FFFFFF' },
  bubbleTime: { fontSize: 10, color: '#555', marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(0,0,0,0.4)' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: '#111', backgroundColor: '#FFFFFF' },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#FFFFFF', maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00D4AA', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#0d0d0d', borderWidth: 0.5, borderColor: '#1a1a1a' },
  sendBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
