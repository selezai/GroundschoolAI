import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getProcessingStatus } from '../services/api/materialService';
import { useInterval } from '../hooks/useInterval';

interface ProcessingStage {
  stage: string;
  status: 'processing' | 'ready' | 'error';
  progress: number;
  message: string;
}

interface ProcessingProgressProps {
  materialId: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const POLLING_INTERVAL = 2000; // Poll every 2 seconds

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  materialId,
  onComplete,
  onError,
}) => {
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [progressAnim] = useState(new Animated.Value(0));

  // Fetch processing status
  const fetchStatus = async () => {
    try {
      const status = await getProcessingStatus(materialId);
      setStages(status);

      // Check if all stages are complete
      const complete = status.every((stage) => stage.status === 'ready');
      const hasError = status.some((stage) => stage.status === 'error');

      if (complete) {
        setIsComplete(true);
        onComplete?.();
      } else if (hasError) {
        const errorStage = status.find((stage) => stage.status === 'error');
        onError?.(errorStage?.message || 'Processing failed');
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
      onError?.('Failed to fetch processing status');
    }
  };

  // Poll for updates
  useInterval(fetchStatus, isComplete ? null : POLLING_INTERVAL);

  // Animate progress bar
  useEffect(() => {
    if (stages.length > 0) {
      const totalProgress = stages.reduce((sum, stage) => sum + stage.progress, 0);
      const averageProgress = totalProgress / stages.length;

      Animated.spring(progressAnim, {
        toValue: averageProgress,
        useNativeDriver: false,
      }).start();
    }
  }, [stages]);

  const getStageIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <MaterialIcons name="check-circle" size={24} color="#4CAF50" />;
      case 'error':
        return <MaterialIcons name="error" size={24} color="#F44336" />;
      case 'processing':
        return <MaterialIcons name="hourglass-empty" size={24} color="#2196F3" />;
      default:
        return <MaterialIcons name="help" size={24} color="#9E9E9E" />;
    }
  };

  const formatStageName = (stage: string) => {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <View style={styles.stages}>
        {stages.map((stage, index) => (
          <View key={index} style={styles.stage}>
            {getStageIcon(stage.status)}
            <View style={styles.stageInfo}>
              <Text style={styles.stageName}>{formatStageName(stage.stage)}</Text>
              <Text style={styles.stageMessage}>{stage.message}</Text>
            </View>
            <Text style={styles.stageProgress}>
              {Math.round(stage.progress * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  stages: {
    gap: 12,
  },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageInfo: {
    flex: 1,
  },
  stageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stageMessage: {
    fontSize: 14,
    color: '#666',
  },
  stageProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
});

export default ProcessingProgress;
