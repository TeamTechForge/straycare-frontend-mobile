import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";

export default function Receipt() {
  const router = useRouter();
  const { donation } = useLocalSearchParams();
  // Receipt details are passed from the selected history card.
  const parsed = donation ? JSON.parse(donation as string) : null;

  if (!parsed) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>No receipt data provided.</Text>
      </View>
    );
  }

  async function getLogoBase64() {
    try {
      // Embed the logo in the PDF so it works without an internet connection.
      const asset = Asset.fromModule(require("../../assets/images/LogoNew.png"));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: "base64",
      });
      return `data:image/png;base64,${base64}`;
    } catch {
      return null;
    }
  }

  async function downloadReceipt() {
    try {
      const logo = await getLogoBase64();

      // Create the receipt as HTML before converting it to a PDF.
      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial; padding: 40px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { width: 100px; height: auto; }
              h1 { color: #F5A623; font-size: 24px; }
              .receipt-box { border: 1px solid #ddd; border-radius: 10px; padding: 20px; margin-top: 20px; }
              .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; }
              .footer { text-align: center; margin-top: 30px; color: #F5A623; font-size: 16px; }
              .status-success { color: green; font-weight: bold; }
              .status-failed { color: red; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logo ? `<img src="${logo}" class="logo" />` : ""}
              <h1>StrayCare</h1>
              <p>Donation Receipt</p>
            </div>
            <div class="receipt-box">
              <div class="row">
                <span class="label">Order ID:</span>
                <span class="value">${parsed.orderId}</span>
              </div>
              <div class="row">
                <span class="label">Organization:</span>
                <span class="value">${parsed.organization}</span>
              </div>
              <div class="row">
                <span class="label">Category:</span>
                <span class="value">${parsed.category}</span>
              </div>
              <div class="row">
                <span class="label">Frequency:</span>
                <span class="value">${parsed.frequency}</span>
              </div>
              <div class="row">
                <span class="label">Amount:</span>
                <span class="value">Rs. ${parsed.amount}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span class="value">${new Date(parsed.timestamp).toLocaleDateString()}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="value ${parsed.status === 'SUCCESS' ? 'status-success' : 'status-failed'}">${parsed.status}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for supporting StrayCare ♡</p>
              <p style="font-size:12px; color:#999;">This is an official donation receipt.</p>
            </div>
          </body>
        </html>
      `;

      // Expo Print creates a temporary PDF file from the receipt HTML.
      const { uri } = await Print.printToFileAsync({ html });

      // Remove unsafe filename characters from the order ID.
      const safeOrderId = String(parsed.orderId || "receipt").replace(/[^a-zA-Z0-9_-]/g, "-");
      const fileName = `StrayCare-Receipt-${safeOrderId}.pdf`;

      if (Platform.OS === "android") {
        // Let Android users choose the folder where the PDF is saved.
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Save cancelled", "Choose a folder to save the receipt.");
          return;
        }

        const pdfBase64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const destinationUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          fileName,
          "application/pdf"
        );
        await FileSystem.writeAsStringAsync(destinationUri, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert("Receipt saved", `${fileName} was saved to the selected folder.`);
      } else {
        // Other platforms save the PDF in the app's document folder.
        const destinationUri = `${FileSystem.documentDirectory}${fileName}`;
        const existing = await FileSystem.getInfoAsync(destinationUri);
        if (existing.exists) {
          await FileSystem.deleteAsync(destinationUri);
        }
        await FileSystem.copyAsync({ from: uri, to: destinationUri });
        Alert.alert("Receipt saved", "The PDF was saved securely on this device.");
      }
    } catch (err) {
      console.error("Receipt error:", err);
      Alert.alert("Unable to save receipt", "Please try again.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <BackButton onPress={() => router.back()} />
        <Text style={[styles.title, { marginBottom: 0, marginLeft: 12 }]}>Donation Receipt</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID:</Text>
          <Text style={styles.value}>{parsed.orderId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Organization:</Text>
          <Text style={styles.value}>{parsed.organization}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{parsed.category}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Frequency:</Text>
          <Text style={styles.value}>{parsed.frequency}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>Rs. {parsed.amount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(parsed.timestamp).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.value, { color: parsed.status === "SUCCESS" ? "green" : "red", fontWeight: "bold" }]}>
            {parsed.status}
          </Text>
        </View>
      </View>

      <PrimaryButton title="Save Receipt (PDF)" onPress={downloadReceipt} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 40 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#eee" },
  label: { fontSize: 14, fontWeight: "600", color: "#666" },
  value: { fontSize: 14, color: "#333", flex: 1, textAlign: "right" },
  error: { fontSize: 16, color: "red", textAlign: "center" },
});
