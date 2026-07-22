import { useRef, useState } from 'react';
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
import { AppText, Button, Card, IconChip } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const OTP_LEN = 6;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithOtp, signInWithGoogle, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

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
        setOtp('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < OTP_LEN) {
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

  const setOtpDigit = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const chars = otp.padEnd(OTP_LEN, ' ').split('');
    chars[index] = digit || ' ';
    const next = chars.join('').replace(/ /g, '').slice(0, OTP_LEN);
    setOtp(next);
    if (digit && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const onOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.canvas }}
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          <Card>
            {!otpSent ? (
              <>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={{
                    width: 72,
                    height: 72,
                    alignSelf: 'center',
                    marginBottom: spacing.md,
                    borderRadius: radius.md,
                  }}
                  resizeMode="contain"
                />
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  Welcome back
                </AppText>
                <AppText
                  variant="secondary"
                  style={{ textAlign: 'center', marginBottom: spacing.lg }}
                >
                  Enter your credentials to access TraKKiT
                </AppText>

                <AppText style={{ fontSize: 14, fontWeight: '600', marginBottom: spacing.xs }}>
                  Email Address
                </AppText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    backgroundColor: colors.muted,
                    paddingHorizontal: spacing.md,
                    minHeight: 48,
                    marginBottom: spacing.md,
                  }}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.secondaryForeground} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="name@company.com"
                    placeholderTextColor={colors.secondaryForeground}
                    style={{ flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: spacing.sm }}
                  />
                </View>

                <Button
                  onPress={handleSendOtp}
                  loading={loading}
                  disabled={googleLoading}
                  style={{ gap: spacing.sm }}
                >
                  <AppText style={{ fontSize: 16, fontWeight: '500', color: colors.primaryForeground }}>
                    Send verification code
                  </AppText>
                  <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                </Button>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: spacing.lg,
                  }}
                >
                  <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
                  <AppText
                    variant="secondary"
                    style={{ marginHorizontal: spacing.sm, fontSize: 12, letterSpacing: 0.5 }}
                  >
                    OR CONTINUE WITH
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

                <AppText
                  variant="secondary"
                  style={{ textAlign: 'center', marginTop: spacing.lg, fontSize: 14 }}
                >
                  Don&apos;t have an account?{' '}
                  <AppText style={{ color: colors.primary, fontWeight: '600' }}>Contact Admin</AppText>
                </AppText>
              </>
            ) : (
              <>
                <IconChip
                  name="mail"
                  size={56}
                  iconSize={28}
                  backgroundColor={colors.primary}
                  color={colors.primaryForeground}
                  style={{ alignSelf: 'center', marginBottom: spacing.md }}
                />
                <AppText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                  Enter verification code
                </AppText>
                <AppText
                  variant="secondary"
                  style={{
                    textAlign: 'center',
                    marginBottom: spacing.lg,
                    alignSelf: 'stretch',
                    flexShrink: 1,
                  }}
                >
                  We&apos;ve sent a 6-digit verification code to{'\n'}
                  <AppText style={{ fontWeight: '600', color: colors.foreground }}>{email}</AppText>
                </AppText>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                  }}
                >
                  {Array.from({ length: OTP_LEN }).map((_, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => {
                        otpRefs.current[i] = ref;
                      }}
                      value={otp[i] ?? ''}
                      onChangeText={(t) => setOtpDigit(i, t)}
                      onKeyPress={({ nativeEvent }) => onOtpKeyPress(i, nativeEvent.key)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                      style={{
                        flex: 1,
                        minHeight: 52,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        backgroundColor: colors.muted,
                        textAlign: 'center',
                        fontSize: 20,
                        fontWeight: '600',
                        color: colors.foreground,
                      }}
                    />
                  ))}
                </View>

                <Button
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={otp.length < OTP_LEN}
                  style={{ marginBottom: spacing.sm }}
                >
                  Verify & Sign In
                </Button>
                <Button
                  variant="outline"
                  onPress={async () => {
                    setLoading(true);
                    try {
                      const { error } = await signInWithOtp(email.trim());
                      if (error) Alert.alert('Resend failed', error.message);
                      else Alert.alert('Code sent', 'Check your email for a new code.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  style={{ marginBottom: spacing.sm }}
                >
                  Resend Code
                </Button>
                <Button
                  variant="outline"
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                >
                  Use different email
                </Button>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.xs,
                    marginTop: spacing.lg,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={14} color={colors.secondaryForeground} />
                  <AppText variant="secondary" style={{ fontSize: 12 }}>
                    Secure field-op authentication
                  </AppText>
                </View>
              </>
            )}
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
