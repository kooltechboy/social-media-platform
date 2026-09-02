import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('Jamaica');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const CARIBBEAN_COUNTRIES = [
    'Jamaica',
    'Trinidad and Tobago',
    'Barbados',
    'Bahamas',
    'Dominican Republic',
    'Guyana',
    'Haiti',
    'Antigua and Barbuda',
    'Saint Lucia',
    'Grenada',
    'Saint Vincent and the Grenadines',
    'Belize',
    'Suriname',
    'Global Diaspora (USA/UK/Canada)',
  ];

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        if (!username.trim() || !displayName.trim()) {
          setErrorMessage('Please enter your full name and unique username.');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim().toLowerCase(),
              display_name: displayName.trim(),
              country: country,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          onAuthSuccess(data.session);
        } else {
          // If signup requires direct sign-in
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          if (signInErr) {
            setErrorMessage('Account created. Please sign in.');
            setIsSignUp(false);
          } else if (signInData.session) {
            onAuthSuccess(signInData.session);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          onAuthSuccess(data.session);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Brand Header */}
          <View style={styles.header}>
            <View style={styles.emblemBadge}>
              <Text style={styles.emblemText}>🌴</Text>
            </View>
            <Text style={styles.title}>TUKUBI</Text>
            <Text style={styles.tagline}>The Caribbean Connected.</Text>
            <Text style={styles.subtext}>Born in the Caribbean. Built for the World.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isSignUp ? 'Create Tukubi Account' : 'Sign In to Tukubi'}</Text>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {isSignUp && (
              <>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maya Chen"
                  placeholderTextColor={TOKENS.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. mayachen"
                  placeholderTextColor={TOKENS.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />

                <Text style={styles.label}>Country / Territory</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryScroll}>
                  {CARIBBEAN_COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.countryChip, country === c && styles.countryChipActive]}
                      onPress={() => setCountry(c)}
                    >
                      <Text style={[styles.countryText, country === c && styles.countryTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@caribbean.network"
              placeholderTextColor={TOKENS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor={TOKENS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <Text style={styles.submitButtonText}>{isSignUp ? 'Join TUKUBI' : 'Sign In'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
            >
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create one"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: TOKENS.canvas },
  container: { padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  emblemBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TOKENS.action + '25',
    borderWidth: 1,
    borderColor: TOKENS.action,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emblemText: { fontSize: 32 },
  title: { color: TOKENS.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: TOKENS.action, fontSize: 14, fontWeight: '800', marginTop: 4 },
  subtext: { color: TOKENS.textMuted, fontSize: 12, marginTop: 2, fontWeight: '500' },
  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { color: TOKENS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 18 },
  errorBox: {
    backgroundColor: TOKENS.danger + '20',
    borderColor: TOKENS.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: TOKENS.danger, fontSize: 12, fontWeight: '600' },
  label: { color: TOKENS.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: TOKENS.raised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: TOKENS.textPrimary,
    fontSize: 14,
  },
  countryScroll: { flexDirection: 'row', marginVertical: 6 },
  countryChip: {
    backgroundColor: TOKENS.raised,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.action + '20',
    borderColor: TOKENS.action,
  },
  countryText: { color: TOKENS.textMuted, fontSize: 11, fontWeight: '600' },
  countryTextActive: { color: TOKENS.action, fontWeight: '800' },
  submitButton: {
    backgroundColor: TOKENS.action,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
    shadowColor: TOKENS.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#090D1A', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  toggleButton: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
  toggleText: { color: TOKENS.textMuted, fontSize: 13, fontWeight: '600' },
});
