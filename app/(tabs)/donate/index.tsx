import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import InputField from '../../../components/InputField';

const BACKEND_URL = "http://192.168.8.100:5000";

// OOP: Validator class encapsulating form values and validation algorithms
class DonationValidator {
  private category: string;
  private organization: string;
  private frequency: string;
  private amount: string;
  private paymentMethod: string;

  constructor(
    category: string,
    organization: string,
    frequency: string,
    amount: string,
    paymentMethod: string
  ) {
    this.category = category;
    this.organization = organization;
    this.frequency = frequency;
    this.amount = amount;
    this.paymentMethod = paymentMethod;
  }

  public validate() {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    if (!this.category) {
      errors.category = "Please select a donation category.";
      isValid = false;
    }

    if (!this.organization) {
      errors.organization = "Please select an organization.";
      isValid = false;
    }

    if (!this.frequency) {
      errors.frequency = "Please select a donation frequency.";
      isValid = false;
    }

    const donationAmount = parseFloat(this.amount);
    if (!this.amount || isNaN(donationAmount) || donationAmount <= 0) {
      errors.amount = "Please enter a valid donation amount.";
      isValid = false;
    } else if (donationAmount < 100) {
      errors.amount = "Minimum donation amount is Rs. 100.";
      isValid = false;
    }

    if (!this.paymentMethod) {
      errors.paymentMethod = "Please select a payment method.";
      isValid = false;
    }

    return { isValid, errors };
  }
}

export default function DonateScreen() {
  const router = useRouter();
  
  // Fields state
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Errors state
  const [categoryError, setCategoryError] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const [frequencyError, setFrequencyError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentMethodError, setPaymentMethodError] = useState('');

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

  const handleDonate = () => {
    // 1. Create a validator object using OOP
    const validator = new DonationValidator(
      category,
      organization,
      frequency,
      amount,
      paymentMethod
    );

    // 2. Validate
    const { isValid, errors } = validator.validate();

    // 3. Set errors
    setCategoryError(errors.category || '');
    setOrganizationError(errors.organization || '');
    setFrequencyError(errors.frequency || '');
    setAmountError(errors.amount || '');
    setPaymentMethodError(errors.paymentMethod || '');

    if (!isValid) return;

    const donationAmount = parseFloat(amount);
    router.push({
      pathname: '/donate/donationSummary',
      params: {
        category,
        organization,       
        organizationName,   
        frequency,
        plan,
        amount: donationAmount.toFixed(2),
        paymentMethod,
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Donate & Support</Text>
        <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

        <View style={styles.formBox}>
          {/* Donation Category */}
          <Text style={styles.label}>
            Donation Category <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={category}
              onValueChange={(val) => {
                setCategory(val);
                setCategoryError('');
              }}
              style={[styles.picker, !category && { color: '#999' }]}
            >
              <Picker.Item label="Select donation category" value="" color="#999" />
              <Picker.Item label="Support Vet Clinic" value="Support Vet Clinic" color="#000" />
              <Picker.Item label="Support Shelter" value="Support Shelter" color="#000" />
            </Picker>
          </View>
          {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

          {/* Organization */}
          <Text style={styles.label}>
            Organization <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={organization}
              onValueChange={(val) => {
                setOrganization(val);
                const selected = organizations.find(org => org._id === val);
                setOrganizationName(selected?.clinicName || selected?.orgName || selected?.name || '');
                setOrganizationError('');
              }}
              style={[styles.picker, !organization && { color: '#999' }]}
            >
              <Picker.Item label="Select Clinic/Shelter" value="" color="#999" />
              {organizations.map((org) => (
                <Picker.Item
                  key={org._id}
                  label={org.clinicName || org.orgName || org.name}
                  value={org._id}
                  color="#000"
                />
              ))}
            </Picker>
          </View>
          {organizationError ? <Text style={styles.errorText}>{organizationError}</Text> : null}

          {/* Frequency */}
          <Text style={styles.label}>
            Donation Frequency <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={[styles.switchButton, frequency === 'One-time' && styles.switchButtonActive]}
              onPress={() => {
                setFrequency('One-time');
                setFrequencyError('');
              }}
            >
              <Text style={[styles.switchText, frequency === 'One-time' && styles.switchTextActive]}>One-time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, frequency === 'Recurring' && styles.switchButtonActive]}
              onPress={() => {
                setFrequency('Recurring');
                setFrequencyError('');
              }}
            >
              <Text style={[styles.switchText, frequency === 'Recurring' && styles.switchTextActive]}>Recurring</Text>
            </TouchableOpacity>
          </View>
          {frequencyError ? <Text style={styles.errorText}>{frequencyError}</Text> : null}

          {/* Recurring Plan */}
          {frequency === 'Recurring' && (
            <>
              <Text style={styles.label}>Recurring Plan</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={plan}
                  onValueChange={(val) => setPlan(val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Monthly" value="Monthly" color="#000" />
                  <Picker.Item label="Yearly" value="Yearly" color="#000" />
                </Picker>
              </View>
            </>
          )}

          {/* Donation Amount */}
          <InputField
            label="Donation Amount (Rs.) *"
            placeholder="Enter amount (minimum Rs. 100)"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setAmountError('');
            }}
            keyboardType="numeric"
            icon="cash-outline"
            error={amountError}
          />

          {/* Payment Method */}
          <Text style={styles.label}>
            Payment Method <Text style={{ color: "red" }}>*</Text>
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={paymentMethod}
              onValueChange={(val) => {
                setPaymentMethod(val);
                setPaymentMethodError('');
              }}
              style={[styles.picker, !paymentMethod && { color: '#999' }]}
            >
              <Picker.Item label="Select payment method" value="" color="#999" />
              <Picker.Item label="Card Payment" value="Card Payment" color="#000" />
              <Picker.Item label="Bank Transfer" value="Bank Transfer" color="#000" />
              <Picker.Item label="eZ cash/mCash/FriMi" value="eZ cash/mCash/FriMi" color="#000" />
            </Picker>
          </View>
          {paymentMethodError ? <Text style={styles.errorText}>{paymentMethodError}</Text> : null}

          {/* Donate Button */}
          <TouchableOpacity style={styles.button} onPress={handleDonate}>
            <Text style={styles.buttonText}>Donate Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#555' },
  formBox: {
    marginBottom: 20,
  },
  label: { fontSize: 16, marginVertical: 5 },
  pickerWrapper: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginVertical: 5,
    overflow: 'hidden',
  },
  picker: { backgroundColor: '#f2f2f2' },
  button: { backgroundColor: '#F5A623', padding: 15, marginTop: 20, borderRadius: 8 },
  buttonText: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#000' },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 4,
    marginVertical: 8,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  switchButtonActive: {
    backgroundColor: '#F5A623',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  switchText: { fontSize: 15, color: '#666', fontWeight: '500' },
  switchTextActive: { fontWeight: 'bold', color: '#000' },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
    paddingLeft: 4,
  },
});

