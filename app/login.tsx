import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { colors } from '../lib/design';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { setMessage('Please enter email and password'); return; }
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Error: ' + error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)/');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>SmartPet Tag</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Sign in →</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupLink} onPress={() => router.push('/onboarding')}>
          <Text style={styles.signupLinkText}>No account yet? Create one free 🐾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => router.replace('/guest')}>
          <Text style={styles.backLinkText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 6,  },
  subtitle: { fontSize: 15, color: '#64748B' },
  form: { backgroundColor: '#0F172A', borderRadius: 20, padding: 24, borderWidth: 0.5, borderColor: '#334155' },
  input: { borderWidth: 0.5, borderColor: '#334155', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 12, backgroundColor: '#FFFFFF', color: '#FFFFFF' },
  message: { fontSize: 13, color: '#EF4444', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#F59E0B', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  signupLink: { alignItems: 'center', paddingVertical: 8 },
  signupLinkText: { color: '#F59E0B', fontSize: 13 },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { color: '#64748B', fontSize: 13 },
});
