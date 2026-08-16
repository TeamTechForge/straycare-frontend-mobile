import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InputField from '../../components/InputField';
import PrimaryButton from '../../components/PrimaryButton';
import SelectField from '../../components/SelectField';

import { BASE_URL } from '../../constants/config.constants';

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
  { label: 'Visa', value: 'VISA' },
  { label: 'Mastercard', value: 'MASTER' },
  { label: 'American Express', value: 'AMEX' },
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
  const [showRecurringConfirmation, setShowRecurringConfirmation] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const url = category
          ? `${BASE_URL}/api/organizations/category/${encodeURIComponent(category)}`
          : `${BASE_URL}/api/organizations`;

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
  const selectedOrganization = organizations.find((org) => org._id === organization);
  const recurringAvailable = selectedOrganization?.recurringEnabled === true;

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!category) nextErrors.category = "Please select a donation category.";
    if (!organization) nextErrors.organization = "Please select an organization.";
    if (!frequency) nextErrors.frequency = "Please select a donation frequency.";
    if (frequency === 'Recurring' && !plan) nextErrors.plan = "Please select a recurring plan.";
    if (frequency === 'Recurring' && selectedOrganization && !selectedOrganization.recurringEnabled) {
      nextErrors.organization = "This organization has not enabled cancellable recurring donations yet.";
    }

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

  const openSummary = () => {
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

  const handleDonate = () => {
    if (!validate()) return;

    if (frequency === 'Recurring') {
      setShowRecurringConfirmation(true);
      return;
    }

    openSummary();
  };

  useEffect(() => {
    if (frequency === 'Recurring' && paymentMethod === 'AMEX') {
      setPaymentMethod('');
    }
  }, [frequency, paymentMethod]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
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
          if (!selected?.recurringEnabled && frequency === 'Recurring') {
            setFrequency('One-time');
            setPlan('');
            setPaymentMethod('');
          }
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
            style={[
              styles.toggleSegment,
              frequency === 'Recurring' && styles.toggleSegmentActive,
              !recurringAvailable && styles.toggleSegmentDisabled,
            ]}
            onPress={() => { setFrequency('Recurring'); clearError('frequency'); }}
            disabled={!recurringAvailable}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.toggleText,
              frequency === 'Recurring' && styles.toggleTextActive,
              !recurringAvailable && styles.toggleTextDisabled,
            ]}>
              Recurring
            </Text>
          </TouchableOpacity>
        </View>
        {organization && !recurringAvailable && (
          <Text style={styles.recurringUnavailableText}>
            Recurring donations are not available for this organization yet.
          </Text>
        )}
        {errors.frequency && <Text style={styles.errorText}>{errors.frequency}</Text>}
      </View>

      {frequency === 'Recurring' && (
        <>
          <SelectField
            label="Recurring Plan"
            placeholder="Select a plan"
            selectedValue={plan}
            onValueChange={(val: string) => { setPlan(val); clearError('plan'); }}
            options={PLAN_OPTIONS}
            error={errors.plan}
          />
          <Text style={styles.recurringNotice}>
            Recurring donations renew automatically until cancelled.
          </Text>
        </>
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
        options={frequency === 'Recurring'
          ? PAYMENT_OPTIONS.filter((option) => option.value !== 'AMEX')
          : PAYMENT_OPTIONS}
        error={errors.paymentMethod}
      />

        <PrimaryButton title="Donate Now" onPress={handleDonate} />
      </ScrollView>

      <Modal
        visible={showRecurringConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecurringConfirmation(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowRecurringConfirmation(false)}>
          <Pressable style={styles.confirmationCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.confirmationIcon}>
              <Text style={styles.confirmationIconText}>i</Text>
            </View>
            <Text style={styles.confirmationTitle}>Confirm recurring donation</Text>
            <Text style={styles.confirmationMessage}>
              Rs. {parseFloat(amount || '0').toFixed(2)} will be charged {plan === 'Yearly' ? 'every year' : 'every month'} until the subscription is cancelled.
            </Text>
            <View style={styles.confirmationActions}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.backButton]}
                onPress={() => setShowRecurringConfirmation(false)}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.continueButton]}
                onPress={() => {
                  setShowRecurringConfirmation(false);
                  openSummary();
                }}
              >
                <Text style={styles.continueButtonText}>Continue to PayHere</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 50, paddingBottom: 120 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#555' },
  fieldGroup: { marginVertical: 8 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500', color: '#333' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
  recurringNotice: { color: '#7A5A17', fontSize: 12, marginTop: -2, marginBottom: 8 },
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
  toggleSegmentDisabled: {
    opacity: 0.45,
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
  toggleTextDisabled: { color: '#9CA3AF' },
  recurringUnavailableText: { color: '#7A5A17', fontSize: 11, marginTop: 6 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  confirmationIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmationIconText: { color: '#D97706', fontSize: 32, fontWeight: '700' },
  confirmationTitle: { color: '#1F2937', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  confirmationMessage: { color: '#5B6472', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12 },
  confirmationActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 24 },
  confirmationButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  backButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' },
  continueButton: { backgroundColor: '#F5A623' },
  backButtonText: { color: '#4B5563', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  continueButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});

