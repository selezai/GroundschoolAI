import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import learningPathService from '../services/recommendation/learningPathService';
import { ProgressChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface CategoryProgress {
  category: string;
  progress: number;
}

const LearningPathScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [weakestTopics, setWeakestTopics] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<any>(null);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [topics, path] = await Promise.all([
        learningPathService.getWeakestTopics(),
        learningPathService.generateRecommendedPath(),
      ]);
      
      setWeakestTopics(topics);
      setCurrentPath(path);

      // Calculate progress for visualization
      const progress = path.categories.map(category => ({
        category,
        progress: Math.random(), // Replace with actual progress calculation
      }));
      setCategoryProgress(progress);
    } catch (error) {
      console.error('Error loading learning path data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProgressChart = () => {
    if (!categoryProgress.length) return null;

    const data = {
      labels: categoryProgress.map(cp => cp.category),
      data: categoryProgress.map(cp => cp.progress),
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Category Progress</Text>
        <ProgressChart
          data={data}
          width={width - 32}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(45, 156, 219, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          hideLegend={false}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>
    );
  };

  const startQuestionSet = (setId: string) => {
    navigation.navigate('Quiz', { setId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D9CDB" />
        <Text style={styles.loadingText}>Generating your learning path...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Current Path Overview */}
        <View style={styles.pathCard}>
          <View style={styles.pathHeader}>
            <Icon name="school" size={24} color="#2D9CDB" />
            <Text style={styles.pathTitle}>{currentPath?.title}</Text>
          </View>
          <Text style={styles.pathDescription}>{currentPath?.description}</Text>
          <View style={styles.pathStats}>
            <View style={styles.statItem}>
              <Icon name="timer" size={20} color="#666" />
              <Text style={styles.statText}>
                {currentPath?.estimatedDuration} mins
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="fitness-center" size={20} color="#666" />
              <Text style={styles.statText}>
                {currentPath?.difficulty}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Chart */}
        {renderProgressChart()}

        {/* Weak Topics */}
        <View style={styles.topicsCard}>
          <Text style={styles.sectionTitle}>Focus Areas</Text>
          {weakestTopics.map((topic, index) => (
            <View key={topic} style={styles.topicItem}>
              <Icon name="warning" size={20} color="#FF9500" />
              <Text style={styles.topicText}>{topic}</Text>
            </View>
          ))}
        </View>

        {/* Recommended Question Sets */}
        <View style={styles.setsCard}>
          <Text style={styles.sectionTitle}>Recommended Practice Sets</Text>
          {currentPath?.questionSets.map((setId: string, index: number) => (
            <TouchableOpacity
              key={setId}
              style={styles.setItem}
              onPress={() => startQuestionSet(setId)}
            >
              <View style={styles.setInfo}>
                <Text style={styles.setTitle}>Practice Set {index + 1}</Text>
                <Text style={styles.setDescription}>
                  Focuses on {currentPath.categories[index % currentPath.categories.length]}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#2D9CDB" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  pathCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  pathHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pathTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  pathDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  pathStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  topicsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  topicText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  setsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  setInfo: {
    flex: 1,
    marginRight: 16,
  },
  setTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  setDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default LearningPathScreen;
