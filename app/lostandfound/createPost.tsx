import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const CreatePost = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    status: 'lost',
    type: 'dog',
    customType: '',
    breed: '',
    name: '',
    description: '',
    location: '',
    date: '',
    contactName: '',
    contactNumber: '',
    images: [] as string[],
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // IMAGE PICKER
  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      updateForm('images', [...form.images, ...uris]);
    }
  };

  // REMOVE IMAGE
  const removeImage = (index: number) => {
    const updated = form.images.filter((_, i) => i !== index);
    updateForm('images', updated);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      updateForm('date', selected.toDateString());
    }
  };

  const dogBreeds = [
    'Labrador Retriever',
    'German Shepherd',
    'Golden Retriever',
    'French Bulldog',
    'Poodle',
    'Beagle',
    'Bulldog',
    'Rottweiler',
    'Yorkshire Terrier',
    'Doberman',
  ];

  const catBreeds = [
    'Persian',
    'Siamese',
    'Bengal',
    'Maine Coon',
    'Ragdoll',
    'Sphynx',
    'British Shorthair',
    'Scottish Fold',
    'American Shorthair',
    'Abyssinian',
  ];

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Animal Post</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* LOST / FOUND */}
      <View style={styles.toggle}>
        {['lost', 'found'].map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.toggleBtn, form.status === item && styles.activeToggle]}
            onPress={() => updateForm('status', item)}
          >
            <Text style={form.status === item ? styles.activeText : styles.inactiveText}>
              {item === 'lost' ? 'Lost' : 'Found'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ANIMAL DETAILS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Animal Details</Text>

        <Text style={styles.label}>Animal Type</Text>
        <View style={styles.row}>
          {['dog', 'cat', 'other'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.option, form.type === t && styles.activeOption]}
              onPress={() => {
                updateForm('type', t);
                updateForm('breed', '');
                setBreedDropdownOpen(false);
              }}
            >
              <Text style={form.type === t ? styles.activeText : styles.inactiveText}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* OTHER TYPE */}
        {form.type === 'other' && (
          <>
            <Text style={styles.label}>Add Animal Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter animal type"
              onChangeText={t => updateForm('customType', t)}
            />
          </>
        )}

        {/* BREED */}
        {(form.type === 'dog' || form.type === 'cat') && (
          <>
            <Text style={styles.label}>Select Breed</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setBreedDropdownOpen(prev => !prev)}
            >
              <Text style={form.breed ? styles.dropdownText : styles.placeholderText}>
                {form.breed || `Choose a ${form.type === 'dog' ? 'dog' : 'cat'} breed`}
              </Text>
              <Ionicons
                name={breedDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#555"
              />
            </TouchableOpacity>

            {breedDropdownOpen && (
              <View style={styles.dropdownList}>
                {(form.type === 'dog' ? dogBreeds : catBreeds).map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.dropdownItem,
                      form.breed === b && styles.dropdownItemActive,
                    ]}
                    onPress={() => {
                      updateForm('breed', b);
                      setBreedDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={form.breed === b ? styles.dropdownItemActiveText : undefined}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.label}>Animal Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter animal name"
          onChangeText={t => updateForm('name', t)}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter description"
          multiline
          onChangeText={t => updateForm('description', t)}
        />

        {/* IMAGE UPLOAD */}
        <Text style={styles.label}>Upload Images</Text>

        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="add" size={30} color="#F5A623" />
          <Text>Add images from here</Text>
        </TouchableOpacity>

        {/* IMAGE PREVIEW */}
        <ScrollView horizontal>
          {form.images.map((img, index) => (
            <View key={index}>
              <Image source={{ uri: img }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(index)}
              >
                <Text style={{ color: '#fff' }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 📍 LOCATION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="location" size={16} color="#F5A623" /> Location
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Search location"
          onChangeText={t => updateForm('location', t)}
        />

        {/* MAP PLACEHOLDER */}
        <View style={styles.mapBox}>
          <Text>Google Map Preview</Text>
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{form.date || "Select Date"}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* CONTACT */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Details</Text>

        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          onChangeText={t => updateForm('contactName', t)}
        />

        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          onChangeText={t => updateForm('contactNumber', t)}
        />
      </View>

      {/* BUTTONS */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.btnText}>Submit</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

export default CreatePost;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f5e9', 
    padding: 15 },

  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 },


  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold' },

  toggle: { flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 20 },

  toggleBtn: { 
    padding: 10, 
    backgroundColor: '#fff', 
    margin: 5, 
    borderRadius: 8 },

  activeToggle: { 
    backgroundColor: '#F5A623' },

  activeText: { 
    color: '#fff' },


  inactiveText: { color: '#777' },

  card: { backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 20 },

  sectionTitle: { fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 10 },

  label: { 
    marginTop: 10, 
    marginBottom: 5, 
    fontWeight: '500' },

  row: { flexDirection: 'row' },

  option: { 
    flex: 1, 
    padding: 10,
     backgroundColor: '#eee', 
     margin: 5, 
     borderRadius: 8, 
     alignItems: 'center' },

  activeOption: { backgroundColor: '#F5A623' },

  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  dropdownText: {
    color: '#000',
  },

  placeholderText: {
    color: '#888',
  },

  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 5,
    maxHeight: 200,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  dropdownItemActive: {
    backgroundColor: '#F5A623',
  },

  dropdownItemActiveText: {
    color: '#fff',
  },

  breed: { 
    padding: 10, 
    backgroundColor: '#eee', 
    marginRight: 10, 
    borderRadius: 8 },

  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8 },

  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 10,
  },

  image: { width: 80, 
    height: 80, 
    marginRight: 10, 
    borderRadius: 8 },

  removeBtn: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    padding: 3,
  },

  mapBox: {
    height: 120,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 10,
  },

  buttons: { 
    flexDirection: 'row', 
    marginBottom: 30 },

  backBtn: { 
    flex: 1, 
    backgroundColor: '#ccc', 
    padding: 15, 
    marginRight: 5, 
    borderRadius: 8, 
    alignItems: 'center' },

  submitBtn: { 
    flex: 1, 
    backgroundColor: '#F5A623', 
    padding: 15, 
    marginLeft: 5, 
    borderRadius: 8, 
    alignItems: 'center' },

  btnText: { 
    color: '#fff', 
    fontWeight: 'bold' },
});