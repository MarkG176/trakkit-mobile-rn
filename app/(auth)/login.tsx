import { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Input, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithOtp, signInWithGoogle, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google sign in failed', error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', {
        p_email: email.trim(),
      });

      if (checkError || !emailExists) {
        Alert.alert('Account not found', 'Please contact your administrator.');
        return;
      }

      const { error } = await signInWithOtp(email.trim());
      if (error) {
        Alert.alert('Sign in failed', error.message);
      } else {
        setOtpSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyOtp(email.trim(), otp.trim());
      if (error) Alert.alert('Verification failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.lg,
          paddingBottom: spacing.lg + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          <Card style={{ padding: spacing.lg }}>
            {!otpSent ? (
              <>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={{ width: 96, height: 96, alignSelf: 'center', marginBottom: spacing.md }}
                  resizeMode="contain"
                />
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  Welcome back
                </AppText>
                <AppText variant="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
                  Sign in with your work email to continue
                </AppText>

                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@company.com"
                  containerStyle={{ marginBottom: spacing.md }}
                />
                <Button onPress={handleSendOtp} loading={loading} disabled={googleLoading}>
                  Send verification code
                </Button>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg }}>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                  <AppText variant="secondary" style={{ marginHorizontal: spacing.sm }}>
                    Or continue with
                  </AppText>
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                </View>

                <Button
                  variant="outline"
                  onPress={handleGoogleSignIn}
                  loading={googleLoading}
                  disabled={loading}
                  icon={<Ionicons name="logo-google" size={18} color={colors.foreground} />}
                >
                  Sign in with Google
                </Button>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.full,
                    backgroundColor: colors.primaryLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  <Ionicons name="mail" size={24} color={colors.primary} />
                </View>
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  Enter verification code
                </AppText>
                <AppText
                  variant="secondary"
                  style={{ textAlign: 'center', marginBottom: spacing.lg, alignSelf: 'stretch', flexShrink: 1 }}
                >
                  We sent a 6-digit code to{'\n'}
                  <AppText variant="secondary" style={{ fontWeight: '600' }}>
                    {email}
                  </AppText>
                </AppText>

                <TextInput
                  style={{
                    width: '100%',
                    minHeight: 52,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    marginBottom: spacing.md,
                    textAlign: 'center',
                    fontSize: 20,
                    letterSpacing: 4,
                    color: colors.foreground,
                    fontFamily: 'Roboto_400Regular',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  }}
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={colors.secondaryForeground}
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                />
                <Button
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={otp.length < 6}
                  style={{ marginBottom: spacing.sm }}
                >
                  Verify code
                </Button>
                <Button variant="ghost" size="sm" onPress={() => setOtpSent(false)}>
                  Use a different email
                </Button>
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
