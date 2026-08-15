import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { BASE_URL } from "../../constants/config.constants";

const INJECTED_JS = ` 
(function() { 
  try { 
    const style = document.createElement('style'); 
    style.innerHTML = 'body, html { background-color: #ffffff !important; background: #ffffff !important; }'; 
    document.head.appendChild(style); 
  } catch (e) { 
    console.log("CSS injection error:", e); 
  } 
})(); 
true; 
`; 

const PayHereCheckout = () => { 
  const router = useRouter(); 
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true); 
  const [orderData, setOrderData] = useState<any>(null); 
  const paymentHandledRef = useRef(false); 

  // organization = _id, organizationName = display name
  const { amount, category, organization, organizationName, frequency, plan, paymentMethod } = useLocalSearchParams();

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
      console.log("SENDING organizationId to Live Host:", organization); 
      const config = await getAuthHeaders(); 
      
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
      console.log("Failed to save donation:", err); 
    } 
  }; 

  const handleNavigationChange = async (navState: any) => { 
    const url = navState.url; 
    console.log("NAV URL CHANGED:", url); 

    if (url.includes("/payhere/return") || url.includes("/return")) { 
      if (paymentHandledRef.current) return; 
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

    if (url.includes("/payhere/cancel") || url.includes("/cancel")) { 
      if (paymentHandledRef.current) return; 
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
