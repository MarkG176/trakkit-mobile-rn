import { Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export function getOAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'trakkit',
    path: 'callback',
  });
}

export async function createSessionFromUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    throw new Error(errorCode);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return data.session;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');

    if (hashAccessToken && hashRefreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken,
      });
      if (error) throw error;
      return data.session;
    }
  }

  throw new Error('No auth credentials found in callback URL');
}

export async function signInWithGoogleOAuth(): Promise<{ error: Error | null }> {
  try {
    const redirectTo = getOAuthRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) return { error: error as Error };
    if (!data.url) return { error: new Error('No OAuth URL returned from Supabase') };

    if (Platform.OS === 'web') {
      window.location.assign(data.url);
      return { error: null };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: new Error('Google sign-in was cancelled') };
    }

    if (result.type !== 'success') {
      return { error: new Error('Google sign-in failed') };
    }

    await createSessionFromUrl(result.url);
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Google sign-in failed') };
  }
}
