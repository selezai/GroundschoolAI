import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    subscriptionStatus,
    isLoading,
    remainingTrialDays,
    plans,
    startTrial,
    isEligibleForTrial,
  } = useSubscription();

  const handleStartTrial = async () => {
    try {
      await startTrial();
      Alert.alert(
        'Trial Started',
        'Welcome to your 14-day free trial! Enjoy full access to all features.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial. Please try again later.');
    }
  };

  const renderTrialSection = () => {
    if (!isEligibleForTrial) return null;

    return (
      <View style={styles.trialSection}>
        <Ionicons name="gift-outline" size={48} color="#2D9CDB" />
        <Text style={styles.trialTitle}>Start Your Free Trial</Text>
        <Text style={styles.trialDescription}>
          Try all premium features free for 14 days. No credit card required.
        </Text>
        <TouchableOpacity
          style={styles.trialButton}
          onPress={handleStartTrial}
        >
          <Text style={styles.trialButtonText}>Start Free Trial</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSubscriptionStatus = () => {
    if (!subscriptionStatus) return null;

    if (remainingTrialDays !== null && remainingTrialDays > 0) {
      return (
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Trial Active</Text>
          <Text style={styles.statusDescription}>
            {remainingTrialDays} days remaining in your trial
          </Text>
        </View>
      );
    }

    if (subscriptionStatus.isActive) {
      return (
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Active Subscription</Text>
          <Text style={styles.statusDescription}>
            {subscriptionStatus.plan?.name}
          </Text>
          <Text style={styles.periodText}>
            Current period ends: {new Date(subscriptionStatus.currentPeriodEnd || '').toLocaleDateString()}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderPlans = () => {
    return plans.map((plan) => (
      <View key={plan.id} style={styles.planCard}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planPrice}>
          {plan.currency} {plan.price}/{plan.interval}
        </Text>
        <Text style={styles.planDescription}>{plan.description}</Text>
        <View style={styles.featuresList}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2D9CDB" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={() => navigation.navigate('PaymentScreen', { planId: plan.id })}
        >
          <Text style={styles.subscribeButtonText}>
            {subscriptionStatus?.isActive ? 'Change Plan' : 'Subscribe'}
          </Text>
        </TouchableOpacity>
      </View>
    ));
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderSubscriptionStatus()}
      {renderTrialSection()}
      <Text style={styles.plansTitle}>Subscription Plans</Text>
      {renderPlans()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  trialDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  trialButton: {
    backgroundColor: '#2D9CDB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  trialButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
  },
  periodText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 20,
    color: '#2D9CDB',
    fontWeight: '600',
    marginBottom: 12,
  },
  planDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#444',
  },
  subscribeButton: {
    backgroundColor: '#2D9CDB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SubscriptionScreen;
