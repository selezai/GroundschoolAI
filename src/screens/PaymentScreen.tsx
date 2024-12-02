import React, { useRef, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Paystack } from 'react-native-paystack-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { paymentService, PaymentResult } from '../services/paymentService';

type PaymentScreenProps = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const PaymentScreen: React.FC<PaymentScreenProps> = ({ route, navigation }) => {
  const { amount, email } = route.params;
  const [loading, setLoading] = useState(false);
  const paystackWebViewRef = useRef<any>();

  const handlePaymentSuccess = async (response: any) => {
    setLoading(true);
    try {
      const isValid = await paymentService.validatePayment(response.reference);
      if (isValid) {
        Alert.alert('Success', 'Payment completed successfully!');
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', 'Payment validation failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing your payment.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: any) => {
    Alert.alert('Error', 'Payment failed. Please try again.');
  };

  const handlePaymentClose = () => {
    // Handle payment modal close
  };

  return (
    <View style={styles.container}>
      <Paystack
        ref={paystackWebViewRef}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentClose}
        onError={handlePaymentError}
        {...paymentService.getPaystackConfig({
          amount,
          email,
          reference: `REF-${Date.now()}`,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default PaymentScreen;
