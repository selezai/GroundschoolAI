import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import verificationService from '../services/api/verificationService';
import { RootStackParamList } from '../../App';

type VerificationType = 'phone' | 'email';

type VerificationScreenProps = NativeStackScreenProps<RootStackParamList, 'Verification'>;

const VerificationScreen: React.FC<VerificationScreenProps> = ({
  route,
  navigation,
}) => {
  const { type, value, onVerificationComplete } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const startCountdown = () => {
    setResendDisabled(true);
    setCountdown(30);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    try {
      setLoading(true);
      if (type === 'phone') {
        await verificationService.sendPhoneVerification(value);
      } else {
        await verificationService.sendEmailVerification(value);
      }
      startCountdown();
      Alert.alert('Success', `Verification code resent to your ${type}`);
    } catch (error) {
      Alert.alert('Error', `Failed to resend verification code to ${type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    try {
      setLoading(true);
      let success = false;

      if (type === 'phone') {
        success = await verificationService.verifyPhoneCode(value, code);
      } else {
        success = await verificationService.verifyEmailCode(value, code);
      }

      if (success) {
        onVerificationComplete();
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Invalid verification code');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your {type}</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to:
        {'\n'}
        {value}
      </Text>

      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="Enter verification code"
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleVerifyCode}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.resendButton, { opacity: resendDisabled ? 0.7 : 1 }]}
        onPress={handleResendCode}
        disabled={resendDisabled || loading}
      >
        <Text style={styles.resendText}>
          {resendDisabled
            ? `Resend code in ${countdown}s`
            : 'Resend verification code'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: '#0066cc',
    fontSize: 16,
  },
});

export default VerificationScreen;
