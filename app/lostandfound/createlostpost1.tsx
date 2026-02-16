import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PetDetails {
  name?: string;
  breed?: string;
  description?: string;
  type: 'dog' | 'cat' | 'other';
  gender: 'male' | 'female' | 'unknown';
  status: 'lost' | 'found';
}

const dogBreeds = ['Labrador', 'Golden Retriever', 'German Shepherd', 'Bulldog', 'Beagle', 'Husky', 'Pug', 'Dachshund', 'Poodle', 'Dalmatian', 'Mixed Breed'];
const catBreeds = ['Persian', 'Siamese', 'Maine Coon', 'Bengal', 'Ragdoll', 'British Shorthair', 'Tabby', 'Calico', 'Orange', 'Mixed Breed'];
const otherBreeds = ['Rabbit', 'Guinea Pig', 'Hamster', 'Parrot', 'Other'];

const CreateLostPost = () => {
  const router = useRouter();
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);

  const [form, setForm] = useState<PetDetails>({
    type: 'dog',
    gender: 'male',
    status: 'lost',
  });

  const updateForm = (field: keyof PetDetails, value: string) => {
    setForm(prev => ({ ...prev, [field]: value as any }));
  };

  const getBreedOptions = () => {
    switch (form.type) {
      case 'dog':
        return dogBreeds;
      case 'cat':
        return catBreeds;
      default:
        return otherBreeds;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Lost or Found Pet</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Title */}
      <Text style={styles.title}>Every detail helps bring a pet home safely</Text>

      {/* Lost / Found Toggle */}
      <View style={styles.toggleContainer}>
        {['lost', 'found'].map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.toggleButton, form.status === option && styles.activeToggle]}
            onPress={() => updateForm('status', option)}
          >
            <Text style={[styles.toggleText, form.status === option && styles.activeText]}>
              {option === 'lost' ? 'Lost My Pet' : 'Found a Pet'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Animal Details */}
      <Text style={styles.sectionTitle}>Animal Details</Text>

      {/* Animal Type */}
      <Text style={styles.label}>Animal Type</Text>
      <View style={styles.optionRow}>
        {['dog', 'cat', 'other'].map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.optionButton, form.type === type && styles.activeOption]}
            onPress={() => updateForm('type', type)}
          >
            <Text style={[styles.optionText, form.type === type && styles.activeOptionText]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pet Name */}
      <Text style={styles.label}>Pet's Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter pet's name (if known)"
        value={form.name}
        onChangeText={text => updateForm('name', text)}
        placeholderTextColor="#ccc"
      />

      {/* Breed */}
      <Text style={styles.label}>Breed</Text>
      <TouchableOpacity
        style={styles.breedButton}
        onPress={() => setShowBreedDropdown(!showBreedDropdown)}
      >
        <Text style={[styles.breedButtonText, !form.breed && { color: '#ccc' }]}>
          {form.breed || 'Select breed'}
        </Text>
        <Ionicons name={showBreedDropdown ? 'chevron-up' : 'chevron-down'} size={20} color="#ffb700" />
      </TouchableOpacity>

      {showBreedDropdown && (
        <ScrollView style={styles.dropdownMenu} showsVerticalScrollIndicator={false}>
          {getBreedOptions().map(breed => (
            <TouchableOpacity
              key={breed}
              style={styles.dropdownItem}
              onPress={() => {
                updateForm('breed', breed);
                setShowBreedDropdown(false);
              }}
            >
              <Text style={[styles.dropdownText, form.breed === breed && styles.selectedBreed]} numberOfLines={1}>
                {breed}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}


      {/* Gender */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.optionRow}>
        {['male', 'female', 'unknown'].map(g => (
          <TouchableOpacity
            key={g}
            style={[styles.optionButton, form.gender === g && styles.activeOption]}
            onPress={() => updateForm('gender', g)}
          >
            <Text style={[styles.optionText, form.gender === g && styles.activeOptionText]}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe the pet - color, markings, collar, behavior, etc..."
        value={form.description}
        onChangeText={text => updateForm('description', text)}
        multiline
        placeholderTextColor="#ccc"
      />

      {/* Upload Photo Placeholder */}
      <Text style={styles.label}>Upload a photo</Text>
      <TouchableOpacity style={styles.uploadBox}>
        <Text style={styles.uploadText}>Tap to browse gallery</Text>
      </TouchableOpacity>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => router.push('/lostandfound/createlostpost2')}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CreateLostPost;

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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeToggle: {
    backgroundColor: '#ffb700',
    borderWidth: 0,
  },
  toggleText: {
    color: '#999',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 10,
    color: '#000',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  optionRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  activeOption: {
    backgroundColor: '#ffb700',
    borderWidth: 0,
  },
  optionText: {
    color: '#999',
    fontWeight: '500',
    fontSize: 15,
  },
  activeOptionText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  breedButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  breedButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#fff',
    marginTop: -20,
    marginBottom: 20,
    paddingTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  selectedBreed: {
    color: '#ffb700',
    fontWeight: '700',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  uploadText: {
    color: '#999',
    fontSize: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 14,
  },
});
