import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  const validateField = (field: string) => {
    let message = '';
    const description = form.description.trim();
    const location = form.location.trim();
    const contactName = form.contactName.trim();
    const contactNumber = form.contactNumber.trim();
    const customType = form.customType.trim();

    switch (field) {
      case 'customType':
        if (form.type === 'other' && !customType) {
          message = 'Please enter the animal type.';
        }
        break;
      case 'breed':
        if ((form.type === 'dog' || form.type === 'cat') && !form.breed) {
          message = 'Please select a breed.';
        }
        break;
      case 'description':
        if (!description) {
          message = 'Please enter a description.';
        } else if (description.length < 10) {
          message = 'Description must be at least 10 characters.';
        }
        break;
      case 'location':
        if (!location) {
          message = 'Please enter the location.';
        }
        break;
      case 'date':
        if (!form.date) {
          message = 'Please select a date.';
        } else {
          const selectedDate = new Date(form.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate > today) {
            message = 'Date cannot be in the future.';
          }
        }
        break;
      case 'contactName':
        if (!contactName) {
          message = 'Please enter your name.';
        } else if (contactName.length < 2) {
          message = 'Name must be at least 2 characters.';
        }
        break;
      case 'contactNumber':
        if (!contactNumber) {
          message = 'Please enter your contact number.';
        } else if (!/^07\d{8}$/.test(contactNumber)) {
          message = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [field]: message }));
    return !message;
  };

  // IMAGE PICKER WITH LIMIT
  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission is needed to choose images from your library.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);

      // 🔒 Limit to 5 images
      if (form.images.length + uris.length > 5) {
        Alert.alert('Image limit', 'You can only upload up to 5 images.');
        return;
      }

      updateForm('images', [...form.images, ...uris]);
    }
  };

  // ❌ REMOVE IMAGE
  const removeImage = (index: number) => {
    const updated = form.images.filter((_, i) => i !== index);
    updateForm('images', updated);
  };

  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      updateForm('date', selected.toDateString());
      validateField('date');
    }
  };

  const showValidationError = (message: string) => {
    setErrorMessage(message);
    Alert.alert('Validation', message);
  };

  // FORM VALIDATION 
  const validateForm = () => {
    setErrorMessage('');
    const validationErrors: Record<string, string> = {};
    const description = form.description.trim();
    const location = form.location.trim();
    const contactName = form.contactName.trim();
    const contactNumber = form.contactNumber.trim();
    const customType = form.customType.trim();

    if (form.type === 'other' && !customType) {
      validationErrors.customType = 'Please enter the animal type.';
    }

    if ((form.type === 'dog' || form.type === 'cat') && !form.breed) {
      validationErrors.breed = 'Please select a breed.';
    }

    if (!description) {
      validationErrors.description = 'Please enter a description.';
    } else if (description.length < 10) {
      validationErrors.description = 'Description must be at least 10 characters.';
    }

    if (form.images.length === 0) {
      validationErrors.images = 'Please upload at least one image.';
    }

    if (form.images.length > 5) {
      validationErrors.images = 'You can upload a maximum of 5 images.';
    }

    const uniqueImages = new Set(form.images);
    if (uniqueImages.size !== form.images.length) {
      validationErrors.images = 'Duplicate images are not allowed.';
    }

    if (!location) {
      validationErrors.location = 'Please enter the location.';
    }

    if (!form.date) {
      validationErrors.date = 'Please select a date.';
    } else {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        validationErrors.date = 'Date cannot be in the future.';
      }
    }

    if (!contactName) {
      validationErrors.contactName = 'Please enter your name.';
    } else if (contactName.length < 2) {
      validationErrors.contactName = 'Name must be at least 2 characters.';
    }

    if (!contactNumber) {
      validationErrors.contactNumber = 'Please enter your contact number.';
    } else if (!/^07\d{8}$/.test(contactNumber)) {
      validationErrors.contactNumber = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';
    }

    setErrors(validationErrors);

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      showValidationError(firstError);
      return false;
    }

    return true;
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
    'Unknown',

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
    'Unknown',
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

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

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

        {form.type === 'other' && (
          <>
            <Text style={styles.label}>Add Animal Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter animal type"
              onChangeText={t => updateForm('customType', t)}
              onBlur={() => validateField('customType')}
            />
            {errors.customType ? (
              <Text style={styles.fieldError}>{errors.customType}</Text>
            ) : null}
          </>
        )}

        {(form.type === 'dog' || form.type === 'cat') && (
          <>
            <Text style={styles.label}>Select Breed</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setBreedDropdownOpen(prev => !prev)}
            >
              <Text style={form.breed ? styles.dropdownText : styles.placeholderText}>
                {form.breed || `Choose a ${form.type} breed`}
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
                      setErrors(prev => ({ ...prev, breed: '' }));
                    }}
                  >
                    <Text style={form.breed === b ? styles.dropdownItemActiveText : undefined}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.breed ? (
              <Text style={styles.fieldError}>{errors.breed}</Text>
            ) : null}
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
          onBlur={() => validateField('description')}
        />
        {errors.description ? (
          <Text style={styles.fieldError}>{errors.description}</Text>
        ) : null}

        <Text style={styles.label}>Upload Images</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="add" size={30} color="#F5A623" />
          <Text>Add images from here</Text>
        </TouchableOpacity>

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

      {/* LOCATION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="location" size={16} color="#F5A623" /> Location
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Search location"
          onChangeText={t => updateForm('location', t)}
          onBlur={() => validateField('location')}
        />
        {errors.location ? (
          <Text style={styles.fieldError}>{errors.location}</Text>
        ) : null}

        <View style={styles.mapBox}>
          <Text>Google Map Preview</Text>
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{form.date || "Select Date"}</Text>
        </TouchableOpacity>
        {errors.date ? (
          <Text style={styles.fieldError}>{errors.date}</Text>
        ) : null}

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
          onBlur={() => validateField('contactName')}
        />
        {errors.contactName ? (
          <Text style={styles.fieldError}>{errors.contactName}</Text>
        ) : null}

        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          onChangeText={t => updateForm('contactNumber', t)}
          onBlur={() => validateField('contactNumber')}
        />
        {errors.contactNumber ? (
          <Text style={styles.fieldError}>{errors.contactNumber}</Text>
        ) : null}
      </View>

      {/* BUTTONS */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => {
            if (!validateForm()) return;

            const route =
              form.status === 'found'
                ? '/lostandfound/foundAnimalView'
                : '/lostandfound/lostanimalview';

            router.push(route);
          }}
        >
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

  errorBox: {
    padding: 12,
    backgroundColor: '#fdecea',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },

  errorText: {
    color: '#721c24',
  },

  fieldError: {
    color: '#b00020',
    marginTop: 5,
    marginBottom: 10,
  },
});