import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
};

export default function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  showSwitch = false,
  switchValue = false,
  onSwitchChange,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={showSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={BRAND_COLOR} />
      </View>

      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#ddd", true: "#F5C46B" }}
          thumbColor={switchValue ? BRAND_COLOR : "#fff"}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#999" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textBox: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  subtitle: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
});