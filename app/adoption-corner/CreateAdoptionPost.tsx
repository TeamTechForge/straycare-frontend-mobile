import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { createPost } from "@/services/adoptionService";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = "Dog" | "Cat" | "Other";
type Gender = "Male" | "Female";
type Status = "Available" | "Pending" | "Adopted";
type HealthStatus = "Healthy" | "Needs Care" | "Under Treatment" | "Special Needs";

// ─── Breed lists per category ─────────────────────────────────────────────────

const BREEDS_BY_CATEGORY: Record<Category, string[]> = {
  Dog: ["Golden Retriever", "Labrador", "Beagle", "Husky", "Poodle", "Bulldog", "German Shepherd"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "Sphynx", "British Shorthair"],
  Other: ["Rabbit", "Hamster", "Guinea Pig", "Parrot", "Turtle", "Fish", "Ferret"],
};

const GENDERS: Gender[] = ["Male", "Female"];
const STATUSES: Status[] = ["Available", "Pending", "Adopted"];
const HEALTH_STATUSES: HealthStatus[] = ["Healthy", "Needs Care", "Under Treatment", "Special Needs"];
const TRAITS = ["Vaccinated", "Neutered", "Microchipped", "House trained", "Good with kids", "Good with pets"];

// ─── Validation types ─────────────────────────────────────────────────────────

type Errors = {
  name?: string;
  age?: string;
  description?: string;
  customCategory?: string;
  posterName?: string;
  contact?: string;
  images?: string;
};

// ─── InlinePicker ─────────────────────────────────────────────────────────────

function InlinePicker({
  label,
  options,
  selected,
  onSelect,
  error,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={picker.wrapper}>
      {/* Only render label inside picker when explicitly provided (not in grid pairs) */}
      {label !== "" && <Text style={picker.label}>{label}</Text>}
      <TouchableOpacity
        style={[picker.trigger, error ? picker.triggerError : null]}
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
      {error && <Text style={picker.errorText}>{error}</Text>}
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

export default function CreateAdoptionPost() {
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<Category>("Dog");
  const [customCategory, setCustomCategory] = useState("");
  const [breed, setBreed] = useState("Golden Retriever");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("Male");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("Available");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("Healthy");
  const [description, setDescription] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>(["Vaccinated", "Microchipped"]);
  const [posterName, setPosterName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [location] = useState("Central Park South-East, Manhattan, NY");

  // ── Image state — stores local URIs from expo-image-picker ────────────────
  const [images, setImages] = useState<string[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Category change ───────────────────────────────────────────────────────
  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setBreed(BREEDS_BY_CATEGORY[cat][0]);
    setCustomCategory("");
    setErrors((prev) => ({ ...prev, customCategory: undefined }));
  };

  // ── Image picker (expo-image-picker) ──────────────────────────────────────
  const handleAddImage = async () => {
    // Request permission
    const { status: permStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to add images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6 - images.length, // only allow remaining slots
    });

    if (!result.canceled) {
      const newUris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newUris].slice(0, 6));
      setErrors((prev) => ({ ...prev, images: undefined }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Trait toggle ──────────────────────────────────────────────────────────
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
    } else if (
      !/^\d+(\s*(year|years|month|months|week|weeks))?$/i.test(age.trim())
    ) {
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

    if (images.length === 0) newErrors.images = "Please add at least one photo.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit — uploads images to Cloudinary then posts to backend ───────────
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert("Please fix the errors", "Some required fields are missing or invalid.");
      return;
    }

    try {
      setSubmitting(true);

      // createPost handles Cloudinary upload internally
      // just pass local URIs — no manual upload needed here
      const post = await createPost(
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
        images // local URIs from expo-image-picker
      );

      // Navigate to success screen with the real postId from backend
      router.push(`/adoption-corner/AdoptionSubmitSuccess?postId=${post._id}`);
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        "Could not submit your post. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES: { label: Category; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { label: "Dog", icon: "pets" },
    { label: "Cat", icon: "emoji-nature" },
    { label: "Other", icon: "category" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Intro ── */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Find a Forever Home</Text>
          <Text style={styles.introSubtitle}>
            Fill in the details below to help your pet find a loving new family.
          </Text>
        </View>

        {/* ── Animal Details Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="pets" size={20} color="#785a00" />
            <Text style={styles.cardTitle}>ANIMAL DETAILS</Text>
          </View>

          {/* Category selector */}
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

          {/* Custom category — only when Other selected */}
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
            {/* Breed — label rendered outside picker so both sides align */}
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
            {/* Age */}
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
            {/* Gender — label rendered outside picker so both sides align */}
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
            {/* Name */}
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
              <InlinePicker
                label="Status"
                options={STATUSES}
                selected={status}
                onSelect={(v) => setStatus(v as Status)}
              />
            </View>
            <View style={styles.inputHalf}>
              <InlinePicker
                label="Health Status"
                options={HEALTH_STATUSES}
                selected={healthStatus}
                onSelect={(v) => setHealthStatus(v as HealthStatus)}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                errors.description ? styles.inputError : null,
              ]}
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
            <Text style={styles.cardTitle}>
              PHOTOS <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.photoCount}>{images.length}/6</Text>
          </View>

          {errors.images && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color="#ba1a1a" />
              <Text style={styles.errorBannerText}>{errors.images}</Text>
            </View>
          )}

          {/* Image grid */}
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                </View>
              ))}
              {images.length < 6 && (
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
          )}

          {/* Empty upload box */}
          {images.length === 0 && (
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handleAddImage}
              activeOpacity={0.8}
            >
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="add-photo-alternate" size={32} color="#785a00" />
              </View>
              <Text style={styles.uploadTitle}>Upload Photos</Text>
              <Text style={styles.uploadSubtitle}>
                Add up to 6 clear photos to attract adopters
              </Text>
            </TouchableOpacity>
          )}

          {images.length > 0 && images.length < 6 && (
            <Text style={styles.uploadHint}>
              Tap + to add more · First photo shown as main
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
            {errors.posterName && (
              <Text style={styles.errorText}>{errors.posterName}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Contact Info <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.iconInputWrapper}>
              <MaterialIcons
                name="call"
                size={18}
                color="#807663"
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.textInput,
                  styles.iconInput,
                  errors.contact ? styles.inputError : null,
                ]}
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
          <Text style={styles.cardTitle}>LOCATION</Text>
          <View style={styles.mapBox}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu3cfeFn7G_kQsexvytUehje9uLtUEo8kKEu-w0C2RRNEIXI0pWRSp9IN9NQFpi4K3T-9n13UfE-vhuyL0X0Tz3pbO7ozRKvFJBMP0UlGrsjmIXtSlmcFlk4nTDG6FUPpgbOdxuYpcd370ZdiHJqO4nHCYNf-eNGYyYfKVYAiBEjnDocVjGUwGeHbYIaJxE_f6OB-nbVWBi-mBKC5s6ra9dwI1AKYxEWpLBJllOTLpuT39afingzPUylG-ZgbUzvZfMAVUVzvsKZjM",
              }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.mapLocationBtn}>
              <MaterialIcons name="my-location" size={22} color="#785a00" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Selected Location</Text>
            <View style={styles.iconInputWrapper}>
              <MaterialIcons
                name="location-on"
                size={18}
                color="#785a00"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.textInput, styles.iconInput]}
                value={location}
                editable={false}
                placeholderTextColor="#b0a895"
              />
            </View>
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
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <View style={styles.submitLoading}>
              <ActivityIndicator size="small" color="#785a00" />
              <Text style={styles.submitBtnText}>Uploading...</Text>
            </View>
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F9FA" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  introSection: { marginBottom: 4, paddingTop: 15 },
  introTitle: { fontSize: 22, fontWeight: "800", color: "#785a00", marginBottom: 4 },
  introSubtitle: { fontSize: 14, color: "#4e4635", lineHeight: 20 },

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

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ffdad6", borderRadius: 8, padding: 10,
  },
  errorBannerText: { fontSize: 13, color: "#93000a", flex: 1 },

  uploadBox: {
    borderWidth: 2, borderStyle: "dashed", borderColor: "#d2c5af",
    borderRadius: 12, paddingVertical: 32, paddingHorizontal: 20,
    alignItems: "center", backgroundColor: "#f1fbff", gap: 8,
  },
  uploadIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff9e6",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  uploadTitle: { fontSize: 15, fontWeight: "700", color: "#131d21" },
  uploadSubtitle: { fontSize: 13, color: "#807663", textAlign: "center", lineHeight: 18 },
  uploadHint: { fontSize: 12, color: "#807663", textAlign: "center" },
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
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
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
  submitBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 28,
    backgroundColor: "#f9c74f", alignItems: "center",
    shadowColor: "#785a00", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#785a00" },
});

// ─── Picker Styles ────────────────────────────────────────────────────────────

const picker = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 12, fontWeight: "600", color: "#586062", paddingLeft: 2 },
  trigger: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#d2c5af", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11, backgroundColor: "#fff",
  },
  triggerError: { borderColor: "#ba1a1a", backgroundColor: "#fff8f8" },
  triggerText: { fontSize: 14, color: "#131d21" },
  errorText: { fontSize: 12, color: "#ba1a1a", paddingLeft: 2 },
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