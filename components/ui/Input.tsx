import { useState } from 'react';
import { View, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { input } from '@/theme';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, helper, containerStyle, style, onFocus, onBlur, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? <AppText style={input.label}>{label}</AppText> : null}
      <TextInput
        style={[input.container, focused && input.focused, style]}
        placeholderTextColor={input.helper.color}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? <AppText style={input.error}>{error}</AppText> : null}
      {!error && helper ? <AppText style={input.helper}>{helper}</AppText> : null}
    </View>
  );
}
