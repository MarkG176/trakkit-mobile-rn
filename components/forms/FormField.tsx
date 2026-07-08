import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, ...props }: FormFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-700">{label}</Text>
      <TextInput
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && <Text className="mt-1 text-xs text-red-600">{error}</Text>}
    </View>
  );
}
