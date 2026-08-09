import { Picker } from '@react-native-picker/picker';
import { StyleSheet, Text, View } from 'react-native';

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  placeholder: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: Option[];
  error?: string;
};

export default function SelectField({
  label,
  placeholder,
  selectedValue,
  onValueChange,
  options,
  error,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.pickerWrapper, error && styles.pickerError]}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={[styles.picker, !selectedValue && { color: '#999' }]}
        >
          <Picker.Item label={placeholder} value="" color="#999" />
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} color="#000" />
          ))}
        </Picker>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
    color: '#333',
  },
  pickerWrapper: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerError: {
    borderColor: 'red',
  },
  picker: {
    backgroundColor: '#f2f2f2',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});