import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DonateScreen() {
    const router = useRouter();

    const [category, setCategory] = useState('');
    const [organization, setOrganization] = useState('');
    const [frequency, setFrequency] = useState('');
    const [plan, setPlan] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');

    const handleDonate = () => {
        const donationAmount = parseFloat(amount);
        if (!donationAmount || donationAmount <= 0) {
            Alert.alert("Error", "Please enter a valid donation amount.");
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
        <View style={styles.container}>
            {/* Title + Subtitle outside the box */}
            <Text style={styles.title}>Donate & Support♡</Text>
            <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

            {/* Form inside off-white box */}
            <View style={styles.formBox}>
                {/* Donation Category */}
                <Text style={styles.label}>Donation Category</Text>
                <Picker
                    selectedValue={category}
                    onValueChange={(val) => setCategory(val)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select donation category" value="" />
                    <Picker.Item label="Support Vet Clinic" value="Support Vet Clinic" />
                    <Picker.Item label="Support Shelter" value="Support Shelter" />
                </Picker>

                {/* Organization */}
                <Text style={styles.label}>Organization</Text>
                <Picker
                    selectedValue={organization}
                    onValueChange={(val) => setOrganization(val)}
                    style={styles.picker}
                >
                    <Picker.Item label="Select Clinic/Organization" value="" />
                    <Picker.Item label="Hope Animal Shelter - Kandy" value="Hope Animal Shelter - Kandy" />
                    <Picker.Item label="Paw Heaven Shelter - Colombo" value="Paw Heaven Shelter - Colombo" />
                    <Picker.Item label="Street Animal Care - Galle" value="Street Animal Care - Galle" />
                </Picker>

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
                        <Picker selectedValue={plan} onValueChange={(val) => setPlan(val)} style={styles.picker}>
                            <Picker.Item label="Monthly" value="Monthly" />
                            <Picker.Item label="Yearly" value="Yearly" />
                        </Picker>
                    </>
                )}

                {/* Donation Amount */}
                <Text style={styles.label}>Donation Amount (Rs.)</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    value={amount}
                    onChangeText={setAmount}
                />

                {/* Payment Method */}
                <Text style={styles.label}>Payment Method</Text>
                <Picker selectedValue={paymentMethod} onValueChange={(val) => setPaymentMethod(val)} style={styles.picker}>
                    <Picker.Item label="Select payment method" value="" />
                    <Picker.Item label="Card Payment" value="Card Payment" />
                    <Picker.Item label="Bank Transfer" value="bank Transfer" />
                    <Picker.Item label="eZ cash/mCash/FriMi" value="Bank Transfer" />
                </Picker>

                {/* Donate Button */}
                <TouchableOpacity style={styles.button} onPress={handleDonate}>
                    <Text style={styles.buttonText}>Donate Now 🖤</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <Ionicons name="home-outline" size={24} />
                <Ionicons name="people-outline" size={24} />
                <Ionicons name="location-outline" size={24} />
                <Ionicons name="chatbubble-outline" size={24} />
                <Ionicons name="person-outline" size={24} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'left' },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: 'left', color: '#555' },
    formBox: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    label: { fontSize: 16, marginVertical: 5 },
    picker: { backgroundColor: '#f2f2f2', marginVertical: 5 },
    input: { backgroundColor: '#f2f2f2', padding: 10, marginVertical: 5 },
    button: { backgroundColor: '#FFD700', padding: 15, marginTop: 20, borderRadius: 8 },
    buttonText: { textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, borderTopWidth: 1, borderColor: '#ddd', marginTop: 'auto' },
    switchContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
    switchButton: { paddingVertical: 10, paddingHorizontal: 20, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginHorizontal: 5, backgroundColor: '#f2f2f2' },
    switchButtonActive: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
    switchText: { fontSize: 16, color: '#333' },
    switchTextActive: { fontWeight: 'bold', color: '#000' },
});



