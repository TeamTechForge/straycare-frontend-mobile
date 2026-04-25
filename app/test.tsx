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

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_IMAGES = 5;

const DOG_BREEDS = [
  'Labrador Retriever', 'German Shepherd', 'Golden Retriever',
  'French Bulldog', 'Poodle', 'Beagle', 'Bulldog',
  'Rottweiler', 'Yorkshire Terrier', 'Doberman', 'Unknown',
];

const CAT_BREEDS = [
  'Persian', 'Siamese', 'Bengal', 'Maine Coon', 'Ragdoll',
  'Sphynx', 'British Shorthair', 'Scottish Fold',
  'American Shorthair', 'Abyssinian', 'Unknown',
];

// Sri Lankan mobile number: starts with 07 followed by 8 digits
const SL_PHONE_REGEX = /^07\d{8}$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  status: 'lost' | 'found';
  type: 'dog' | 'cat' | 'other';
  customType: string;
  breed: string;
  name: string;
  description: string;
  location: string;
  date: string;
  contactName: string;
  contactNumber: string;
  images: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const CreatePost = () => {
  const router = useRouter();

  // Form field values
  const [form, setForm] = useState<FormState>({
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
    images: [],
  });

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Update a single form field and clear its error */
  const updateForm = (key: keyof FormState, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  /** Show a validation alert and set the top-level error message */
  const showValidationError = (message: string) => {
    setErrorMessage(message);
    Alert.alert('Validation', message);
  };

  /** Returns true if the selected date is not in the future */
  const isDateValid = (dateStr: string) => {
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected <= today;
  };

  // ─── Per-field Validation ─────────────────────────────────────────────────

  /** Validate a single field on blur and update its error message */
  const validateField = (field: keyof FormState) => {
    let message = '';

    switch (field) {
      case 'customType':
        if (form.type === 'other' && !form.customType.trim())
          message = 'Please enter the animal type.';
        break;

      case 'breed':
        if ((form.type === 'dog' || form.type === 'cat') && !form.breed)
          message = 'Please select a breed.';
        break;

      case 'description':
        if (!form.description.trim())
          message = 'Please enter a description.';
        else if (form.description.trim().length < 10)
          message = 'Description must be at least 10 characters.';
        break;

      case 'location':
        if (!form.location.trim())
          message = 'Please enter the location.';
        break;

      case 'date':
        if (!form.date)
          message = 'Please select a date.';
        else if (!isDateValid(form.date))
          message = 'Date cannot be in the future.';
        break;

      case 'contactName':
        if (!form.contactName.trim())
          message = 'Please enter your name.';
        else if (form.contactName.trim().length < 2)
          message = 'Name must be at least 2 characters.';
        break;

      case 'contactNumber':
        if (!form.contactNumber.trim())
          message = 'Please enter your contact number.';
        else if (!SL_PHONE_REGEX.test(form.contactNumber))
          message = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';
        break;
    }

    setErrors(prev => ({ ...prev, [field]: message }));
    return !message;
  };

  // ─── Full Form Validation ─────────────────────────────────────────────────

  /** Validate all fields before submission; returns true if form is valid */
  const validateForm = (): boolean => {
    setErrorMessage('');
    const validationErrors: Record<string, string> = {};

    // Animal type
    if (form.type === 'other' && !form.customType.trim())
      validationErrors.customType = 'Please enter the animal type.';

    // Breed (only for dog/cat)
    if ((form.type === 'dog' || form.type === 'cat') && !form.breed)
      validationErrors.breed = 'Please select a breed.';

    // Description
    if (!form.description.trim())
      validationErrors.description = 'Please enter a description.';
    else if (form.description.trim().length < 10)
      validationErrors.description = 'Description must be at least 10 characters.';

    // Images: required, max limit, no duplicates
    if (form.images.length === 0)
      validationErrors.images = 'Please upload at least one image.';
    else if (form.images.length > MAX_IMAGES)
      validationErrors.images = `You can upload a maximum of ${MAX_IMAGES} images.`;
    else if (new Set(form.images).size !== form.images.length)
      validationErrors.images = 'Duplicate images are not allowed.';

    // Location
    if (!form.location.trim())
      validationErrors.location = 'Please enter the location.';

    // Date
    if (!form.date)
      validationErrors.date = 'Please select a date.';
    else if (!isDateValid(form.date))
      validationErrors.date = 'Date cannot be in the future.';

    // Contact name
    if (!form.contactName.trim())
      validationErrors.contactName = 'Please enter your name.';
    else if (form.contactName.trim().length < 2)
      validationErrors.contactName = 'Name must be at least 2 characters.';

    // Contact number
    if (!form.contactNumber.trim())
      validationErrors.contactNumber = 'Please enter your contact number.';
    else if (!SL_PHONE_REGEX.test(form.contactNumber))
      validationErrors.contactNumber = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';

    setErrors(validationErrors);

    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) {
      showValidationError(firstError);
      return false;
    }

    return true;
  };

  // ─── Image Handling ───────────────────────────────────────────────────────

  /** Open the image library and append selected images (max 5 total) */
  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission is needed to choose images from your library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(a => a.uri);

      if (form.images.length + newUris.length > MAX_IMAGES) {
        Alert.alert('Image limit', `You can only upload up to ${MAX_IMAGES} images.`);
        return;
      }

      updateForm('images', [...form.images, ...newUris]);
    }
  };

  /** Remove an image by its index */
  const removeImage = (index: number) => {
    const updated = form.images.filter((_, i) => i !== index);
    updateForm('images', updated);
  };

  // ─── Date Handling ────────────────────────────────────────────────────────

  /** Handle date picker selection */
  const handleDateChange = (_event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      updateForm('date', selected.toDateString());
      validateField('date');
    }
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  /** Validate form and navigate to the appropriate view screen */
  const handleSubmit = () => {
    if (!validateForm()) return;

    const route = form.status === 'found'
      ? '/lostandfound/foundAnimalView'
      : '/lostandfound/lostanimalview';

    router.push(route);
  };

  // ─── Reusable Sub-components ──────────────────────────────────────────────

  /** Inline field error text */
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <Text style={styles.fieldError}>{errors[field]}</Text> : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Animal Post</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Top-level validation error banner */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Lost / Found toggle */}
      <View style={styles.toggle}>
        {(['lost', 'found'] as const).map(item => (
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

      {/* ── Animal Details Card ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Animal Details</Text>

        {/* Animal type selector */}
        <Text style={styles.label}>Animal Type</Text>
        <View style={styles.row}>
          {(['dog', 'cat', 'other'] as const).map(t => (
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

        {/* Custom animal type input (shown only when "other" is selected) */}
        {form.type === 'other' && (
          <>
            <Text style={styles.label}>Add Animal Type</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter animal type"
              onChangeText={t => updateForm('customType', t)}
              onBlur={() => validateField('customType')}
            />
            <FieldError field="customType" />
          </>
        )}

        {/* Breed dropdown (shown only for dog or cat) */}
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
                {(form.type === 'dog' ? DOG_BREEDS : CAT_BREEDS).map(breed => (
                  <TouchableOpacity
                    key={breed}
                    style={[styles.dropdownItem, form.breed === breed && styles.dropdownItemActive]}
                    onPress={() => {
                      updateForm('breed', breed);
                      setBreedDropdownOpen(false);
                      setErrors(prev => ({ ...prev, breed: '' }));
                    }}
                  >
                    <Text style={form.breed === breed ? styles.dropdownItemActiveText : undefined}>
                      {breed}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <FieldError field="breed" />
          </>
        )}

        {/* Animal name (optional) */}
        <Text style={styles.label}>Animal Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter animal name"
          onChangeText={t => updateForm('name', t)}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter description"
          multiline
          textAlignVertical="top"
          onChangeText={t => updateForm('description', t)}
          onBlur={() => validateField('description')}
        />
        <FieldError field="description" />

        {/* Image upload */}
        <Text style={styles.label}>Upload Images</Text>
        <TouchableOpacity style={styles.uploadBox} onPress={pickImages}>
          <Ionicons name="add" size={30} color="#F5A623" />
          <Text>Add images from here</Text>
        </TouchableOpacity>
        <FieldError field="images" />

        {/* Image preview strip */}
        <ScrollView horizontal>
          {form.images.map((uri, index) => (
            <View key={index}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Text style={{ color: '#fff' }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* ── Location Card ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Ionicons name="location" size={16} color="#F5A623" /> Location
        </Text>

        {/* Location text input */}
        <TextInput
          style={styles.input}
          placeholder="Search location"
          onChangeText={t => updateForm('location', t)}
          onBlur={() => validateField('location')}
        />
        <FieldError field="location" />

        {/* Map preview placeholder */}
        <View style={styles.mapBox}>
          <Text>Google Map Preview</Text>
        </View>

        {/* Date picker trigger */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{form.date || 'Select Date'}</Text>
        </TouchableOpacity>
        <FieldError field="date" />

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* ── Contact Details Card ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Details</Text>

        {/* Contact name */}
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          onChangeText={t => updateForm('contactName', t)}
          onBlur={() => validateField('contactName')}
        />
        <FieldError field="contactName" />

        {/* Contact phone number */}
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          onChangeText={t => updateForm('contactNumber', t)}
          onBlur={() => validateField('contactNumber')}
        />
        <FieldError field="contactNumber" />
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

export default CreatePost;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f5e9',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleBtn: {
    padding: 10,
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#F5A623',
  },
  activeText: {
    color: '#fff',
  },
  inactiveText: {
    color: '#777',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  option: {
    flex: 1,
    padding: 10,
    backgroundColor: '#eee',
    margin: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: '#F5A623',
  },
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
    marginBottom: 10,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  dropdownItemActive: {
    backgroundColor: '#F5A623',
  },
  dropdownItemActiveText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 10,
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 10,
    borderRadius: 8,
  },
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
    marginTop: 20,
    marginBottom: 30,
  },
  backBtn: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 15,
    marginRight: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#F5A623',
    padding: 15,
    marginLeft: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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