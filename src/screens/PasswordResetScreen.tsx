import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authApi } from '../services/api/authApi';
import * as Yup from 'yup';
import { Formik } from 'formik';

const validationSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
});

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const PasswordResetScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = useState<string>('');

  const handleRequestReset = async (values: { email: string }) => {
    try {
      const response = await authApi.requestPasswordReset(values.email);
      if (response.success) {
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset instructions');
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    try {
      const response = await authApi.resetPassword(resetToken, values.password);
      if (response.success) {
        Alert.alert('Success', 'Password has been reset successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to reset password');
    }
  };

  const validateToken = async (token: string) => {
    try {
      const isValid = await authApi.validateResetToken(token);
      if (isValid) {
        setResetToken(token);
        setStep('reset');
      } else {
        Alert.alert('Error', 'Invalid or expired reset token');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate reset token');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>
        {step === 'request' ? 'Reset Password' : 'Create New Password'}
      </Text>

      {step === 'request' ? (
        <Formik
          initialValues={{ email: '' }}
          validationSchema={validationSchema}
          onSubmit={handleRequestReset}
        >
          {({ handleChange, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={values.email}
                onChangeText={handleChange('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && errors.email && (
                <Text style={styles.error}>{errors.email}</Text>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Instructions</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      ) : (
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={resetPasswordSchema}
          onSubmit={handleResetPassword}
        >
          {({ handleChange, handleSubmit, values, errors, touched, isSubmitting }) => (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={values.password}
                onChangeText={handleChange('password')}
                secureTextEntry
              />
              {touched.password && errors.password && (
                <Text style={styles.error}>{errors.password}</Text>
              )}

              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                secureTextEntry
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.error}>{errors.confirmPassword}</Text>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={() => handleSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2D9CDB',
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2D9CDB',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    color: '#2D9CDB',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default PasswordResetScreen;
