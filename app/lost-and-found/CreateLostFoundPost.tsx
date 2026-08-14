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
import { createAnimalPost } from '../../services/lostAndFoundService';

// Centralized color tokens used across all components and styles
const C = {
  bg: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceLow: '#F3F4F5',
  primary: '#FFD700',
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

  // All form field values stored in a single state object
  const [form, setForm] = useState({
    status: 'lost' as 'lost' | 'found',   // Whether this is a lost or found report
    type: 'dog' as 'dog' | 'cat' | 'other', // Animal type selection
    customType: '',     // Used when type is "other"
    breed: '',          // Selected breed for dog or cat
    name: '',           // Pet's name (optional)
    description: '',    // Description of the animal
    location: '',       // Last seen / found location
    date: '',           // Date of incident as a string
    contactName: '',    // Reporter's full name
    contactNumber: '',  // Reporter's phone number
    images: [] as string[], // Array holding the picked image URI (max 1)
  });

  const [breedDropdownOpen, setBreedDropdownOpen] = useState(false); // Controls breed dropdown visibility
  const [showDatePicker, setShowDatePicker] = useState(false);       // Controls date picker visibility
  const [dateObj, setDateObj] = useState(new Date());                // Date object used by DateTimePicker
  const [errors, setErrors] = useState<Record<string, string>>({});  // Per-field validation error messages
  const [errorMessage, setErrorMessage] = useState('');              // Global error banner message
  const [isSubmitting, setIsSubmitting] = useState(false);           // Disables submit button while API call is in progress

  // Updates a single form field and clears its error and the global banner
  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    if (errorMessage) setErrorMessage('');
  };

  // Sets the global error banner text and shows a native Alert dialog
  const showValidationError = (message: string) => {
    setErrorMessage(message);
    Alert.alert('Validation', message);
  };

  // Requests media library permission, opens the picker with crop UI, then resizes the result to 1200px wide
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission is needed to choose images from your library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      allowsEditing: true,   // Opens the native crop UI
      aspect: [4, 3],        // Crop aspect ratio
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;

      // Resize and compress the picked image for consistent upload size
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      updateForm('images', [manipulated.uri]); // Store only the processed image URI
    }
  };

  // Clears the selected image from the form
  const removeImage = () => updateForm('images', []);

  // Handles date picker selection — closes picker, stores date, and validates it is not in the future
  const handleDateChange = (event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setDateObj(selected);
      updateForm('date', selected.toDateString());

      // Validate the selected date is not in the future
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

  // Validates a single field on blur and sets its error message if invalid
  const validateField = (field: string) => {
    let message = '';
    switch (field) {
      case 'customType':
        // Required only when animal type is "other"
        if (form.type === 'other' && !form.customType.trim())
          message = 'Please enter the animal type.';
        break;
      case 'breed':
        // Required only for dogs and cats
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
          // Reject future dates
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
          // Validates Sri Lankan mobile number format: 07XXXXXXXX
          message = 'Enter a valid Sri Lankan phone number (07XXXXXXXX).';
        break;
    }
    setErrors(prev => ({ ...prev, [field]: message }));
    return !message; // Returns true if field is valid
  };

  // Validates all fields at once before submission — returns false if any field fails
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

    // Image is required — at least one must be uploaded
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
    const firstError = Object.values(validationErrors).find(Boolean); // Get first error message
    if (firstError) { showValidationError(firstError); return false; }
    return true;
  };

  // Validates form, calls the API, resets fields on success, then navigates to the success screen
  const handleSubmit = async () => {
    if (!validateForm()) return; // Stop if any validation fails
    setIsSubmitting(true);
    try {
      await createAnimalPost(form);

      // Reset all form fields after a successful submission
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

      router.push('/lost-and-found/PostSubmittedSuccessView'); // Navigate to success screen
    } catch (error: any) {
      // Show backend error message or a generic fallback
      const message = error?.response?.data?.message || 'Failed to create post. Please try again.';
      showValidationError(message);
    } finally {
      setIsSubmitting(false); // Re-enable submit button regardless of outcome
    }
  };

  // Predefined breed options for dogs
  const dogBreeds = [
    'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog',
    'Poodle', 'Beagle', 'Bulldog', 'Rottweiler', 'Yorkshire Terrier', 'Doberman', 'Unknown',
  ];
  // Predefined breed options for cats
  const catBreeds = [
    'Persian', 'Siamese', 'Bengal', 'Maine Coon', 'Ragdoll', 'Sphynx',
    'British Shorthair', 'Scottish Fold', 'American Shorthair', 'Abyssinian', 'Unknown',
  ];

  // Renders an uppercase spaced label above each form field
  const FieldLabel = ({ text }: { text: string }) => (
    <Text style={s.fieldLabel}>{text.toUpperCase()}</Text>
  );

  // Renders a red error message below a field only if that field has an error
  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <Text style={s.fieldError}>{errors[field]}</Text> : null;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Back arrow — navigates to the previous screen */}
      <TouchableOpacity style={s.backIconBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={C.textMain} />
      </TouchableOpacity>

      {/* Page title and subtitle */}
      <View style={s.titleBlock}>
        <Text style={s.headerTitle}>Lost or Found a Pet?</Text>
        <Text style={s.headerSub}>
          Fill in the details below to post a report and help reunite animals with their families.
        </Text>
      </View>

      {/* Global error banner — shown when validation fails on submit */}
      {errorMessage ? (
        <View style={s.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={C.error} />
          <Text style={s.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* SECTION 1 — Toggle between "Lost" and "Found" report type */}
      <View style={s.card}>
        <FieldLabel text="Report Type" />
        <View style={s.toggleWrapper}>
          {(['lost', 'found'] as const).map(item => (
            <TouchableOpacity
              key={item}
              style={[s.toggleBtn, form.status === item && s.toggleBtnActive]} // Highlight active toggle
              onPress={() => updateForm('status', item)}
            >
              <Text style={[s.toggleText, form.status === item && s.toggleTextActive]}>
                {item === 'lost' ? 'Lost' : 'Found'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* SECTION 2 — Animal details: type, breed, name, description, photo */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Animal Details</Text>

        {/* Animal type chips: Dog / Cat / Other */}
        <FieldLabel text="Animal Type" />
        <View style={s.typeRow}>
          {(['dog', 'cat', 'other'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeBtn, form.type === t && s.typeBtnActive]}
              onPress={() => {
                updateForm('type', t);
                updateForm('breed', '');       // Reset breed when type changes
                updateForm('customType', '');  // Reset custom type when type changes
                setBreedDropdownOpen(false);   // Close dropdown if open
              }}
            >
              <Text style={[s.typeBtnText, form.type === t && s.typeBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)} {/* Capitalize first letter */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom type text input — only shown when "Other" is selected */}
        {form.type === 'other' && (
          <View style={s.fieldGroup}>
            <FieldLabel text="Specify Animal Type" />
            <TextInput
              style={[s.input, errors.customType && s.inputError]}
              placeholder="e.g. Rabbit, Parrot…"
              placeholderTextColor={C.textPlaceholder}
              onChangeText={t => updateForm('customType', t)}
              onBlur={() => validateField('customType')} // Validate when user leaves the field
              value={form.customType}
            />
            <FieldError field="customType" />
          </View>
        )}

        {/* Breed dropdown — only shown for dog or cat */}
        {(form.type === 'dog' || form.type === 'cat') && (
          <View style={s.fieldGroup}>
            <FieldLabel text="Breed" />
            {/* Tapping the trigger toggles the dropdown list open/closed */}
            <TouchableOpacity
              style={[s.input, s.dropdownTrigger, errors.breed && s.inputError]}
              onPress={() => setBreedDropdownOpen(p => !p)}
            >
              <Text style={form.breed ? s.inputText : s.placeholder}>
                {form.breed || `Select ${form.type} breed`}
              </Text>
              {/* Chevron flips direction based on open/closed state */}
              <Ionicons
                name={breedDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={C.textSub}
              />
            </TouchableOpacity>

            {/* Scrollable list of breed options — visible only when dropdown is open */}
            {breedDropdownOpen && (
              <View style={s.dropdownList}>
                {(form.type === 'dog' ? dogBreeds : catBreeds).map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[s.dropdownItem, form.breed === b && s.dropdownItemActive]} // Highlight selected breed
                    onPress={() => {
                      updateForm('breed', b);
                      setBreedDropdownOpen(false);                   // Close after selection
                      setErrors(prev => ({ ...prev, breed: '' }));   // Clear breed error
                    }}
                  >
                    <Text style={[s.dropdownItemText, form.breed === b && s.dropdownItemTextActive]}>
                      {b}
                    </Text>
                    {/* Checkmark icon shown next to the currently selected breed */}
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

        {/* Pet name — optional free text field */}
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

        {/* Description — multiline, minimum 10 characters */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Description" />
          <TextInput
            style={[s.input, s.textArea, errors.description && s.inputError]}
            placeholder="Identifying marks, collar colour, personality…"
            placeholderTextColor={C.textPlaceholder}
            multiline
            textAlignVertical="top" // Keeps cursor at the top of the multiline input
            onChangeText={t => updateForm('description', t)}
            onBlur={() => validateField('description')}
            value={form.description}
          />
          <FieldError field="description" />
        </View>

        {/* Photo upload — shows upload box if no image, preview with remove/change if image exists */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Photo" />
          {form.images.length === 0 ? (
            // Empty state: dashed upload box with camera icon
            <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
              <View style={s.uploadIconCircle}>
                <Ionicons name="camera-outline" size={26} color={C.amber} />
              </View>
              <Text style={s.uploadTitle}>Upload a photo</Text>
              <Text style={s.uploadSub}>Tap to pick & crop from your library</Text>
            </TouchableOpacity>
          ) : (
            // Preview state: shows selected image with remove (X) and change (pencil) buttons
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

      {/* SECTION 3 — Location: address input, map placeholder, and date picker */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Location</Text>

        <View style={s.fieldGroup}>
          <FieldLabel text="Last Seen Location" />
          {/* Location icon overlaid on the left side of the input */}
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

        {/* Static map placeholder — no live map integration yet */}
        <View style={s.mapBox}>
          <Ionicons name="map-outline" size={32} color={C.textPlaceholder} />
          <Text style={s.mapText}>Google Map Preview</Text>
        </View>

        {/* Date picker trigger — tapping opens the native date picker */}
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

        {/* Native date picker — spinner on iOS, calendar on Android; max date is today */}
        {showDatePicker && (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()} // Prevents selecting future dates
            onChange={handleDateChange}
          />
        )}
      </View>

      {/* SECTION 4 — Reporter contact details */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Reporter Details</Text>

        {/* Reporter's full name — minimum 2 characters */}
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

        {/* Sri Lankan phone number — must match 07XXXXXXXX format */}
        <View style={s.fieldGroup}>
          <FieldLabel text="Contact Number" />
          <TextInput
            style={[s.input, errors.contactNumber && s.inputError]}
            placeholder="07XXXXXXXX"
            placeholderTextColor={C.textPlaceholder}
            keyboardType="phone-pad" // Opens numeric keyboard
            onChangeText={t => updateForm('contactNumber', t)}
            onBlur={() => validateField('contactNumber')}
            value={form.contactNumber}
          />
          <FieldError field="contactNumber" />
        </View>
      </View>

      {/* Bottom action row — Back button (left) and Submit button (right) */}
      <View style={s.actions}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]} // Grey out while submitting
          onPress={handleSubmit}
          disabled={isSubmitting} // Prevents double submission
        >
          <Text style={s.submitBtnText}>
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      {/* Bottom spacer so content clears the action buttons */}
    </ScrollView>
  );
};

export default CreatePost;

const s = StyleSheet.create({
  // Root scrollable screen container
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Top-left back arrow button
  backIconBtn: {
    padding: 16,
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },

  // Page title and subtitle block
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

  // Red banner shown at the top when form submission fails
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

  // White rounded section card with subtle shadow
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
  // Bold section heading inside each card
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textMain,
    marginBottom: 16,
  },

  // Wrapper that adds bottom margin between consecutive fields
  fieldGroup: {
    marginBottom: 14,
  },
  // Small uppercase spaced label rendered above each input
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: C.textSub,
    marginBottom: 6,
  },
  // Red inline error text displayed below an invalid field
  fieldError: {
    color: C.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Pill-shaped toggle row for Lost / Found selection
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
  },
  // Amber highlight applied to the active toggle button
  toggleBtnActive: {
    backgroundColor: '#fac165ff',
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
  // White text on the active toggle for contrast
  toggleTextActive: {
    color: '#FFFFFF',
  },

  // Horizontal row of animal type chip buttons
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
  // Gold border and light yellow background for the active type chip
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

  // Base style for all text inputs — bordered, rounded, light background
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
  // Red border and light pink background applied when a field has an error
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
  // Taller input variant for multiline description field
  textArea: {
    height: 110,
    paddingTop: 13,
  },

  // Relative wrapper that lets the icon be absolutely positioned inside the input
  inputIconWrapper: {
    position: 'relative',
  },
  // Icon sits in the absolute left inside the input wrapper
  inputIcon: {
    position: 'absolute',
    left: 13,
    top: 14,
    zIndex: 1,
  },
  // Extra left padding so text doesn't overlap the icon
  inputWithIcon: {
    paddingLeft: 38,
  },

  // Row layout for dropdown trigger (selected value + chevron icon)
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Floating dropdown list below the trigger with shadow
  dropdownList: {
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: C.outline,
    borderRadius: 10,
    backgroundColor: C.surface,
    overflow: 'hidden',
    maxHeight: 220,  // Limits list height to avoid pushing content off screen
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  // Each breed option row inside the dropdown
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceLow,
  },
  // Gold background for the currently selected breed item
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

  // Dashed amber-tinted box shown when no image has been selected yet
  uploadBox: {
    borderWidth: 2,
    borderColor: C.outline,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: C.amberDim,
  },
  // Circular amber icon container inside the upload box
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
  // Wrapper for the image preview — overflow visible so floating buttons show outside
  imagePreviewWrapper: {
    borderRadius: 14,
    overflow: 'visible',
  },
  // Full-width preview of the selected image at fixed height
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  // Dark circular X button overlaid in the top-right corner of the preview
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
  // White pill button overlaid at the bottom-right for changing the image
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

  // Horizontal layout for the calendar icon and date text inside the date picker trigger
  dateInner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  // Grey placeholder box where a map preview would appear
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

  // Horizontal row holding the Back and Submit buttons
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4,
  },
  // Outlined secondary back button (takes 1 flex unit)
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
  // Gold filled primary submit button (takes 2 flex units — wider than back)
  submitBtn: {
    flex: 2,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
  },
  // Grey submit button shown while the form is being submitted
  submitBtnDisabled: {
    backgroundColor: '#E2DFD4',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.onPrimaryContainer,
  },
});