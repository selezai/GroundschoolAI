import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import verificationService from '../services/api/verificationService';
import { RootStackParamList } from '../../App';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (isSignUp && !phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);
      if (isSignUp) {
        // Send verification codes
        await Promise.all([
          verificationService.sendEmailVerification(email),
          verificationService.sendPhoneVerification(phoneNumber),
        ]);

        // Navigate to verification screen for email
        navigation.navigate('Verification', {
          type: 'email',
          value: email,
          onVerificationComplete: async () => {
            // After email verification, verify phone
            navigation.navigate('Verification', {
              type: 'phone',
              value: phoneNumber,
              onVerificationComplete: async () => {
                // Both verifications complete, proceed with signup
                await login(email, password, true);
              },
            });
          },
        });
      } else {
        // Regular login
        await login(email, password, false);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{isSignUp ? 'Sign Up' : 'Login'}</Text>
        
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />

        {isSignUp && (
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
        )}

        <TouchableOpacity
          style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Sign Up' : 'Login'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchText}>
            {isSignUp
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {!isSignUp && (
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0066cc',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: '#0066cc',
    fontSize: 16,
  },
  forgotButton: {
    marginTop: 10,
    padding: 10,
  },
  forgotText: {
    color: '#666',
    fontSize: 14,
  },
});

export default LoginScreen;
