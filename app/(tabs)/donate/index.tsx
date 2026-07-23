import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InputField from '../../../components/InputField';
import PrimaryButton from '../../../components/PrimaryButton';
import SelectField from '../../../components/SelectField';

const BACKEND_URL = "http://192.168.8.160:5000";

type FormErrors = {
  category?: string;
  organization?: string;
  frequency?: string;
  plan?: string;
  amount?: string;
  paymentMethod?: string;
};

const CATEGORY_OPTIONS = [
  { label: 'Support Vet Clinic', value: 'Support Vet Clinic' },
  { label: 'Support Shelter', value: 'Support Shelter' },
];

const PLAN_OPTIONS = [
  { label: 'Monthly', value: 'Monthly' },
  { label: 'Yearly', value: 'Yearly' },
];

const PAYMENT_OPTIONS = [
  { label: 'Card Payment', value: 'Card Payment' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'eZ cash/mCash/FriMi', value: 'eZ cash/mCash/FriMi' },
];

export default function DonateScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const url = category
          ? `${BACKEND_URL}/api/organizations/category/${encodeURIComponent(category)}`
          : `${BACKEND_URL}/api/organizations`;

        const res = await fetch(url);
        const data = await res.json();

        if (isMounted) {
          setOrganizations(Array.isArray(data) ? data : []);
          setOrganization('');
          setOrganizationName('');
        }
      } catch (err) {
        console.error("FETCH ERROR:", err);
        if (isMounted) setOrganizations([]);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [category]);

  const organizationOptions = organizations.map((org) => ({
    label: org.clinicName || org.orgName || org.name,
    value: org._id,
  }));

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!category) nextErrors.category = "Please select a donation category.";
    if (!organization) nextErrors.organization = "Please select an organization.";
    if (!frequency) nextErrors.frequency = "Please select a donation frequency.";
    if (frequency === 'Recurring' && !plan) nextErrors.plan = "Please select a recurring plan.";

    const donationAmount = parseFloat(amount);
    if (!amount) {
      nextErrors.amount = "Please enter a donation amount.";
    } else if (isNaN(donationAmount) || donationAmount <= 0) {
      nextErrors.amount = "Please enter a valid amount.";
    } else if (donationAmount < 100) {
      nextErrors.amount = "Minimum donation amount is Rs. 100.";
    }

    if (!paymentMethod) nextErrors.paymentMethod = "Please select a payment method.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDonate = () => {
    if (!validate()) return;

    router.push({
      pathname: '/donate/DonationSummary',
      params: {
        category,
        organization,
        organizationName,
        frequency,
        plan,
        amount: parseFloat(amount).toFixed(2),
        paymentMethod,
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Donate & Support</Text>
      <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

      <SelectField
        label="Donation Category"
        placeholder="Select donation category"
        selectedValue={category}
        onValueChange={(val: string) => { setCategory(val); clearError('category'); }}
        options={CATEGORY_OPTIONS}
        error={errors.category}
      />

      <SelectField
        label="Organization"
        placeholder="Select Clinic/Shelter"
        selectedValue={organization}
        onValueChange={(val: string) => {
          setOrganization(val);
          const selected = organizations.find(org => org._id === val);
          setOrganizationName(selected?.clinicName || selected?.orgName || selected?.name || '');
          clearError('organization');
        }}
        options={organizationOptions}
        error={errors.organization}
      />

      {/* Frequency toggle (inline, not a shared component since it's only used here) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Donation Frequency</Text>
        <View style={styles.toggleTrack}>
          <TouchableOpacity
            style={[styles.toggleSegment, frequency === 'One-time' && styles.toggleSegmentActive]}
            onPress={() => { setFrequency('One-time'); clearError('frequency'); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, frequency === 'One-time' && styles.toggleTextActive]}>
              One-time
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleSegment, frequency === 'Recurring' && styles.toggleSegmentActive]}
            onPress={() => { setFrequency('Recurring'); clearError('frequency'); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, frequency === 'Recurring' && styles.toggleTextActive]}>
              Recurring
            </Text>
          </TouchableOpacity>
        </View>
        {errors.frequency && <Text style={styles.errorText}>{errors.frequency}</Text>}
      </View>

      {frequency === 'Recurring' && (
        <SelectField
          label="Recurring Plan"
          placeholder="Select a plan"
          selectedValue={plan}
          onValueChange={(val: string) => { setPlan(val); clearError('plan'); }}
          options={PLAN_OPTIONS}
          error={errors.plan}
        />
      )}

      <InputField
        label="Donation Amount (Rs.)"
        placeholder="Enter amount (minimum Rs. 100)"
        value={amount}
        onChangeText={(text) => { setAmount(text); clearError('amount'); }}
        keyboardType="numeric"
        error={errors.amount}
      />

      <SelectField
        label="Payment Method"
        placeholder="Select payment method"
        selectedValue={paymentMethod}
        onValueChange={(val: string) => { setPaymentMethod(val); clearError('paymentMethod'); }}
        options={PAYMENT_OPTIONS}
        error={errors.paymentMethod}
      />

      <PrimaryButton title="Donate Now" onPress={handleDonate} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 50 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#555' },
  fieldGroup: { marginVertical: 8 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#333' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 4,
  },
  toggleSegment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  toggleSegmentActive: {
    backgroundColor: '#F5A623',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#777',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

