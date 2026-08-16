import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

type Category = "Injured" | "Abandoned" | "Aggressive";
type AnimalTypeOption = "Dog" | "Cat" | "Other" | "";

const ANIMAL_TYPES: Exclude<AnimalTypeOption, "">[] = ["Dog", "Cat", "Other"];
const CATEGORIES: Category[] = ["Injured", "Abandoned", "Aggressive"];

const safe = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : value || "";

const parseCategories = (
  categoriesValue: string | string[] | undefined,
  legacyCategoryValue: string | string[] | undefined
): Category[] => {
  let values: unknown = [];
  const encoded = safe(categoriesValue);

  if (encoded) {
    try {
      values = JSON.parse(encoded);
    } catch {
      values = encoded.split(",");
    }
  } else {
    values = safe(legacyCategoryValue).split(",");
  }

  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value).trim()))].filter(
    (value): value is Category => CATEGORIES.includes(value as Category)
  );
};

type FormErrors = {
  animalType?: string;
  otherAnimalType?: string;
  breed?: string;
  categories?: string;
  notes?: string;
};

function RequiredLabel({ children }: { children: string }) {
  return (
    <Text style={styles.label}>
      {children} <Text style={styles.requiredMark}>*</Text>
    </Text>
  );
}

export default function AnimalDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const categoryOffsetRef = useRef(0);
  const isEditing = safe(params.mode) === "edit";

  const savedAnimalType = safe(params.animalType).trim();
  const knownType = ANIMAL_TYPES.find(
    (type) => type !== "Other" && type === savedAnimalType
  );
  const initialType: AnimalTypeOption = knownType || (savedAnimalType ? "Other" : "");
  const initialOtherType =
    initialType === "Other" && savedAnimalType !== "Other" ? savedAnimalType : "";

  const [animalType, setAnimalType] = useState<AnimalTypeOption>(initialType);
  const [otherAnimalType, setOtherAnimalType] = useState(initialOtherType);
  const [showDropdown, setShowDropdown] = useState(false);
  const [breed, setBreed] = useState(safe(params.breed));
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(() =>
    parseCategories(params.categories, params.category)
  );
  const [notes, setNotes] = useState(safe(params.notes));
  const [anonymous, setAnonymous] = useState(safe(params.anonymous) === "true");
  const [errors, setErrors] = useState<FormErrors>({});

  const updateError = (field: keyof FormErrors, message?: string) => {
    setErrors((current) => ({ ...current, [field]: message }));
  };

  const toggleCategory = (category: Category) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    setSelectedCategories(next);
    if (next.length > 0) updateError("categories");
  };

  const handleNext = () => {
    const nextErrors: FormErrors = {};
    const trimmedOtherType = otherAnimalType.trim();
    const trimmedBreed = breed.trim();
    const trimmedNotes = notes.trim();

    if (!animalType) nextErrors.animalType = "Select an animal type.";
    if (animalType === "Other") {
      if (!trimmedOtherType) {
        nextErrors.otherAnimalType = "Enter the animal type.";
      } else if (trimmedOtherType.length > 50) {
        nextErrors.otherAnimalType = "Animal type must be 50 characters or fewer.";
      }
    }
    if (trimmedBreed.length > 60) {
      nextErrors.breed = "Breed must be 60 characters or fewer.";
    }
    if (selectedCategories.length === 0) {
      nextErrors.categories = "Select at least one category.";
    }
    if (trimmedNotes.length > 500) {
      nextErrors.notes = "Condition notes must be 500 characters or fewer.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const onlyCategoryOrNotes =
        !nextErrors.animalType &&
        !nextErrors.otherAnimalType &&
        !nextErrors.breed;
      scrollRef.current?.scrollTo({
        y: onlyCategoryOrNotes ? Math.max(0, categoryOffsetRef.current - 20) : 0,
        animated: true,
      });
      return;
    }

    const resolvedAnimalType =
      animalType === "Other" ? trimmedOtherType : animalType;
    const nextParams = {
      animalType: resolvedAnimalType,
      breed: trimmedBreed,
      categories: JSON.stringify(selectedCategories),
      category: selectedCategories.join(", "),
      notes: trimmedNotes,
      anonymous: anonymous.toString(),
    };

    if (isEditing) {
      router.push({
        pathname: "/reporting/Review",
        params: { ...params, ...nextParams, mode: "edit" },
      });
      return;
    }

    router.push({ pathname: "/reporting/Location", params: nextParams });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Animal Details</Text>
        <Text style={styles.requiredHint}>
          <Text style={styles.requiredMark}>*</Text> Required fields
        </Text>

        <RequiredLabel>Animal Type</RequiredLabel>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Select animal type"
          accessibilityState={{ expanded: showDropdown }}
          style={[styles.dropdown, errors.animalType && styles.errorBorder]}
          onPress={() => setShowDropdown((visible) => !visible)}
        >
          <Text style={[styles.dropdownText, !animalType && styles.placeholderText]}>
            {animalType || "Select Animal Type"}
          </Text>
          <Ionicons
            name={showDropdown ? "chevron-up" : "chevron-down"}
            size={18}
            color="#666666"
          />
        </TouchableOpacity>
        {errors.animalType ? <Text style={styles.errorText}>{errors.animalType}</Text> : null}

        {showDropdown ? (
          <View style={styles.dropdownList}>
            {ANIMAL_TYPES.map((type, index) => (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: animalType === type }}
                key={type}
                style={[
                  styles.dropdownItem,
                  index < ANIMAL_TYPES.length - 1 && styles.dropdownItemBorder,
                  animalType === type && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setAnimalType(type);
                  updateError("animalType");
                  if (type !== "Other") updateError("otherAnimalType");
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{type}</Text>
                {animalType === type ? (
                  <Ionicons name="checkmark" size={18} color="#F5A623" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {animalType === "Other" ? (
          <InputField
            label="Specify Animal Type *"
            placeholder="Enter the animal type"
            value={otherAnimalType}
            error={errors.otherAnimalType}
            onChangeText={(text) => {
              setOtherAnimalType(text);
              if (text.trim() && text.trim().length <= 50) updateError("otherAnimalType");
            }}
          />
        ) : null}

        <InputField
          label="Breed (Optional)"
          placeholder="Enter breed (e.g., Labrador)"
          value={breed}
          error={errors.breed}
          onChangeText={(text) => {
            setBreed(text);
            if (text.trim().length <= 60) updateError("breed");
          }}
        />

        <View onLayout={(event) => (categoryOffsetRef.current = event.nativeEvent.layout.y)}>
          <RequiredLabel>Categories</RequiredLabel>
          <Text style={styles.helperText}>Select all that apply.</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => {
              const selected = selectedCategories.includes(category);
              return (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={category}
                  style={[
                    styles.chip,
                    selected && styles.chipSelected,
                    errors.categories && styles.errorBorder,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Ionicons
                    name={selected ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={selected ? "#A76200" : "#777777"}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.categories ? <Text style={styles.errorText}>{errors.categories}</Text> : null}
        </View>

        <Text style={styles.label}>Condition Notes (Optional)</Text>
        <TextInput
          accessibilityLabel="Condition notes"
          multiline
          textAlignVertical="top"
          maxLength={501}
          style={[styles.notesInput, errors.notes && styles.errorBorder]}
          placeholder="Describe the animal's behavior or injuries..."
          placeholderTextColor="#999999"
          value={notes}
          onChangeText={(text) => {
            setNotes(text);
            if (text.trim().length <= 500) updateError("notes");
          }}
        />
        <View style={styles.notesMetaRow}>
          <Text style={styles.errorText}>{errors.notes || ""}</Text>
          <Text style={[styles.characterCount, notes.trim().length > 500 && styles.limitText]}>
            {notes.length}/500
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleLabel}>Report Anonymously</Text>
            <Text style={styles.helperText}>Your identity will not be stored with this report.</Text>
          </View>
          <Switch
            accessibilityLabel="Report anonymously"
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: "#D1D5DB", true: "#F5C56D" }}
            thumbColor={anonymous ? "#F5A623" : "#F4F4F5"}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title={isEditing ? "Save Changes →" : "Next Step →"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { padding: 20, paddingBottom: 140 },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
    textAlign: "center",
    paddingTop: 22,
  },
  requiredHint: { color: "#6B7280", fontSize: 12, textAlign: "center", marginBottom: 12 },
  requiredMark: { color: "#D32F2F", fontWeight: "700" },
  label: { fontSize: 14, fontWeight: "500", color: "#333333", marginTop: 16, marginBottom: 6 },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#333333", marginBottom: 3 },
  helperText: { color: "#6B7280", fontSize: 12, marginBottom: 8 },
  dropdown: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
  },
  dropdownText: { fontSize: 15, color: "#333333" },
  placeholderText: { color: "#999999" },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EEEEEE" },
  dropdownItemSelected: { backgroundColor: "#FFF7E8" },
  dropdownItemText: { fontSize: 15, color: "#333333" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  chipSelected: { backgroundColor: "#F5A62333", borderColor: "#F5A623" },
  chipText: { fontSize: 14, color: "#333333" },
  chipTextSelected: { color: "#7A4600", fontWeight: "600" },
  notesInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
    color: "#333333",
  },
  notesMetaRow: { flexDirection: "row", justifyContent: "space-between", minHeight: 24 },
  characterCount: { color: "#6B7280", fontSize: 12, marginTop: 4 },
  limitText: { color: "#D32F2F" },
  errorText: { flex: 1, color: "#D32F2F", fontSize: 12, marginTop: 4 },
  errorBorder: { borderColor: "#D32F2F", borderWidth: 1.5 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginTop: 22,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  toggleCopy: { flex: 1 },
  bottomButtonWrapper: { position: "absolute", bottom: 30, left: 20, right: 20 },
});
