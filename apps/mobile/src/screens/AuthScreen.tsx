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
  Image,
} from 'react-native';
import { Ionicons } from '../components/Icon';
import { TOKENS } from '../theme/tokens';
import { supabase } from '../lib/supabase';
import { useTerritories, findTerritory } from '../lib/territories';

interface AuthScreenProps {
  onAuthSuccess: (session: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    territories,
    loading: territoriesLoading,
    error: territoriesError,
    retry: retryTerritories,
  } = useTerritories();

  const syncProfileOnSignUp = async (
    userId: string,
    cleanDisplayName: string,
    cleanCountry: string | null
  ) => {
    const updatePayload: Record<string, any> = {
      display_name: cleanDisplayName,
      updated_at: new Date().toISOString(),
    };
    if (cleanCountry) {
      updatePayload.country = cleanCountry;
    }
    await supabase.from('profiles').update(updatePayload).eq('id', userId);
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      if (isSignUp) {
        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
        const cleanDisplayName = displayName.trim();
        const cleanCountry = country.trim() || null;

        if (!cleanUsername || !cleanDisplayName) {
          setErrorMessage('Please enter your display name and a unique username.');
          setLoading(false);
          return;
        }

        if (cleanUsername.length < 3) {
          setErrorMessage('Username must be at least 3 characters.');
          setLoading(false);
          return;
        }

        const metadata: Record<string, string> = {
          username: cleanUsername,
          display_name: cleanDisplayName,
        };
        if (cleanCountry) {
          metadata.country = cleanCountry;
          const matchedTerritory = findTerritory(territories, cleanCountry);
          if (matchedTerritory?.iso) {
            metadata.origin_country_iso = matchedTerritory.iso;
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: metadata,
          },
        });

        if (error) {
          setErrorMessage(error.message);
        } else if (data.session) {
          if (data.session.user?.id) {
            await syncProfileOnSignUp(data.session.user.id, cleanDisplayName, cleanCountry);
          }
          onAuthSuccess(data.session);
        } else {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          if (signInErr) {
            setErrorMessage('Account created. Please sign in to continue.');
            setIsSignUp(false);
          } else if (signInData.session) {
            if (signInData.session.user?.id) {
              await syncProfileOnSignUp(
                signInData.session.user.id,
                cleanDisplayName,
                cleanCountry
              );
            }
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
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Official TUKUBI Brand Header */}
          <View style={styles.header}>
            <View style={styles.emblemFrame}>
              <Image
                source={require('../../assets/icon.png')}
                style={styles.emblemImage}
                resizeMode="cover"
                accessibilityLabel="TUKUBI app icon"
              />
            </View>
            <Text style={styles.wordmark}>TUKUBI</Text>
            <Text style={styles.tagline}>The Caribbean Connected.</Text>
            <Text style={styles.subtext}>Born in the Caribbean. Built for the World.</Text>
          </View>

          {/* Midnight Reef Authentication Card */}
          <View style={styles.card}>
            {/* Segmented Mode Switch */}
            <View style={styles.segmentedTrack} accessibilityRole="tablist">
              <TouchableOpacity
                style={[styles.segmentBtn, !isSignUp && styles.segmentBtnActive]}
                onPress={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected: !isSignUp }}
                accessibilityLabel="Sign In"
              >
                <Text style={[styles.segmentText, !isSignUp && styles.segmentTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, isSignUp && styles.segmentBtnActive]}
                onPress={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                }}
                activeOpacity={0.85}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSignUp }}
                accessibilityLabel="Create Account"
              >
                <Text style={[styles.segmentText, isSignUp && styles.segmentTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage && (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={16} color={TOKENS.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {isSignUp && (
              <>
                <Text style={styles.label}>Display Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={TOKENS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor={TOKENS.textDim}
                    value={displayName}
                    onChangeText={setDisplayName}
                    accessibilityLabel="Display Name"
                  />
                </View>

                <Text style={styles.label}>Username</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="at-outline" size={18} color={TOKENS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="username"
                    placeholderTextColor={TOKENS.textDim}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Username"
                  />
                </View>

                <View style={styles.heritageHeaderRow}>
                  <Text style={styles.labelInline}>
                    Cultural Heritage (Optional — Private by Default)
                  </Text>
                  {country !== '' && (
                    <TouchableOpacity
                      style={styles.clearHeritageBtn}
                      onPress={() => setCountry('')}
                      accessibilityRole="button"
                      accessibilityLabel="Clear cultural heritage selection"
                    >
                      <Text style={styles.clearHeritageText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.privacyHint}>
                  Hidden by default. You control identity visibility at all times.
                </Text>

                {territoriesLoading ? (
                  <View style={styles.territoriesStatusRow}>
                    <ActivityIndicator size="small" color={TOKENS.teal} />
                    <Text style={styles.territoriesStatusText}>Loading territories…</Text>
                  </View>
                ) : territoriesError ? (
                  <View style={styles.territoriesStatusRow}>
                    <Text style={styles.territoriesStatusText}>{territoriesError}</Text>
                    <TouchableOpacity
                      style={styles.retryTerritoriesBtn}
                      onPress={retryTerritories}
                      accessibilityRole="button"
                      accessibilityLabel="Retry loading territories"
                    >
                      <Text style={styles.clearHeritageText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.countryScroll}
                  >
                    {territories.map((t) => {
                      const selected = country === t.name;
                      return (
                        <TouchableOpacity
                          key={t.iso}
                          style={[styles.countryChip, selected && styles.countryChipActive]}
                          onPress={() => setCountry(selected ? '' : t.name)}
                          activeOpacity={0.8}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          accessibilityLabel={`Select ${t.name}`}
                        >
                          <Text style={[styles.countryText, selected && styles.countryTextActive]}>
                            {t.flag ? `${t.flag} ${t.name}` : t.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={TOKENS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={TOKENS.textDim}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email Address"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={TOKENS.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor={TOKENS.textDim}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                style={styles.eyeToggle}
                onPress={() => setShowPassword((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color={TOKENS.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? 'Create TUKUBI Account' : 'Sign In to TUKUBI'}
            >
              {loading ? (
                <ActivityIndicator color={TOKENS.actionText} />
              ) : (
                <View style={styles.submitInner}>
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                  <Ionicons name="arrow-forward" size={17} color={TOKENS.actionText} />
                </View>
              )}
            </TouchableOpacity>

            {/* Compliance & Governance Trust Strip */}
            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={16} color={TOKENS.teal} />
              <Text style={styles.trustText}>
                Age-verified (13+) · RLS-protected · Privacy-first identity
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 28,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  emblemFrame: {
    width: 68,
    height: 68,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emblemImage: {
    width: '100%',
    height: '100%',
  },
  wordmark: {
    color: TOKENS.textPrimary,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: 2.2,
  },
  tagline: {
    color: TOKENS.teal,
    fontSize: 13.5,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  subtext: {
    color: TOKENS.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  card: {
    backgroundColor: TOKENS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: TOKENS.border,
    padding: 22,
  },
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: TOKENS.border,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: TOKENS.teal,
  },
  segmentText: {
    color: TOKENS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: TOKENS.actionText,
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: TOKENS.oceanDepth,
    borderColor: TOKENS.danger,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: TOKENS.danger,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  label: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  heritageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 2,
  },
  labelInline: {
    color: TOKENS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  clearHeritageBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  clearHeritageText: {
    color: TOKENS.teal,
    fontSize: 11.5,
    fontWeight: '700',
  },
  privacyHint: {
    color: TOKENS.textDim,
    fontSize: 11,
    marginBottom: 8,
  },
  territoriesStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  territoriesStatusText: {
    color: TOKENS.textMuted,
    fontSize: 12,
    flex: 1,
  },
  retryTerritoriesBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TOKENS.raised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKENS.border,
    paddingHorizontal: 13,
    minHeight: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    color: TOKENS.textPrimary,
    fontSize: 14,
    paddingVertical: 11,
  },
  eyeToggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  countryChip: {
    backgroundColor: TOKENS.raised,
    paddingHorizontal: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  countryChipActive: {
    backgroundColor: TOKENS.tealSoft,
    borderColor: TOKENS.borderActive,
  },
  countryText: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  countryTextActive: {
    color: TOKENS.teal,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: TOKENS.teal,
    borderRadius: 13,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: TOKENS.actionText,
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: TOKENS.oceanDepth,
    borderWidth: 1,
    borderColor: TOKENS.border,
  },
  trustText: {
    color: TOKENS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
});
