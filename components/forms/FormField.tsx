import { View, TextInput, TextInputProps } from 'react-native';
import { Input } from '@/components/ui';

interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function FormField({ label, error, ...props }: FormFieldProps) {
  return <Input label={label} error={error} {...props} />;
}
