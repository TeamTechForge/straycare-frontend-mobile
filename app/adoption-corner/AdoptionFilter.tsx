import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { ANIMAL_BREEDS } from "../../constants/breeds.constants";
import { Post } from "../../services/adoptionService";

export type AdvancedFilters = {
  animalType: string;
  otherAnimalType: string;
  gender: string;
  breed: string;
  customBreed: string;
  ageRange: string;
  healthStatus: string;
  location: string;
};

type AdoptionFilterProps = {
  search: string;
  activeFilter: string;
  appliedFilters: AdvancedFilters;
  onSearchChange: (search: string) => void;
  onActiveFilterChange: (filter: string) => void;
  onAppliedFiltersChange: (filters: AdvancedFilters) => void;
};

const FILTERS = ["All", "Favorites", "Dogs", "Cats", "Rabbits", "Birds"];
const ANIMAL_TYPES = ["Dog", "Cat", "Other"];
const GENDERS = ["Male", "Female"];
const AGE_RANGES = ["Any age", "Below 6 months", "6–12 months", "1–3 years", "3–7 years", "Above 7 years"];
const HEALTH_STATUSES = ["Healthy", "Needs Care", "Under Treatment", "Special Needs"];

export const EMPTY_FILTERS: AdvancedFilters = {
  animalType: "",
  otherAnimalType: "",
  gender: "",
  breed: "",
  customBreed: "",
  ageRange: "Any age",
  healthStatus: "",
  location: "",
};

const ageInMonths = (age?: string) => {
  const match = age?.trim().match(/(\d+(?:\.\d+)?)\s*(year|years|month|months|week|weeks)?/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] || "months").toLowerCase();
  if (unit.startsWith("year")) return value * 12;
  if (unit.startsWith("week")) return value / 4.345;
  return value;
};

const matchesAgeRange = (age: string | undefined, range: string) => {
  if (!range || range === "Any age") return true;
  const months = ageInMonths(age);
  if (months === null) return false;
  if (range === "Below 6 months") return months < 6;
  if (range === "6–12 months") return months >= 6 && months <= 12;
  if (range === "1–3 years") return months >= 12 && months <= 36;
  if (range === "3–7 years") return months > 36 && months <= 84;
  return months > 84;
};

export function matchesAdoptionFilters(
  post: Post & { liked: boolean },
  search: string,
  activeFilter: string,
  appliedFilters: AdvancedFilters
) {
  const query = search.trim().toLowerCase();
  const matchesSearch =
    query === "" ||
    (post.name || "").toLowerCase().includes(query) ||
    (post.breed || "").toLowerCase().includes(query) ||
    (post.location || "").toLowerCase().includes(query);

  const matchesQuickFilter =
    activeFilter === "All" ||
    (activeFilter === "Favorites" && post.liked) ||
    (activeFilter === "Dogs" && (post.category === "Dog" || post.category === "Dogs")) ||
    (activeFilter === "Cats" && (post.category === "Cat" || post.category === "Cats")) ||
    (activeFilter === "Rabbits" && post.category === "Other" &&
      (post.breed.toLowerCase().includes("rabbit") || post.customCategory?.toLowerCase().includes("rabbit"))) ||
    (activeFilter === "Birds" && post.category === "Other" &&
      (post.breed.toLowerCase().includes("parrot") ||
        post.breed.toLowerCase().includes("bird") ||
        post.customCategory?.toLowerCase().includes("bird") ||
        post.customCategory?.toLowerCase().includes("parrot")));

  const matchesAdvanced =
    (!appliedFilters.animalType || post.category === appliedFilters.animalType) &&
    (!appliedFilters.otherAnimalType || `${post.customCategory || ""} ${post.breed || ""}`.toLowerCase().includes(appliedFilters.otherAnimalType.trim().toLowerCase())) &&
    (!appliedFilters.gender || post.gender === appliedFilters.gender) &&
    (!appliedFilters.breed || (appliedFilters.breed === "Other"
      ? (!appliedFilters.customBreed || (post.breed || "").toLowerCase().includes(appliedFilters.customBreed.trim().toLowerCase()))
      : post.breed === appliedFilters.breed)) &&
    matchesAgeRange(post.age, appliedFilters.ageRange) &&
    (!appliedFilters.healthStatus || post.healthStatus === appliedFilters.healthStatus) &&
    (!appliedFilters.location || (post.location || "").toLowerCase().includes(appliedFilters.location.trim().toLowerCase()));

  return matchesSearch && matchesQuickFilter && matchesAdvanced;
}

export default function AdoptionFilter({
  search,
  activeFilter,
  appliedFilters,
  onSearchChange,
  onActiveFilterChange,
  onAppliedFiltersChange,
}: AdoptionFilterProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(appliedFilters);
  const [openFilter, setOpenFilter] = useState<keyof AdvancedFilters | null>(null);
  const filterScrollRef = useRef<ScrollView>(null);

  const hasAdvancedFilters = Boolean(
    appliedFilters.animalType || appliedFilters.otherAnimalType || appliedFilters.gender ||
    appliedFilters.breed || appliedFilters.customBreed || appliedFilters.healthStatus ||
    appliedFilters.location || appliedFilters.ageRange !== "Any age"
  );
  const availableBreeds = draftFilters.animalType === "Dog"
    ? ANIMAL_BREEDS.Dog.filter((breed) => breed !== "Unknown Breed")
    : draftFilters.animalType === "Cat"
      ? ANIMAL_BREEDS.Cat.filter((breed) => breed !== "Unknown")
      : [];
  const filterFields: { key: keyof AdvancedFilters; label: string; options: string[] }[] = [
    { key: "animalType", label: "Animal type", options: ANIMAL_TYPES },
    { key: "gender", label: "Gender", options: GENDERS },
    ...(draftFilters.animalType !== "Other" ? [{ key: "breed" as keyof AdvancedFilters, label: "Breed", options: availableBreeds }] : []),
    { key: "ageRange", label: "Age", options: AGE_RANGES },
    { key: "healthStatus", label: "Health status", options: HEALTH_STATUSES },
  ];

  return (
    <>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <MaterialIcons name="search" size={20} color="#717878" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Search by breed, name or area..." placeholderTextColor="#717878" value={search} onChangeText={onSearchChange} />
        </View>
        <TouchableOpacity style={[styles.filterButton, (showFilters || hasAdvancedFilters) && styles.filterButtonActive]} onPress={() => setShowFilters((value) => !value)} accessibilityLabel="Open adoption filters">
          <MaterialIcons name="tune" size={22} color={(showFilters || hasAdvancedFilters) ? "#FFFFFF" : "#D48806"} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView ref={filterScrollRef} style={styles.filterPanel} contentContainerStyle={styles.filterPanelContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {filterFields.map(({ key, label, options }) => (
            <View key={key} style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{label}</Text>
              <TouchableOpacity disabled={key === "breed" && (!draftFilters.animalType || draftFilters.animalType === "Other")} style={[styles.filterSelect, key === "breed" && (!draftFilters.animalType || draftFilters.animalType === "Other") && styles.filterSelectDisabled]} onPress={() => setOpenFilter((current) => current === key ? null : key)}>
                <Text style={draftFilters[key] ? styles.filterSelectText : styles.filterPlaceholder}>{draftFilters[key] || (key === "breed" && !draftFilters.animalType ? "Select animal type first" : key === "breed" && draftFilters.animalType === "Other" ? "Not applicable for Other" : `Select ${label.toLowerCase()}`)}</Text>
                <Ionicons name={openFilter === key ? "chevron-up" : "chevron-down"} size={17} color="#717878" />
              </TouchableOpacity>
              {openFilter === key && (
                <ScrollView style={styles.filterDropdown} nestedScrollEnabled>
                  {options.map((option) => (
                    <TouchableOpacity key={option} style={[styles.filterDropdownItem, draftFilters[key] === option && styles.filterDropdownItemActive]} onPress={() => { setDraftFilters((current) => key === "animalType" ? { ...current, animalType: option, breed: "", customBreed: "", otherAnimalType: "" } : key === "breed" ? { ...current, breed: option, customBreed: "" } : { ...current, [key]: option }); setOpenFilter(null); }}>
                      <Text style={styles.filterDropdownText}>{option}</Text>
                      {draftFilters[key] === option && <Ionicons name="checkmark" size={17} color="#D48806" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {key === "animalType" && draftFilters.animalType === "Other" && (
                <View style={styles.inlineConditionalField}>
                  <Text style={styles.filterLabel}>Specify animal type</Text>
                  <TextInput style={styles.locationFilterInput} placeholder="e.g. Rabbit, Bird or Turtle" placeholderTextColor="#A8A497" value={draftFilters.otherAnimalType} onChangeText={(otherAnimalType) => setDraftFilters((current) => ({ ...current, otherAnimalType }))} />
                </View>
              )}
              {key === "breed" && draftFilters.breed === "Other" && (
                <View style={styles.inlineConditionalField}>
                  <Text style={styles.filterLabel}>Specify breed</Text>
                  <TextInput style={styles.locationFilterInput} placeholder="Type the breed" placeholderTextColor="#A8A497" value={draftFilters.customBreed} onChangeText={(customBreed) => setDraftFilters((current) => ({ ...current, customBreed }))} />
                  {!draftFilters.customBreed.trim() && <Text style={styles.filterHelp}>Enter a breed to apply this filter.</Text>}
                </View>
              )}
            </View>
          ))}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Location</Text>
            <TextInput style={styles.locationFilterInput} placeholder="Type a city or area" placeholderTextColor="#A8A497" value={draftFilters.location} onFocus={() => setTimeout(() => filterScrollRef.current?.scrollToEnd({ animated: true }), 250)} onChangeText={(location) => setDraftFilters((current) => ({ ...current, location }))} />
          </View>
          <View style={styles.filterActions}>
            <View style={styles.filterAction}><PrimaryButton title="Clear" variant="outline" onPress={() => { setDraftFilters(EMPTY_FILTERS); onAppliedFiltersChange(EMPTY_FILTERS); setOpenFilter(null); }} /></View>
            <View style={styles.filterAction}><PrimaryButton title="Apply" disabled={draftFilters.breed === "Other" && !draftFilters.customBreed.trim()} onPress={() => { onAppliedFiltersChange(draftFilters); setShowFilters(false); setOpenFilter(null); }} /></View>
          </View>
        </ScrollView>
      )}

      <View style={styles.chipsScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
          {FILTERS.map((filter) => (
            <TouchableOpacity key={filter} style={[styles.chip, activeFilter === filter && styles.chipActive]} onPress={() => onActiveFilterChange(filter)} activeOpacity={0.8}>
              {filter === "Favorites" && <MaterialIcons name={activeFilter === filter ? "favorite" : "favorite-border"} size={14} color={activeFilter === filter ? "#fff" : "#D48806"} style={{ marginRight: 4 }} />}
              <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingTop: 8, marginBottom: 16 },
  searchInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f4f3f3", borderRadius: 14, paddingHorizontal: 14 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#1a1c1c", paddingVertical: 14 },
  filterButton: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: "#F5A623", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7E6" },
  filterButtonActive: { backgroundColor: "#F5A623" },
  filterPanel: { marginHorizontal: 20, marginBottom: 14, maxHeight: 800, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D6" },
  filterPanelContent: { padding: 14, gap: 10 },
  filterGroup: { gap: 6 },
  inlineConditionalField: { gap: 6, marginTop: 4 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#191C1D" },
  filterSelect: { minHeight: 44, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#F8F9FA", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterSelectDisabled: { opacity: 0.55 },
  filterSelectText: { flex: 1, fontSize: 13, color: "#191C1D" },
  filterPlaceholder: { flex: 1, fontSize: 13, color: "#A8A497" },
  filterDropdown: { maxHeight: 180, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, backgroundColor: "#FFFFFF" },
  filterDropdownItem: { minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E0D6" },
  filterDropdownItemActive: { backgroundColor: "#FFF7E6" },
  filterDropdownText: { fontSize: 13, color: "#191C1D" },
  locationFilterInput: { minHeight: 44, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#F8F9FA", color: "#191C1D", fontSize: 13 },
  filterHelp: { color: "#B00020", fontSize: 11 },
  filterActions: { flexDirection: "row", gap: 8 },
  filterAction: { flex: 1 },
  chipsScrollWrapper: { marginBottom: 16 },
  chipsScroll: { flexGrow: 0 },
  chipsContent: { gap: 8, paddingHorizontal: 20 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFF7E6" },
  chipActive: { backgroundColor: "#F5A623" },
  chipText: { color: "#D48806", fontWeight: "600", fontSize: 13 },
  chipTextActive: { color: "#fff" },
});
