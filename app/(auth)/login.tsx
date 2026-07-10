import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12">
        <Text className="mb-2 text-center text-3xl font-bold text-slate-900">TraKKiT</Text>
        <Text className="mb-8 text-center text-slate-500">Field sales & merchandising</Text>

        {!otpSent ? (
          <>
            <Text className="mb-1 text-sm font-medium text-slate-700">Email</Text>
            <TextInput
              className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-slate-900"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@company.com"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              className="rounded-xl bg-blue-600 py-4"
              onPress={handleSendOtp}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Send login code</Text>
              )}
            </TouchableOpacity>

            <View className="my-6 flex-row items-center">
              <View className="h-px flex-1 bg-slate-200" />
              <Text className="mx-3 text-xs uppercase text-slate-400">Or continue with</Text>
              <View className="h-px flex-1 bg-slate-200" />
            </View>

            <TouchableOpacity
              className="flex-row items-center justify-center rounded-xl border border-slate-300 bg-white py-4"
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <>
                  <Text className="mr-2 text-lg font-bold text-blue-600">G</Text>
                  <Text className="font-semibold text-slate-800">Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="mb-4 text-center text-slate-600">
              Enter the 6-digit code sent to {email}
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-slate-300 px-4 py-3 text-center text-2xl tracking-widest text-slate-900"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              className="mb-3 rounded-xl bg-blue-600 py-4"
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Verify code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOtpSent(false)}>
              <Text className="text-center text-blue-600">Use a different email</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
