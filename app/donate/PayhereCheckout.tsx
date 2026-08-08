import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

const INJECTED_JS = `
  (function() {
    // Force the Payhere page body background to be white
    try {
      const style = document.createElement('style');
      style.innerHTML = 'body, html { background-color: #ffffff !important; background: #ffffff !important; }';
      document.head.appendChild(style);
    } catch (e) {
      console.log("CSS injection error:", e);
    }

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
  const paymentHandledRef = useRef(false); // prevent double save — ref updates instantly, unlike state

  const BACKEND_URL = "http://192.168.8.160:5000";

  // organization = _id, organizationName = display name
  const { amount, category, organization, organizationName, frequency, plan } = useLocalSearchParams();

  useEffect(() => {
    initiatePayment();
  }, []);

  const getAuthHeaders = async () => {
    const token = await SecureStore.getItemAsync("authToken");
    return { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } };
  };

  const initiatePayment = async () => {
    try {
      setLoading(true);

      console.log("SENDING organizationId:", organization);

      const config = await getAuthHeaders();

      const res = await axios.post(
        `${BACKEND_URL}/api/donations/initiate`,
        {
          amount: parseFloat(amount as string) || 1000,
          organizationId: organization,   // _id for merchant ID lookup
          organization: organizationName, // display name for donation record
          category,
          frequency,
          plan,
          items: "Donation",
        },
        { ...config, timeout: 15000 }
      );

      const data: any = res.data;
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
      router.replace("/donate/DonationSummary");
    } finally {
      setLoading(false);
    }
  };

  const saveDonation = async (status: string) => {
    try {
      const config = await getAuthHeaders();

      await axios.post(
        `${BACKEND_URL}/api/donations/save`,
        {
          orderId: orderData?.order_id,
          amount: orderData?.amount,
          category: orderData?.category,
          organization: orderData?.organization,
          organizationId: orderData?.organizationId,
          frequency: orderData?.frequency,
          plan: orderData?.plan,
          status,
        },
        config
      );
    } catch (err) {
      console.log("Failed to save donation:", err);
    }
  };

  const handleNavigationChange = async (navState: any) => {
    const url = navState.url;
    console.log("NAV URL:", url);

    if (url.includes("/payhere/return")) {
      if (paymentHandledRef.current) return; // prevent double save
      paymentHandledRef.current = true;

      const urlParams = new URLSearchParams(url.split("?")[1]);
      const orderId = urlParams.get("order_id") || orderData?.order_id;
      await saveDonation("SUCCESS");
      router.replace({
        pathname: "/donate/DonationSuccess",
        params: {
          transactionId: orderId,
          amount: orderData?.amount,
          organization: orderData?.organization,
        },
      });
    }

    if (url.includes("/payhere/cancel")) {
      if (paymentHandledRef.current) return; // prevent double save
      paymentHandledRef.current = true;

      await saveDonation("FAILED");
      router.replace("/donate/DonationSummary");
    }
  };

  if (loading || !paymentUrl) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationChange}
        injectedJavaScript={INJECTED_JS}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={{ flex: 1, backgroundColor: "#fff" }}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          if (url.includes("/payhere/return")) {
            handleNavigationChange({ url });
            return false;
          }
          if (url.includes("/payhere/cancel")) {
            handleNavigationChange({ url });
            return false;
          }
          return true;
        }}
      />
    </View>
  );
};

export default PayHereCheckout;