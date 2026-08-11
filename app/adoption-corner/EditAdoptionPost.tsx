import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { getPostById, updatePost } from "@/services/adoptionService";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "Dog" | "Cat" | "Other";
type Gender = "Male" | "Female";
type Status = "Available" | "Pending" | "Adopted";
type HealthStatus = "Healthy" | "Needs Care" | "Under Treatment" | "Special Needs";

const BREEDS_BY_CATEGORY: Record<Category, string[]> = {
  Dog: ["Golden Retriever", "Labrador", "Beagle", "Husky", "Poodle", "Bulldog", "German Shepherd"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "Sphynx", "British Shorthair"],
  Other: ["Rabbit", "Hamster", "Guinea Pig", "Parrot", "Turtle", "Fish", "Ferret"],
};

const GENDERS: Gender[] = ["Male", "Female"];
const STATUSES: Status[] = ["Available", "Pending", "Adopted"];
const HEALTH_STATUSES: HealthStatus[] = ["Healthy", "Needs Care", "Under Treatment", "Special Needs"];
const TRAITS = ["Vaccinated", "Neutered", "Microchipped", "House trained", "Good with kids", "Good with pets"];

type Errors = {
  name?: string;
  age?: string;
  description?: string;
  customCategory?: string;
  posterName?: string;
  contact?: string;
  location?: string;
};

// ─── InlinePicker ─────────────────────────────────────────────────────────────

function InlinePicker({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={picker.wrapper}>
      {label !== "" && <Text style={picker.label}>{label}</Text>}
      <TouchableOpacity
        style={picker.trigger}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Text style={picker.triggerText}>{selected}</Text>
        <MaterialIcons
          name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color="#807663"
        />
      </TouchableOpacity>
      {open && (
        <View style={picker.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[picker.option, selected === opt && picker.optionActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[picker.optionText, selected === opt && picker.optionTextActive]}>
                {opt}
              </Text>
              {selected === opt && (
                <MaterialIcons name="check" size={16} color="#785a00" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function EditAdoptionPost() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  // ── Loading / fetch state ─────────────────────────────────────────────────
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Form state (pre-filled from API) ─────────────────────────────────────
  const [category, setCategory] = useState<Category>("Dog");
  const [customCategory, setCustomCategory] = useState("");
  const [breed, setBreed] = useState("Golden Retriever");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("Available");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("Healthy");
  const [description, setDescription] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [posterName, setPosterName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // ── Images — mix of existing Cloudinary URLs + new local URIs ────────────
  const [existingImages, setExistingImages] = useState<string[]>([]); // already on Cloudinary
  const [newImages, setNewImages] = useState<string[]>([]);           // newly picked local URIs

  const [errors, setErrors] = useState<Errors>({});

  const handleGetLocation = async () => {
    try {
      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to detect your location.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const addr = [item.name, item.street, item.city, item.region].filter(Boolean).join(", ");
        const finalAddr = addr || `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
        setLocation(finalAddr);
        setErrors((prev) => ({ ...prev, location: undefined }));
      } else {
        setLocation(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
        setErrors((prev) => ({ ...prev, location: undefined }));
      }
    } catch (e) {
      Alert.alert("Location Error", "Could not detect location. Please type manually.");
    }
  };

  // ── Fetch existing post and pre-fill form ─────────────────────────────────
  useEffect(() => {
    if (!postId) return;
    getPostById(postId)
      .then((post) => {
        // Pre-fill all fields from the fetched post
        setCategory((post.category as Category) ?? "Dog");
        setCustomCategory(post.customCategory ?? "");
        setBreed(post.breed);
        setAge(post.age);
        setGender((post.gender as Gender) ?? "Male");
        setName(post.name);
        setStatus((post.status as Status) ?? "Available");
        setHealthStatus((post.healthStatus as HealthStatus) ?? "Healthy");
        setDescription(post.description);
        setSelectedTraits(post.traits ?? []);
        setPosterName(post.posterName);
        setContact(post.contact);
        setNotes(post.notes ?? "");
        setLocation(post.location ?? "");
        setExistingImages(post.images ?? []);
      })
      .catch(() => setFetchError("Could not load post for editing."))
      .finally(() => setFetching(false));
  }, [postId]);

  // ── Category change ───────────────────────────────────────────────────────
  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setBreed(BREEDS_BY_CATEGORY[cat][0]);
    setCustomCategory("");
    setErrors((prev) => ({ ...prev, customCategory: undefined }));
  };

  // ── Remove existing (Cloudinary) image ────────────────────────────────────
  const handleRemoveExisting = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Remove newly picked local image ───────────────────────────────────────
  const handleRemoveNew = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Add new images from gallery ───────────────────────────────────────────
  const handleAddImage = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= 6) {
      Alert.alert("Limit reached", "You can have at most 6 photos per post.");
      return;
    }

    const { status: permStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6 - totalImages,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setNewImages((prev) => [...prev, ...uris].slice(0, 6 - existingImages.length));
    }
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!name.trim()) newErrors.name = "Pet name is required.";
    if (!age.trim()) {
      newErrors.age = "Age is required.";
    } else if (!/^\d+(\s*(year|years|month|months|week|weeks))?$/i.test(age.trim())) {
      newErrors.age = "Enter a valid age (e.g. 2 years, 6 months).";
    }
    if (!description.trim()) {
      newErrors.description = "Please add a description.";
    } else if (description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters.";
    }
    if (category === "Other" && !customCategory.trim()) {
      newErrors.customCategory = "Please specify the animal type.";
    }
    if (!posterName.trim()) newErrors.posterName = "Your name is required.";
    if (!contact.trim()) {
      newErrors.contact = "Contact info is required.";
    } else if (!/^\+?[\d\s\-().]{7,}$/.test(contact.trim())) {
      newErrors.contact = "Enter a valid phone number.";
    }
    if (!location.trim()) newErrors.location = "Location is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit update ─────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!validate()) {
      Alert.alert("Please fix the errors", "Some required fields are missing or invalid.");
      return;
    }

    try {
      setSubmitting(true);

      // updatePost:
      // - existingImages already have Cloudinary URLs — pass as-is
      // - newImages are local URIs — apiService uploads them to Cloudinary
      await updatePost(
        postId!,
        {
          category,
          customCategory: customCategory.trim() || undefined,
          breed,
          age,
          gender,
          name,
          status,
          healthStatus,
          description,
          traits: selectedTraits,
          location,
          posterName,
          contact,
          notes: notes.trim() || undefined,
        },
        newImages, // new local URIs to upload
        existingImages // retained Cloudinary URLs
      );

      Alert.alert("Updated!", "Your post has been updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Update Failed", "Could not update your post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES: { label: Category; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: "Dog", icon: "pets" },
    { label: "Cat", icon: "emoji-nature" },
    { label: "Other", icon: "category" },
  ];

  const totalImages = existingImages.length + newImages.length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#785a00" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </View>
    );
  }

  // ── Fetch error ───────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <View style={styles.centeredState}>
        <MaterialIcons name="error-outline" size={48} color="#d2c5af" />
        <Text style={styles.errorStateText}>{fetchError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={24} color="#785a00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Animal Details Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="pets" size={20} color="#785a00" />
            <Text style={styles.cardTitle}>ANIMAL DETAILS</Text>
          </View>

          <View style={styles.categoryRow}>
            {CATEGORIES.map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={[styles.categoryBtn, category === label && styles.categoryBtnActive]}
                onPress={() => handleCategoryChange(label)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={icon}
                  size={24}
                  color={category === label ? "#785a00" : "#807663"}
                />
                <Text style={[styles.categoryLabel, category === label && styles.categoryLabelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {category === "Other" && (
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>
                Animal Type <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.customCategory ? styles.inputError : null]}
                placeholder="e.g. Rabbit, Parrot, Turtle..."
                placeholderTextColor="#b0a895"
                value={customCategory}
                onChangeText={(v) => {
                  setCustomCategory(v);
                  if (v.trim()) setErrors((prev) => ({ ...prev, customCategory: undefined }));
                }}
              />
              {errors.customCategory && (
                <Text style={styles.errorText}>{errors.customCategory}</Text>
              )}
            </View>
          )}

          {/* Breed & Age */}
          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Breed</Text>
                <InlinePicker
                  label=""
                  options={BREEDS_BY_CATEGORY[category]}
                  selected={breed}
                  onSelect={setBreed}
                />
              </View>
            </View>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>
                  Age <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, errors.age ? styles.inputError : null]}
                  placeholder="e.g. 2 years"
                  placeholderTextColor="#b0a895"
                  value={age}
                  onChangeText={(v) => {
                    setAge(v);
                    if (v.trim()) setErrors((prev) => ({ ...prev, age: undefined }));
                  }}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>
            </View>
          </View>

          {/* Gender & Name */}
          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Gender</Text>
                <InlinePicker
                  label=""
                  options={GENDERS}
                  selected={gender}
                  onSelect={(v) => setGender(v as Gender)}
                />
              </View>
            </View>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>
                  Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.textInput, errors.name ? styles.inputError : null]}
                  placeholder="Buddy"
                  placeholderTextColor="#b0a895"
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    if (v.trim()) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
            </View>
          </View>

          {/* Status & Health Status */}
          <View style={styles.inputGrid}>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Status</Text>
                <InlinePicker
                  label=""
                  options={STATUSES}
                  selected={status}
                  onSelect={(v) => setStatus(v as Status)}
                />
              </View>
            </View>
            <View style={styles.inputHalf}>
              <View style={styles.inputBlock}>
                <Text style={styles.inputLabel}>Health Status</Text>
                <InlinePicker
                  label=""
                  options={HEALTH_STATUSES}
                  selected={healthStatus}
                  onSelect={(v) => setHealthStatus(v as HealthStatus)}
                />
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea, errors.description ? styles.inputError : null]}
              placeholder="Describe your pet's personality, habits and needs..."
              placeholderTextColor="#b0a895"
              value={description}
              onChangeText={(v) => {
                setDescription(v);
                if (v.trim().length >= 20)
                  setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.descFooter}>
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : (
                <Text style={styles.charHint}>Min. 20 characters</Text>
              )}
              <Text style={styles.charCount}>{description.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Photos Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="image" size={20} color="#785a00" />
            <Text style={styles.cardTitle}>PHOTOS</Text>
            <Text style={styles.photoCount}>{totalImages}/6</Text>
          </View>

          <View style={styles.imageGrid}>
            {/* Existing Cloudinary images */}
            {existingImages.map((uri, index) => (
              <View key={`existing-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveExisting(index)}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
                {index === 0 && newImages.length === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
              </View>
            ))}

            {/* New local images */}
            {newImages.map((uri, index) => (
              <View key={`new-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveNew(index)}
                >
                  <MaterialIcons name="close" size={14} color="#fff" />
                </TouchableOpacity>
                {/* New badge to distinguish from existing */}
                <View style={[styles.mainBadge, { backgroundColor: "#4CAF50" }]}>
                  <Text style={styles.mainBadgeText}>New</Text>
                </View>
              </View>
            ))}

            {/* Add more button */}
            {totalImages < 6 && (
              <TouchableOpacity
                style={styles.addMoreBtn}
                onPress={handleAddImage}
                activeOpacity={0.75}
              >
                <MaterialIcons name="add" size={28} color="#785a00" />
                <Text style={styles.addMoreText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {totalImages > 0 && totalImages < 6 && (
            <Text style={styles.uploadHint}>
              Tap + to add more · Tap × to remove · Green badge = newly added
            </Text>
          )}
        </View>

        {/* ── Traits Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TRAITS</Text>
          <View style={styles.traitsWrap}>
            {TRAITS.map((trait) => {
              const active = selectedTraits.includes(trait);
              return (
                <TouchableOpacity
                  key={trait}
                  style={[styles.traitChip, active && styles.traitChipActive]}
                  onPress={() => toggleTrait(trait)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.traitText, active && styles.traitTextActive]}>
                    {trait}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Poster Details Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color="#785a00" />
            <Text style={styles.cardTitle}>POSTER DETAILS</Text>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Your Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.posterName ? styles.inputError : null]}
              placeholder="John Doe"
              placeholderTextColor="#b0a895"
              value={posterName}
              onChangeText={(v) => {
                setPosterName(v);
                if (v.trim()) setErrors((prev) => ({ ...prev, posterName: undefined }));
              }}
            />
            {errors.posterName && <Text style={styles.errorText}>{errors.posterName}</Text>}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Contact Info <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.iconInputWrapper}>
              <MaterialIcons name="call" size={18} color="#807663" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, styles.iconInput, errors.contact ? styles.inputError : null]}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#b0a895"
                value={contact}
                onChangeText={(v) => {
                  setContact(v);
                  if (v.trim()) setErrors((prev) => ({ ...prev, contact: undefined }));
                }}
                keyboardType="phone-pad"
              />
            </View>
            {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Any additional info for potential adopters..."
              placeholderTextColor="#b0a895"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Location Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LOCATION <Text style={styles.required}>*</Text></Text>
          <View style={styles.mapBox}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu3cfeFn7G_kQsexvytUehje9uLtUEo8kKEu-w0C2RRNEIXI0pWRSp9IN9NQFpi4K3T-9n13UfE-vhuyL0X0Tz3pbO7ozRKvFJBMP0UlGrsjmIXtSlmcFlk4nTDG6FUPpgbOdxuYpcd370ZdiHJqO4nHCYNf-eNGYyYfKVYAiBEjnDocVjGUwGeHbYIaJxE_f6OB-nbVWBi-mBKC5s6ra9dwI1AKYxEWpLBJllOTLpuT39afingzPUylG-ZgbUzvZfMAVUVzvsKZjM",
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.mapLocationBtn} onPress={handleGetLocation} activeOpacity={0.8}>
              <MaterialIcons name="my-location" size={22} color="#785a00" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.iconInputWrapper}>
              <MaterialIcons
                name="location-on"
                size={18}
                color="#785a00"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.textInput,
                  styles.iconInput,
                  errors.location ? styles.inputError : null,
                ]}
                value={location}
                onChangeText={(v) => {
                  setLocation(v);
                  if (v.trim()) setErrors((prev) => ({ ...prev, location: undefined }));
                }}
                editable={true}
                placeholder="Enter or detect location..."
                placeholderTextColor="#b0a895"
              />
            </View>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          disabled={submitting}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.submitLoading}>
              <ActivityIndicator size="small" color="#785a00" />
              <Text style={styles.saveBtnText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  centeredState: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: "#f1fbff", gap: 12, padding: 24,
  },
  loadingText: { fontSize: 14, color: "#807663" },
  errorStateText: { fontSize: 15, color: "#807663", textAlign: "center" },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 24, backgroundColor: "#785a00",
  },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: "#f1fbff", borderBottomWidth: 1, borderBottomColor: "#d2c5af",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: "#eaf5fa",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#131d21" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    fontSize: 12, fontWeight: "700", color: "#131d21",
    letterSpacing: 1, textTransform: "uppercase", flex: 1,
  },
  photoCount: { fontSize: 12, fontWeight: "600", color: "#807663" },

  categoryRow: { flexDirection: "row", gap: 10 },
  categoryBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: "#d2c5af", backgroundColor: "#f1fbff", gap: 4,
  },
  categoryBtnActive: { borderColor: "#f9c74f", backgroundColor: "#fff9e6" },
  categoryLabel: { fontSize: 12, fontWeight: "600", color: "#807663" },
  categoryLabelActive: { color: "#785a00" },

  inputGrid: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  inputBlock: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#586062", paddingLeft: 2 },
  required: { color: "#ba1a1a" },
  textInput: {
    borderWidth: 1, borderColor: "#d2c5af", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: "#131d21", backgroundColor: "#fff",
  },
  inputError: { borderColor: "#ba1a1a", backgroundColor: "#fff8f8" },
  textArea: { minHeight: 90 },
  iconInputWrapper: { flexDirection: "row", alignItems: "center", position: "relative" },
  inputIcon: { position: "absolute", left: 12, zIndex: 1 },
  iconInput: { flex: 1, paddingLeft: 38 },
  errorText: { fontSize: 12, color: "#ba1a1a", paddingLeft: 2, marginTop: 2 },
  charHint: { fontSize: 11, color: "#807663" },
  charCount: { fontSize: 11, color: "#807663" },
  descFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  imageWrapper: { width: 96, height: 96, borderRadius: 10, overflow: "hidden", position: "relative" },
  imageThumb: { width: "100%", height: "100%", borderRadius: 10, backgroundColor: "#e4f0f4" },
  removeImageBtn: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10,
    width: 20, height: 20, alignItems: "center", justifyContent: "center",
  },
  mainBadge: {
    position: "absolute", bottom: 4, left: 4,
    backgroundColor: "#785a00", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  mainBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  addMoreBtn: {
    width: 96, height: 96, borderRadius: 10, borderWidth: 2,
    borderStyle: "dashed", borderColor: "#d2c5af",
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#f1fbff", gap: 2,
  },
  addMoreText: { fontSize: 11, fontWeight: "600", color: "#785a00" },
  uploadHint: { fontSize: 12, color: "#807663", textAlign: "center" },

  traitsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  traitChip: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#d2c5af", backgroundColor: "#f1fbff",
  },
  traitChipActive: { backgroundColor: "#f9c74f", borderColor: "#785a00" },
  traitText: { fontSize: 13, fontWeight: "600", color: "#586062" },
  traitTextActive: { color: "#785a00" },

  mapBox: {
    height: 180, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: "#d2c5af", position: "relative",
  },
  mapImage: { width: "100%", height: "100%" },
  mapLocationBtn: {
    position: "absolute", bottom: 10, right: 10,
    backgroundColor: "#fff", padding: 8, borderRadius: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },

  footer: {
    flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: "#f1fbff", borderTopWidth: 1, borderTopColor: "#d2c5af",
  },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    borderWidth: 1.5, borderColor: "#807663", alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#131d21" },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    backgroundColor: "#f9c74f", alignItems: "center",
    shadowColor: "#785a00", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  submitLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#785a00" },
});

const picker = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600", color: "#586062", paddingLeft: 2 },
  trigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#d2c5af", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#fff",
  },
  triggerText: { fontSize: 14, color: "#131d21" },
  dropdown: {
    borderWidth: 1, borderColor: "#d2c5af", borderRadius: 10,
    backgroundColor: "#fff", overflow: "hidden", marginTop: -4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: "#f0ede6",
  },
  optionActive: { backgroundColor: "#fff9e6" },
  optionText: { fontSize: 14, color: "#131d21" },
  optionTextActive: { color: "#785a00", fontWeight: "600" },
});