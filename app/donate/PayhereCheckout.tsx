import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { BASE_URL } from "../../constants/config.constants";

// Keep the hosted PayHere page background consistent with the app.
const INJECTED_JS = ` 
(function() { 
  try { 
    const style = document.createElement('style'); 
    style.innerHTML = 'body, html { background-color: #ffffff !important; background: #ffffff !important; }'; 
    document.head.appendChild(style); 
  } catch {
    // The payment page remains usable if this cosmetic style injection fails.
  } 
})(); 
true; 
`; 

const PayHereCheckout = () => { 
  const router = useRouter(); 
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true); 
  const [orderData, setOrderData] = useState<any>(null); 
  // PayHere can trigger the same redirect more than once in a WebView.
  const paymentHandledRef = useRef(false); 

  // Keep the database ID separate from the name shown to the donor.
  const { amount, category, organization, organizationName, frequency, plan, paymentMethod } = useLocalSearchParams();

  const getAuthHeaders = async () => { 
    // The backend requires the logged-in donor's token.
    const token = await SecureStore.getItemAsync("authToken"); 
    return { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }; 
  }; 

  const initiatePayment = useCallback(async () => {
    try { 
      setLoading(true); 
      const config = await getAuthHeaders(); 
      
      // The backend selects the merchant and creates the secure PayHere hash.
      const res = await axios.post( 
        `${BASE_URL}/api/donations/initiate`, 
        { 
          amount: parseFloat(amount as string) || 1000, 
          organizationId: organization,   // _id for merchant ID lookup
          organization: organizationName, // display name for donation record
          category, 
          frequency, 
          plan, 
          paymentMethod,
          items: "Donation", 
        }, 
        { ...config, timeout: 15000 } 
      ); 

      const data: any = res.data; 
      setOrderData(data); 

      // Build the hosted checkout URL using values signed by the backend.
      const url = 
        `${BASE_URL}/api/donations/pay?` + 
        `merchant_id=${encodeURIComponent(data.merchant_id)}&` + 
        `order_id=${encodeURIComponent(data.order_id)}&` + 
        `items=${encodeURIComponent(data.items)}&` + 
        `amount=${encodeURIComponent(data.amount)}&` + 
        `currency=${encodeURIComponent(data.currency)}&` + 
        `hash=${encodeURIComponent(data.hash)}&` + 
        `first_name=${encodeURIComponent(data.first_name)}&` + 
        `last_name=${encodeURIComponent(data.last_name)}&` + 
        `email=${encodeURIComponent(data.email)}&` + 
        `phone=${encodeURIComponent(data.phone)}&` + 
        `address=${encodeURIComponent(data.address)}&` + 
        `city=${encodeURIComponent(data.city)}&` + 
        `country=${encodeURIComponent(data.country)}&` + 
        `payment_method=${encodeURIComponent(data.payment_method)}&` +
        (data.recurrence ? `recurrence=${encodeURIComponent(data.recurrence)}&` : "") +
        (data.duration ? `duration=${encodeURIComponent(data.duration)}&` : "") +
        `return_url=${encodeURIComponent(data.return_url)}&` + 
        `cancel_url=${encodeURIComponent(data.cancel_url)}&` + 
        `notify_url=${encodeURIComponent(data.notify_url)}`; 

      setPaymentUrl(url); 
    } catch (error: any) { 
      console.error("Unable to initiate PayHere checkout:", error?.message || error);
      router.replace("/donate/DonationSummary"); 
    } finally { 
      setLoading(false); 
    } 
  }, [amount, category, frequency, organization, organizationName, paymentMethod, plan, router]);

  useEffect(() => {
    void initiatePayment();
  }, [initiatePayment]);

  const saveDonation = async (status: string) => { 
    // Save the final result for one-time payments.
    try { 
      const config = await getAuthHeaders(); 
      await axios.post( 
        `${BASE_URL}/api/donations/save`, 
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
      console.error("Unable to save donation result:", err);
    } 
  }; 

  const handleNavigationChange = async (navState: any) => { 
    const url = navState.url; 
    if (url.includes("/payhere/return") || url.includes("/return")) { 
      // Prevent the WebView from processing the same return URL twice.
      if (paymentHandledRef.current) return; 
      paymentHandledRef.current = true; 
      
      const urlParams = new URLSearchParams(url.split("?")[1]); 
      const orderId = urlParams.get("order_id") || orderData?.order_id; 
      
      const isRecurring = orderData?.frequency === "Recurring";
      // Recurring records are confirmed by the PayHere notification endpoint.
      if (!isRecurring) {
        await saveDonation("SUCCESS");
      }
      router.replace({ 
        pathname: "/donate/DonationSuccess", 
        params: { 
          transactionId: orderId, 
          amount: orderData?.amount, 
          organization: orderData?.organization, 
          recurring: isRecurring ? "true" : "false",
        }, 
      }); 
    } 

    if (url.includes("/payhere/cancel") || url.includes("/cancel")) { 
      if (paymentHandledRef.current) return; 
      paymentHandledRef.current = true; 
      // Do not create a failed installment for a cancelled recurring checkout.
      if (orderData?.frequency !== "Recurring") {
        await saveDonation("FAILED");
      }
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
      {/* Open the hosted PayHere checkout inside the mobile application. */}
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
          if (url.includes("/payhere/return") || url.includes("/return")) { 
            handleNavigationChange({ url }); 
            return false; 
          } 
          if (url.includes("/payhere/cancel") || url.includes("/cancel")) { 
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
