import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Receipt() {
  const { donation } = useLocalSearchParams();
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
      const asset = Asset.fromModule(require("../../assets/images/LogoNew.png"));
      await asset.downloadAsync();
      const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
        encoding: "base64",
      });
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      return null;
    }
  }

  async function downloadReceipt() {
    try {
      const logo = await getLogoBase64();

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

      const { uri } = await Print.printToFileAsync({ html });
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Donation Receipt",
          UTI: "com.adobe.pdf",
        });
      } else {
        console.log("Sharing not available");
      }
    } catch (err) {
      console.error("Receipt error:", err);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donation Receipt</Text>
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

      <TouchableOpacity style={styles.button} onPress={downloadReceipt}>
        <Text style={styles.buttonText}>📄 Download Receipt (PDF)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
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
  button: { backgroundColor: "#F5A623", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { fontSize: 16, fontWeight: "bold", color: "#000" },
});
