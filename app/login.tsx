import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleAuth() {
    setLoading(true);
    setMessage('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMessage('Error: ' + error.message);
      else setMessage('Account created! Check your email to confirm.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage('Error: ' + error.message);
      else setMessage('Logged in successfully!');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>SmartPet Tag</Text>
        <Text style={styles.subtitle}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/>
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Log In'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
          <Text style={styles.switchText}>{isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#222', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#888' },
  form: { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 0.5, borderColor: '#e0e0e0' },
  input: { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 14, fontSize: 14, marginBottom: 12, backgroundColor: '#fafafa' },
  message: { fontSize: 13, color: '#E8640A', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#E8640A', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  switchText: { textAlign: 'center', color: '#888', fontSize: 13 },
});
