import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const BACKEND_URL = "http://192.168.8.102:5000";

export default function DonateScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [frequency, setFrequency] = useState('');
  const [plan, setPlan] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (category) {
      fetchOrganizationsByCategory();
    } else {
      fetchOrganizations();
    }
    setOrganization('');
  }, [category]);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/organizations`);
      console.log("STATUS:", res.status);
      const data = await res.json();
      console.log("DATA:", JSON.stringify(data));
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setOrganizations([]);
    }
  };

  const fetchOrganizationsByCategory = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/organizations/category/${encodeURIComponent(category)}`
      );
      console.log("CATEGORY STATUS:", res.status);
      const data = await res.json();
      console.log("CATEGORY DATA:", JSON.stringify(data));
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("CATEGORY FETCH ERROR:", err);
      setOrganizations([]);
    }
  };

  const handleDonate = () => {
    const donationAmount = parseFloat(amount);
    if (!donationAmount || donationAmount <= 0) {
      Alert.alert("Error", "Please enter a valid donation amount.");
      return;
    }
    if (donationAmount < 100) {
      Alert.alert("Error", "Minimum donation amount is Rs. 100.");
      return;
    }
    if (!category) {
      Alert.alert("Error", "Please select a donation category.");
      return;
    }
    if (!organization) {
      Alert.alert("Error", "Please select an organization.");
      return;
    }
    if (!frequency) {
      Alert.alert("Error", "Please select donation frequency.");
      return;
    }
    if (!paymentMethod) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }
    router.push({
      pathname: '/donate/donationSummary',
      params: {
        category,
        organization,
        frequency,
        plan,
        amount: donationAmount.toFixed(2),
        paymentMethod,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Donate & Support♡</Text>
      <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

      <View style={styles.formBox}>
        {/* Donation Category */}
        <Text style={styles.label}>Donation Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={(val) => setCategory(val)}
            style={[styles.picker, !category && { color: '#999' }]}
          >
            <Picker.Item label="Select donation category" value="" color="#999" />
            <Picker.Item label="Support Vet Clinic" value="Support Vet Clinic" color="#000" />
            <Picker.Item label="Support Shelter" value="Support Shelter" color="#000" />
          </Picker>
        </View>

        {/* Organization */}
        <Text style={styles.label}>Organization</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={organization}
            onValueChange={(val) => setOrganization(val)}
            style={[styles.picker, !organization && { color: '#999' }]}
          >
            <Picker.Item label="Select Clinic/Shelter" value="" color="#999" />
            {organizations.map((org) => (
              <Picker.Item key={org._id} label={org.name} value={org.name} color="#000" />
            ))}
          </Picker>
        </View>

        {/* Frequency */}
        <Text style={styles.label}>Donation Frequency</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchButton, frequency === 'One-time' && styles.switchButtonActive]}
            onPress={() => setFrequency('One-time')}
          >
            <Text style={[styles.switchText, frequency === 'One-time' && styles.switchTextActive]}>One-time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchButton, frequency === 'Recurring' && styles.switchButtonActive]}
            onPress={() => setFrequency('Recurring')}
          >
            <Text style={[styles.switchText, frequency === 'Recurring' && styles.switchTextActive]}>Recurring</Text>
          </TouchableOpacity>
        </View>

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
        <Text style={styles.label}>Donation Amount (Rs.)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Enter amount (minimum Rs. 100)"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Payment Method */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={paymentMethod}
            onValueChange={(val) => setPaymentMethod(val)}
            style={[styles.picker, !paymentMethod && { color: '#999' }]}
          >
            <Picker.Item label="Select payment method" value="" color="#999" />
            <Picker.Item label="Card Payment" value="Card Payment" color="#000" />
            <Picker.Item label="Bank Transfer" value="Bank Transfer" color="#000" />
            <Picker.Item label="eZ cash/mCash/FriMi" value="eZ cash/mCash/FriMi" color="#000" />
          </Picker>
        </View>

        {/* Donate Button */}
        <TouchableOpacity style={styles.button} onPress={handleDonate}>
          <Text style={styles.buttonText}>Donate Now 🖤</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <Ionicons name="home" size={24} color="#000" />
        <Ionicons name="people-outline" size={24} color="#000" />
        <Ionicons name="add-circle-outline" size={24} color="#000" />
        <Ionicons name="chatbubble-outline" size={24} color="#000" />
        <Ionicons name="person-outline" size={24} color="#000" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#555' },
  formBox: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
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
  input: {
    backgroundColor: '#f2f2f2',
    padding: 10,
    marginVertical: 5,
    borderRadius: 8,
  },
  button: { backgroundColor: '#F5A623', padding: 15, marginTop: 20, borderRadius: 8 },
  buttonText: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#000' },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    borderTopWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#FFF9E6',
  },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  switchButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f2f2f2',
  },
  switchButtonActive: { backgroundColor: '#F5A623', borderColor: 'rgb(245, 166, 35)' },
  switchText: { fontSize: 16, color: '#333' },
  switchTextActive: { fontWeight: 'bold', color: '#000' },
});





