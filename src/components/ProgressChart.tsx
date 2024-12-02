import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface ProgressChartProps {
  correct: number;
  incorrect: number;
  total: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ correct, incorrect, total }) => {
  const screenWidth = Dimensions.get('window').width - 64; // Account for padding

  const data = {
    labels: ['Correct', 'Incorrect', 'Remaining'],
    datasets: [
      {
        data: [
          (correct / total) * 100 || 0,
          (incorrect / total) * 100 || 0,
          ((total - correct - incorrect) / total) * 100 || 0,
        ],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: '#F5F5F5',
    backgroundGradientTo: '#F5F5F5',
    color: (opacity = 1) => `rgba(45, 156, 219, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={screenWidth}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default ProgressChart;
