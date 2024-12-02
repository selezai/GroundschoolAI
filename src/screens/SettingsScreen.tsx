import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AIService from '../services/ai/aiService';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const aiService = AIService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [storedKey, isOffline] = await Promise.all([
        AsyncStorage.getItem('@ai_api_key'),
        aiService.isOfflineMode(),
      ]);

      if (storedKey) {
        setApiKey(storedKey);
      }
      setOfflineMode(isOffline);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await aiService.setApiKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const handleToggleOfflineMode = async (value: boolean) => {
    try {
      await aiService.setOfflineMode(value);
      setOfflineMode(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle offline mode');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached AI explanations?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiService.clearCache();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Settings</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>OpenAI API Key</Text>
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your OpenAI API key"
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveApiKey}
          >
            <Text style={styles.saveButtonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingText}>Offline Mode</Text>
            <Text style={styles.settingDescription}>
              Use cached explanations when offline
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleToggleOfflineMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={offlineMode ? '#2D9CDB' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={styles.clearCacheButton}
          onPress={handleClearCache}
        >
          <Ionicons name="trash-bin-outline" size={24} color="#FF6B6B" />
          <Text style={styles.clearCacheText}>Clear AI Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.description}>
          GroundSchool AI helps pilots prepare for their SACAA aviation exams
          through an intelligent, adaptive learning experience.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#2D9CDB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  clearCacheButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    marginTop: 16,
  },
  clearCacheText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginLeft: 8,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SettingsScreen;
