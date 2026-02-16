import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface LocationDetails {
  location?: string;
  date: string;
  time: string;
  reporterName?: string;
  contactNumber?: string;
}

const CreateLostPost2 = () => {
  const router = useRouter();

  const [form, setForm] = useState<LocationDetails>({
    location: '',
    date: 'Oct 24, 2023',
    time: '14:30 PM',
    reporterName: '',
    contactNumber: '',
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const updateForm = (field: keyof LocationDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      updateForm('date', date.toLocaleDateString());
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      updateForm('time', date.toLocaleTimeString());
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report lost or found pet</Text>
        <View style={{ width: 28 }} />
      </View>

      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, styles.activeSegment]} />
        <View style={[styles.progressSegment, styles.activeSegment]} />
        <View style={styles.progressSegment} />
      </View>

      {/* Location & Time */}
      <Text style={styles.sectionTitle}>Location & Time</Text>

      {/* Location Search */}
      <Text style={styles.label}>Location</Text>
      <View style={styles.locationSearchContainer}>
        <Ionicons name="search" size={20} color="#ffb700" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.locationInput}
          placeholder="Search address or park name"
          value={form.location}
          onChangeText={text => updateForm('location', text)}
          placeholderTextColor="#ccc"
        />
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapBox}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="map-outline" size={48} color="#ffb700" />
          <Text style={styles.mapText}>Tap to pin location on map</Text>
          <Text style={styles.mapPlaceholder}>
            {form.location ? `📍 ${form.location}` : 'Search or pin location'}
          </Text>
        </View>
      </View>

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.dateTimeContainer}
        onPress={() => setShowDatePicker(true)}
      >
        <TextInput
          style={styles.dateTimeInput}
          placeholder="Select date"
          value={form.date}
          editable={false}
          placeholderTextColor="#ccc"
        />
        <Ionicons name="calendar-outline" size={24} color="#ffb700" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Time */}
      <Text style={styles.label}>Time</Text>
      <TouchableOpacity
        style={styles.dateTimeContainer}
        onPress={() => setShowTimePicker(true)}
      >
        <TextInput
          style={styles.dateTimeInput}
          placeholder="Select time"
          value={form.time}
          editable={false}
          placeholderTextColor="#ccc"
        />
        <Ionicons name="time-outline" size={24} color="#ffb700" />
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Reporter Details */}
      <Text style={styles.sectionTitle}>Your Contact Details</Text>

      {/* Name */}
      <Text style={styles.label}>Your Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={form.reporterName}
        onChangeText={text => updateForm('reporterName', text)}
        placeholderTextColor="#ccc"
      />

      {/* Contact Number */}
      <Text style={styles.label}>Contact Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        value={form.contactNumber}
        onChangeText={text => updateForm('contactNumber', text)}
        keyboardType="phone-pad"
        placeholderTextColor="#ccc"
      />

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push('/lostandfound/lostanimalview')}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateLostPost2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f5e9',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  progressBar: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  activeSegment: {
    backgroundColor: '#ffb700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    marginTop: 20,
    color: '#000',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    fontWeight: '500',
  },
  mapBox: {
    height: 250,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f4f8',
    overflow: 'hidden',
  },
  mapText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 10,
  },
  mapPlaceholder: {
    color: '#999',
    fontSize: 13,
    fontStyle: 'italic',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 18,
    backgroundColor: '#fff',
    paddingRight: 12,
  },
  dateTimeInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 18,
    backgroundColor: '#fff',
  },
  locationInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 30,
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#ffb700',
    padding: 15,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
