import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Progress from 'react-native-progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import studyService from '../services/study';
import { StudyMaterial } from '../types/study';
import StudyMaterialList from '../components/StudyMaterialList';
import UploadFAB from '../components/UploadFAB';

interface Activity {
  id: string;
  title: string;
  date: string;
  progress: number;
}

const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Aircraft Systems Review',
    date: '2023-12-01',
    progress: 0.75,
  },
  {
    id: '2',
    title: 'Navigation Fundamentals',
    date: '2023-11-30',
    progress: 0.45,
  },
  {
    id: '3',
    title: 'Weather Patterns',
    date: '2023-11-29',
    progress: 0.90,
  },
];

export default function HomeScreen() {
  const [userName, setUserName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
    loadMaterials();
  }, []);

  const loadUserData = async () => {
    try {
      const email = await AsyncStorage.getItem('userEmail');
      if (email) {
        setUserName(email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await studyService.listMaterials();
      setMaterials(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load study materials');
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setActivities([...mockActivities].reverse());
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const calculateOverallProgress = () => {
    const total = activities.reduce((sum, activity) => sum + activity.progress, 0);
    return total / activities.length;
  };

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => Alert.alert('Activity Details', `Opening ${item.title}`)}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityDate}>{item.date}</Text>
      </View>
      <Progress.Bar 
        progress={item.progress} 
        width={null} 
        color="#2D9CDB" 
        unfilledColor="#E8E8E8"
        borderWidth={0}
        height={4}
        style={styles.activityProgress}
      />
    </TouchableOpacity>
  );

  const handleMaterialPress = (material: StudyMaterial) => {
    // TODO: Navigate to material viewer
    console.log('Material pressed:', material);
  };

  const handleDeleteMaterial = async (material: StudyMaterial) => {
    Alert.alert(
      'Delete Material',
      'Are you sure you want to delete this material?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyService.deleteMaterial(material.id);
              await loadMaterials();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete material');
            }
          },
        },
      ]
    );
  };

  const handleRefreshMaterials = async () => {
    setRefreshing(true);
    await loadMaterials();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome Back, {userName}!</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Overall Progress</Text>
        <Progress.Bar 
          progress={calculateOverallProgress()} 
          width={null} 
          color="#2D9CDB" 
          unfilledColor="#E8E8E8"
          borderWidth={0}
          height={8}
          style={styles.overallProgress}
        />
      </View>

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => Alert.alert('Continue', 'Resuming your study plan')}
      >
        <Text style={styles.continueButtonText}>Continue Study Plan</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.continueButton, { backgroundColor: '#4CAF50' }]}
        onPress={() => navigation.navigate('InstructorAI')}
      >
        <Text style={styles.continueButtonText}>Ask AI Instructor</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
      />

      <Text style={styles.sectionTitle}>Study Materials</Text>

      <StudyMaterialList
        materials={materials}
        onMaterialPress={handleMaterialPress}
        onDeletePress={handleDeleteMaterial}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefreshMaterials} />
        }
      />

      <UploadFAB onUploadComplete={loadMaterials} />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert('New Activity', 'Create a new study session')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D9CDB',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  overallProgress: {
    width: '100%',
  },
  continueButton: {
    backgroundColor: '#2D9CDB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  list: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
  },
  activityProgress: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2D9CDB',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 30,
    marginTop: -2,
  },
});
