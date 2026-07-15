import { useState } from 'react';
import {
  View,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Input } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
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
      if (error) {
        Alert.alert('Google sign in failed', error.message);
      }
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
        Alert.alert('Code sent', 'Check your email for the 6-digit code.');
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
          paddingHorizontal: spacing['2xl'],
          paddingVertical: spacing['3xl'],
        }}
      >
        <AppText variant="h1" style={{ textAlign: 'center', marginBottom: spacing.sm }}>
          TraKKiT
        </AppText>
        <AppText variant="secondary" style={{ textAlign: 'center', marginBottom: spacing['3xl'] }}>
          Field sales & merchandising
        </AppText>

        {!otpSent ? (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@company.com"
              containerStyle={{ marginBottom: spacing.lg }}
            />
            <Button onPress={handleSendOtp} loading={loading} disabled={googleLoading}>
              Send login code
            </Button>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing['2xl'] }}>
              <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
              <AppText variant="secondary" style={{ marginHorizontal: spacing.md, textTransform: 'uppercase' }}>
                Or continue with
              </AppText>
              <View style={{ height: 1, flex: 1, backgroundColor: colors.border }} />
            </View>

            <Button variant="secondary" onPress={handleGoogleSignIn} loading={googleLoading} disabled={loading}>
              Sign in with Google
            </Button>
          </>
        ) : (
          <>
            <AppText style={{ textAlign: 'center', marginBottom: spacing.lg }}>
              Enter the 6-digit code sent to {email}
            </AppText>
            <TextInput
              style={{
                height: 44,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                marginBottom: spacing.lg,
                textAlign: 'center',
                fontSize: 24,
                letterSpacing: 8,
                color: colors.foreground,
                fontFamily: 'Roboto_400Regular',
              }}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor={colors.secondaryForeground}
            />
            <Button onPress={handleVerifyOtp} loading={loading} style={{ marginBottom: spacing.md }}>
              Verify code
            </Button>
            <Button variant="ghost" onPress={() => setOtpSent(false)}>
              Use a different email
            </Button>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
