import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";

const SUCCESS_CARD = "4916217501611292";
const FAILURE_CARD = "4000000000000002";

const INJECTED_JS = `
  (function() {
    function checkCard() {
      const inputs = document.querySelectorAll('input');
      inputs.forEach(function(input) {
        input.addEventListener('blur', function() {
          const val = input.value.replace(/\\s/g, '');
          if (val.length >= 16) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'card', value: val }));
          }
        });
      });
    }
    setTimeout(checkCard, 2000);
  })();
  true;
`;

const PayHereCheckout = () => {
  const router = useRouter();
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [onPayHerePage, setOnPayHerePage] = useState(false);
  const BACKEND_URL="http://192.168.8.102:5000";

  const { amount, category, organization, frequency, plan } = useLocalSearchParams();

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKEND_URL}/api/donations/initiate`,
        {
          amount: parseFloat(amount as string) || 1000,
          category,
          organization,
          frequency,
          plan,
          items: "Donation",
        },
        { timeout: 15000, headers: { "Content-Type": "application/json" } }
      );
      const data = res.data;
      setOrderData(data);
      const url =
        `${BACKEND_URL}/api/donations/pay?` +
        `merchant_id=${data.merchant_id}&` +
        `order_id=${data.order_id}&` +
        `items=${encodeURIComponent(data.items)}&` +
        `amount=${data.amount}&` +
        `currency=${data.currency}&` +
        `hash=${data.hash}&` +
        `first_name=${encodeURIComponent(data.first_name)}&` +
        `last_name=${encodeURIComponent(data.last_name)}&` +
        `email=${encodeURIComponent(data.email)}&` +
        `phone=${encodeURIComponent(data.phone)}&` +
        `address=${encodeURIComponent(data.address)}&` +
        `city=${encodeURIComponent(data.city)}&` +
        `country=${encodeURIComponent(data.country)}&` +
        `return_url=${encodeURIComponent(data.return_url)}&` +
        `cancel_url=${encodeURIComponent(data.cancel_url)}&` +
        `notify_url=${encodeURIComponent(data.notify_url)}`;
      setPaymentUrl(url);
    } catch (error: any) {
      console.log("AXIOS ERROR:", error?.message || error);
      router.replace("/donate/donationSummary");
    } finally {
      setLoading(false);
    }
  };

  const saveDonation = async (status: string) => {
    try {
      await axios.post(`${BACKEND_URL}/api/donations/save`, {
        orderId: orderData?.order_id,
        amount: orderData?.amount,
        category: orderData?.category,
        organization: orderData?.organization,
        frequency: orderData?.frequency,
        plan: orderData?.plan,
        status,
      });
    } catch (err) {
      console.log("Failed to save donation:", err);
    }
  };

  const simulateSuccess = async () => {
    await saveDonation("SUCCESS");
    router.replace({
      pathname: "/donate/donationSuccess",
      params: {
        transactionId: orderData?.order_id || "TEST-" + Date.now(),
        amount: orderData?.amount,
        organization: orderData?.organization,
      },
    });
  };

  const simulateFailure = async () => {
    await saveDonation("FAILED");
    router.replace({
      pathname: "/donate/donationSummary",
      params: { paymentFailed: "true" },
    });
  };

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "card") {
        const card = data.value.replace(/\s/g, "");
        console.log("CARD DETECTED:", card);
        if (card === SUCCESS_CARD) {
          await simulateSuccess();
        } else if (card === FAILURE_CARD) {
          await simulateFailure();
        }
      }
    } catch (err) {
      console.log("Message parse error:", err);
    }
  };

  const handleNavigationChange = async (navState: any) => {
    const url = navState.url;
    console.log("NAV URL:", url);

    if (url.includes("sandbox.payhere.lk/pay/checkout")) {
      setOnPayHerePage(true);
    } else {
      setOnPayHerePage(false);
    }

    if (url.includes("/payhere/return")) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      const status = urlParams.get("status");
      const orderId = urlParams.get("order_id") || orderData?.order_id;
      if (status === "2") {
        await saveDonation("SUCCESS");
        router.replace({
          pathname: "/donate/donationSuccess",
          params: {
            transactionId: orderId,
            amount: orderData?.amount,
            organization: orderData?.organization,
          },
        });
      } else {
        await saveDonation("FAILED");
        router.replace("/donate/donationSummary");
      }
    }

    if (url.includes("/payhere/cancel")) {
      router.replace("/donate/donationSummary");
    }
  };

  if (loading || !paymentUrl) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationChange}
        onMessage={handleMessage}
        injectedJavaScript={INJECTED_JS}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={{ flex: 1 }}
      />
      {onPayHerePage && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.successBtn} onPress={simulateSuccess}>
            <Text style={styles.btnText}> Payment Success</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.failBtn} onPress={simulateFailure}>
            <Text style={styles.btnText}> Payment Failed</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#fff3cd",
    borderTopWidth: 1,
    borderColor: "#ffc107",
    justifyContent: "space-between",
    position: "absolute",
    bottom: 20, // lift it up from the very bottom
    left: 0,
    right: 0,
  },
  successBtn: {
    flex: 1,
    backgroundColor: "#F5A623",
    padding: 10,
    borderRadius: 8,
    marginRight: 5,
    alignItems: "center",
  },
  failBtn: {
    flex: 1,
    backgroundColor: "#F5A623",
    padding: 10,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default PayHereCheckout;
