import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import PaymentService from '../services/api/paymentService';
import OfflineStorage from '../services/offline/offlineStorage';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [storageUsage, setStorageUsage] = useState({
    used: 0,
    total: 0,
    percentage: 0,
  });
  const [subscription, setSubscription] = useState<{
    status: 'active' | 'inactive';
    plan?: any;
    expiryDate?: string;
  }>({ status: 'inactive' });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const paymentService = PaymentService.getInstance();
      const offlineStorage = OfflineStorage.getInstance();

      // Load subscription data
      const subscriptionData = await paymentService.getCurrentSubscription();
      setSubscription(subscriptionData);

      // Load storage usage
      const usage = await offlineStorage.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const handleOfflineToggle = async () => {
    try {
      if (!subscription.status === 'active') {
        Alert.alert('Subscription Required', 'Please subscribe to enable offline access');
        return;
      }

      setOfflineEnabled(!offlineEnabled);
      // Additional logic for enabling/disabling offline mode
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle offline mode');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user?.name}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <Text style={styles.label}>Status</Text>
        <Text style={[
          styles.value,
          { color: subscription.status === 'active' ? '#4CAF50' : '#F44336' }
        ]}>
          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
        </Text>
        {subscription.expiryDate && (
          <>
            <Text style={styles.label}>Expires</Text>
            <Text style={styles.value}>
              {new Date(subscription.expiryDate).toLocaleDateString()}
            </Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Access</Text>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Enable Offline Mode</Text>
          <Switch
            value={offlineEnabled}
            onValueChange={handleOfflineToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={offlineEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.storageText}>
          Storage Used: {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${storageUsage.percentage}%` }]} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  storageText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  logoutButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
