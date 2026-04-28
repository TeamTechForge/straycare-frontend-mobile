import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImageManipulator from 'expo-image-manipulator';
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
import { createAnimalPost } from '../../api/api';

// ─── Colour tokens (mirrors the HTML reference) ─────────────────────────────
const C = {
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceLow: '#F3F4F5',
  primary: '#FFD700',          // amber/gold
  primaryContainer: '#FFF3C4',
  onPrimaryContainer: '#705E00',
  outline: '#E2E0D6',
  textMain: '#191C1D',
  textSub: '#6B6652',
  textPlaceholder: '#A8A497',
  error: '#B00020',
  errorBg: '#FFF0F0',
  amber: '#F5A623',
  amberDim: '#FFF8E7',
};

const CreatePost = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    status: 'lost' as 'lost' | 'found',
    type: 'dog' as 'dog' | 'cat' | 'other',
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

  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  const showValidationError = (message: string) => {
    setErrorMessage(message);
    Alert.alert('Validation', message);
  };

  // ─── Image picker + crop ──────────────────────────────────────────────────
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission is needed to choose images from your library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      allowsEditing: true,   // native crop UI
      aspect: [4, 3],
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      // Additional crop/resize with ImageManipulator for consistency
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      updateForm('images', [manipulated.uri]);
    }
  };

  const removeImage = () => updateForm('images', []);

  // ─── Date picker handler ──────────────────────────────────────────────────
  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      updateForm('date', selected.toDateString());

      // Revalidate date immediately after selection
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected > today) {
        setErrors(prev => ({ ...prev, date: 'Date cannot be in the future.' }));
      } else {
        setErrors(prev => ({ ...prev, date: '' }));
      }
    }
  };

  // ─── Field-level validation ───────────────────────────────────────────────
  const validateField = (field: string) => {
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
        if (!form.description.trim()) message = 'Please enter a description.';
        else if (form.description.trim().length < 10)
          message = 'Description must be at least 10 characters.';
        break;
      case 'location':
        if (!form.location.trim()) message = 'Please enter the location.';
        break;
      case 'date':
        if (!form.date) {
          message = 'Please select a date.';
        } else {
          const selected = new Date(form.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selected.setHours(0, 0, 0, 0);
          if (selected > today) message = 'Date cannot be in the future.';
        }
        break;
      case 'contactName':
        if (!form.contactName.trim()) message = 'Please enter your name.';
        else if (form.contactName.trim().length < 2)
          message = 'Name must be at least 2 characters.';
        break;
      case 'contactNumber':
        if (!form.contactNumber.trim())
          message = 'Please enter your contact number.';
        else if (!/^07\d{8}$/.test(form.contactNumber.trim()))
          message = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';
        break;
    }
    setErrors(prev => ({ ...prev, [field]: message }));
    return !message;
  };

  // ─── Full-form validation ─────────────────────────────────────────────────
  const validateForm = () => {
    setErrorMessage('');
    const validationErrors: Record<string, string> = {};

    if (form.type === 'other' && !form.customType.trim())
      validationErrors.customType = 'Please enter the animal type.';

    if ((form.type === 'dog' || form.type === 'cat') && !form.breed)
      validationErrors.breed = 'Please select a breed.';

    if (!form.description.trim())
      validationErrors.description = 'Please enter a description.';
    else if (form.description.trim().length < 10)
      validationErrors.description = 'Description must be at least 10 characters.';

    if (form.images.length === 0)
      validationErrors.images = 'Please upload an image.';

    if (!form.location.trim())
      validationErrors.location = 'Please enter the location.';

    if (!form.date) {
      validationErrors.date = 'Please select a date.';
    } else {
      const selected = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected > today) validationErrors.date = 'Date cannot be in the future.';
    }

    if (!form.contactName.trim())
      validationErrors.contactName = 'Please enter your name.';
    else if (form.contactName.trim().length < 2)
      validationErrors.contactName = 'Name must be at least 2 characters.';

    if (!form.contactNumber.trim())
      validationErrors.contactNumber = 'Please enter your contact number.';
    else if (!/^07\d{8}$/.test(form.contactNumber.trim()))
      validationErrors.contactNumber = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';

    setErrors(validationErrors);
    const firstError = Object.values(validationErrors).find(Boolean);
    if (firstError) { showValidationError(firstError); return false; }
    return true;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await createAnimalPost(form);

      // ── ADD THIS — reset form fields after successful submit ──
      setForm({
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

      const route = form.status === 'lost'
        ? '/lostAndFound/lostAnimalListView'
        : '/lostAndFound/foundAnimalListView';
      router.push(route);
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create post. Please try again.';
      showValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Breed data ───────────────────────────────────────────────────────────
  const dogBreeds = [
    'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
    'Poodle', 'Beagle', 'Bulldog', 'Rottweiler', 'Yorkshire Terrier', 'Doberman', 'Unknown',
  ];
  const catBreeds = [
    'Persian', 'Siamese', 'Bengal', 'Maine Coon', 'Ragdoll', 'Sphynx',
    'British Shorthair', 'Scottish Fold', 'American Shorthair', 'Abyssinian', 'Unknown',
  ];

  // ─── Reusable field components ────────────────────────────────────────────
  const FieldLabel = ({ text }: { text: string }) => (
    <Text style={s.fieldLabel}>{text.toUpperCase()}</Text>
  );

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <Text style={s.fieldError}>{errors[field]}</Text> : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* ── Back arrow ── */}
      <TouchableOpacity style={s.backIconBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={C.textMain} />
      </TouchableOpacity>

      {/* ── Page title block ── */}
      <View style={s.titleBlock}>
        <Text style={s.headerTitle}>Lost or Found a Pet?</Text>
        <Text style={s.headerSub}>
          Fill in the details below to post a report and help reunite animals with their families.
        </Text>
      </View>

      {/* ── Global error banner ── */}
      {errorMessage ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={C.error} />
          <Text style={s.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* ══════════════════════════════════════════════════
          SECTION 1 – REPORT TYPE
      ══════════════════════════════════════════════════ */}
      <View style={s.card}>
        <FieldLabel text="Report Type" />
        <View style={s.toggleWrapper}>
          {(['lost', 'found'] as const).map(item => (
            <TouchableOpacity
              key={item}
              style={[s.toggleBtn, form.status === item && s.toggleBtnActive]}
              onPress={() => updateForm('status', item)}
            >
              <Text style={[s.toggleText, form.status === item && s.toggleTextActive]}>
                {item === 'lost' ? 'Lost' : 'Found'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          SECTION 2 – ANIMAL DETAILS
      ══════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Animal Details</Text>

        {/* Animal type selector */}
        <FieldLabel text="Animal Type" />
        <View style={s.typeRow}>
          {(['dog', 'cat', 'other'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeBtn, form.type === t && s.typeBtnActive]}
              onPress={() => {
                updateForm('type', t);
                updateForm('breed', '');
                updateForm('customType', '');
                setBreedDropdownOpen(false);
              }}
            >
              <Text style={[s.typeBtnText, form.type === t && s.typeBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Other – custom type input */}
        {form.type === 'other' && (
          <View style={s.fieldGroup}>
            <FieldLabel text="Specify Animal Type" />
            <TextInput
              style={[s.input, errors.customType && s.inputError]}
              placeholder="e.g. Rabbit, Parrot…"
              placeholderTextColor={C.textPlaceholder}
              onChangeText={t => updateForm('customType', t)}
              onBlur={() => validateField('customType')}
              value={form.customType}
            />
            <FieldError field="customType" />
          </View>
        )}

        {/* Breed dropdown */}
        {(form.type === 'dog' || form.type === 'cat') && (
          <View style={s.fieldGroup}>
            <FieldLabel text="Breed" />
            <TouchableOpacity
              style={[s.input, s.dropdownTrigger, errors.breed && s.inputError]}
              onPress={() => setBreedDropdownOpen(p => !p)}
            >
              <Text style={form.breed ? s.inputText : s.placeholder}>
                {form.breed || `Select ${form.type} breed`}
              </Text>
              <Ionicons
                name={breedDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={C.textSub}
              />

            </TouchableOpacity>
            {breedDropdownOpen && (
              <View style={s.dropdownList}>
                {(form.type === 'dog' ? dogBreeds : catBreeds).map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[s.dropdownItem, form.breed === b && s.dropdownItemActive]}
                    onPress={() => {
                      updateForm('breed', b);
                      setBreedDropdownOpen(false);
                      setErrors(prev => ({ ...prev, breed: '' }));
                    }}
                  >
                    <Text style={[s.dropdownItemText, form.breed === b && s.dropdownItemTextActive]}>
                      {b}
                    </Text>
                    {form.breed === b && (
                      <Ionicons name="checkmark" size={16} color={C.onPrimaryContainer} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <FieldError field="breed" />
          </View>
        )}

        {/* Pet name */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Pet's Name" />
          <TextInput
            style={s.input}
            placeholder="e.g. Buddy"
            placeholderTextColor={C.textPlaceholder}
            onChangeText={t => updateForm('name', t)}
            value={form.name}
          />
        </View>

        {/* Description */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Description" />
          <TextInput
            style={[s.input, s.textArea, errors.description && s.inputError]}
            placeholder="Identifying marks, collar colour, personality…"
            placeholderTextColor={C.textPlaceholder}
            multiline
            textAlignVertical="top"
            onChangeText={t => updateForm('description', t)}
            onBlur={() => validateField('description')}
            value={form.description}
          />
          <FieldError field="description" />
        </View>

        {/* Photo upload – single image with crop */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Photo" />
          {form.images.length === 0 ? (
            <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
              <View style={s.uploadIconCircle}>
                <Ionicons name="camera-outline" size={26} color={C.amber} />
              </View>
              <Text style={s.uploadTitle}>Upload a photo</Text>
              <Text style={s.uploadSub}>Tap to pick & crop from your library</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.imagePreviewWrapper}>
              <Image source={{ uri: form.images[0] }} style={s.imagePreview} />
              <TouchableOpacity style={s.removeImageBtn} onPress={removeImage}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={s.changeImageBtn} onPress={pickImage}>
                <Ionicons name="pencil" size={13} color={C.amber} />
                <Text style={s.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}
          {errors.images ? <Text style={s.fieldError}>{errors.images}</Text> : null}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════
          SECTION 3 – LOCATION
      ══════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Location</Text>

        <View style={s.fieldGroup}>
          <FieldLabel text="Last Seen Location" />
          <View style={s.inputIconWrapper}>
            <Ionicons name="location-outline" size={18} color={C.textSub} style={s.inputIcon} />
            <TextInput
              style={[s.input, s.inputWithIcon, errors.location && s.inputError]}
              placeholder="Search address or area"
              placeholderTextColor={C.textPlaceholder}
              onChangeText={t => updateForm('location', t)}
              onBlur={() => validateField('location')}
              value={form.location}
            />
          </View>
          <FieldError field="location" />
        </View>

        {/* Map placeholder */}
        <View style={s.mapBox}>
          <Ionicons name="map-outline" size={32} color={C.textPlaceholder} />
          <Text style={s.mapText}>Google Map Preview</Text>
        </View>

        {/* Date picker */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Date" />
          <TouchableOpacity
            style={[s.input, s.dropdownTrigger, errors.date && s.inputError]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={s.dateInner}>
              <Ionicons name="calendar-outline" size={17} color={C.textSub} style={{ marginRight: 8 }} />
              <Text style={form.date ? s.inputText : s.placeholder}>
                {form.date || 'Select date'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={17} color={C.textSub} />
          </TouchableOpacity>
          <FieldError field="date" />
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* ══════════════════════════════════════════════════
          SECTION 4 – CONTACT
      ══════════════════════════════════════════════════ */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Reporter Details</Text>

        <View style={s.fieldGroup}>
          <FieldLabel text="Your Name" />
          <TextInput
            style={[s.input, errors.contactName && s.inputError]}
            placeholder="Full name"
            placeholderTextColor={C.textPlaceholder}
            onChangeText={t => updateForm('contactName', t)}
            onBlur={() => validateField('contactName')}
            value={form.contactName}
          />
          <FieldError field="contactName" />
        </View>

        <View style={s.fieldGroup}>
          <FieldLabel text="Contact Number" />
          <TextInput
            style={[s.input, errors.contactNumber && s.inputError]}
            placeholder="07XXXXXXXX"
            placeholderTextColor={C.textPlaceholder}
            keyboardType="phone-pad"
            onChangeText={t => updateForm('contactNumber', t)}
            onBlur={() => validateField('contactNumber')}
            value={form.contactNumber}
          />
          <FieldError field="contactNumber" />
        </View>
      </View>

      {/* ── Action buttons ── */}
      <View style={s.actions}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={s.submitBtnText}>
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default CreatePost;

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Back arrow
  backIconBtn: {
    padding: 16,
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },

  // Title block
  titleBlock: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textMain,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    color: C.textSub,
    lineHeight: 20,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: C.errorBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: C.error,
    fontSize: 13,
    flex: 1,
  },

  // Cards
  card: {
    backgroundColor: C.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textMain,
    marginBottom: 16,
  },

  // Field wrapper
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: C.textSub,
    marginBottom: 6,
  },
  fieldError: {
    color: C.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Toggle (Lost / Found)
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: C.surfaceLow,
    borderRadius: 12,
    padding: 4,
    marginTop: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    color: 'F5A623',
  },
  toggleBtnActive: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSub,
  },
  toggleTextActive: {
    color: C.textMain,
  },

  // Animal type chips
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: C.surfaceLow,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primary,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSub,
  },
  typeBtnTextActive: {
    color: C.onPrimaryContainer,
  },

  // Inputs
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: C.outline,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: C.surfaceLow,
    fontSize: 14,
    color: C.textMain,
  },
  inputError: {
    borderColor: C.error,
    backgroundColor: '#FFF8F8',
  },
  inputText: {
    color: C.textMain,
    fontSize: 14,
  },
  placeholder: {
    color: C.textPlaceholder,
    fontSize: 14,
  },
  textArea: {
    height: 110,
    paddingTop: 13,
  },

  // Input with left icon
  inputIconWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 13,
    top: 14,
    zIndex: 1,
  },
  inputWithIcon: {
    paddingLeft: 38,
  },

  // Dropdown
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownList: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: C.outline,
    borderRadius: 10,
    backgroundColor: C.surface,
    overflow: 'hidden',
    maxHeight: 220,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceLow,
  },
  dropdownItemActive: {
    backgroundColor: C.primaryContainer,
  },
  dropdownItemText: {
    fontSize: 14,
    color: C.textMain,
  },
  dropdownItemTextActive: {
    color: C.onPrimaryContainer,
    fontWeight: '600',
  },

  // Image upload
  uploadBox: {
    borderWidth: 2,
    borderColor: C.outline,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: C.amberDim,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF3DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMain,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: C.textSub,
  },
  imagePreviewWrapper: {
    borderRadius: 14,
    overflow: 'visible',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 99,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  changeImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.amber,
  },

  // Date row inner layout
  dateInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  // Map placeholder
  mapBox: {
    height: 130,
    backgroundColor: C.surfaceLow,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  mapText: {
    fontSize: 13,
    color: C.textPlaceholder,
  },

  // Action buttons
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4,
  },
  backBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textMain,
  },
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  submitBtnDisabled: {
    backgroundColor: '#E2DFD4',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onPrimaryContainer,
  },
});