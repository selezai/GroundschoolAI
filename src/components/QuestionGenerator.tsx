import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SubjectCategory } from '../types/question';
import { StudyMaterial } from '../types/study';
import questionGenerator from '../services/questionGenerator';
import { TextInput, Slider } from 'react-native';

interface QuestionGeneratorProps {
  materials: StudyMaterial[];
  onComplete: () => void;
}

const validationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  category: Yup.string().required('Category is required'),
  totalQuestions: Yup.number()
    .min(5, 'Minimum 5 questions')
    .max(100, 'Maximum 100 questions')
    .required('Number of questions is required'),
  timeLimit: Yup.number()
    .min(5, 'Minimum 5 minutes')
    .max(180, 'Maximum 180 minutes')
    .required('Time limit is required'),
  difficultyDistribution: Yup.object().shape({
    easy: Yup.number().min(0).max(100),
    medium: Yup.number().min(0).max(100),
    hard: Yup.number().min(0).max(100),
  }),
  selectedMaterials: Yup.array()
    .min(1, 'Select at least one study material')
    .required('Study materials are required'),
});

const QuestionGeneratorComponent: React.FC<QuestionGeneratorProps> = ({
  materials,
  onComplete,
}) => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async (values: any) => {
    try {
      setGenerating(true);
      setProgress(0);

      await questionGenerator.generateQuestionSet(values.selectedMaterials, {
        title: values.title,
        description: values.description,
        category: values.category as SubjectCategory,
        totalQuestions: values.totalQuestions,
        timeLimit: values.timeLimit,
        difficultyDistribution: values.difficultyDistribution,
      });

      Alert.alert(
        'Success',
        'Questions generated successfully!',
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Formik
        initialValues={{
          title: '',
          description: '',
          category: '',
          totalQuestions: 30,
          timeLimit: 45,
          difficultyDistribution: {
            easy: 30,
            medium: 40,
            hard: 30,
          },
          selectedMaterials: [],
        }}
        validationSchema={validationSchema}
        onSubmit={handleGenerate}
      >
        {({
          handleChange,
          handleBlur,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldValue,
        }) => (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Question Set Details</Text>

            <TextInput
              style={styles.input}
              placeholder="Title"
              onChangeText={handleChange('title')}
              onBlur={handleBlur('title')}
              value={values.title}
            />
            {touched.title && errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              multiline
              numberOfLines={3}
              onChangeText={handleChange('description')}
              onBlur={handleBlur('description')}
              value={values.description}
            />
            {touched.description && errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}

            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryList}
            >
              {Object.values(SubjectCategory).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    values.category === category && styles.selectedCategoryChip,
                  ]}
                  onPress={() => setFieldValue('category', category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      values.category === category &&
                        styles.selectedCategoryChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {touched.category && errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}

            <Text style={styles.label}>
              Number of Questions: {values.totalQuestions}
            </Text>
            <Slider
              value={values.totalQuestions}
              onValueChange={(value) => setFieldValue('totalQuestions', value)}
              minimumValue={5}
              maximumValue={100}
              step={5}
            />

            <Text style={styles.label}>
              Time Limit (minutes): {values.timeLimit}
            </Text>
            <Slider
              value={values.timeLimit}
              onValueChange={(value) => setFieldValue('timeLimit', value)}
              minimumValue={5}
              maximumValue={180}
              step={5}
            />

            <Text style={styles.label}>Difficulty Distribution</Text>
            <View style={styles.difficultyContainer}>
              {Object.entries(values.difficultyDistribution).map(
                ([level, value]) => (
                  <View key={level} style={styles.difficultyItem}>
                    <Text style={styles.difficultyLabel}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                    <Text style={styles.difficultyValue}>{value}%</Text>
                    <Slider
                      style={styles.difficultySlider}
                      value={value}
                      onValueChange={(newValue) =>
                        setFieldValue(`difficultyDistribution.${level}`, newValue)
                      }
                      minimumValue={0}
                      maximumValue={100}
                      step={5}
                    />
                  </View>
                )
              )}
            </View>

            <Text style={styles.sectionTitle}>Select Study Materials</Text>
            <ScrollView style={styles.materialList}>
              {materials.map((material) => (
                <TouchableOpacity
                  key={material.id}
                  style={[
                    styles.materialItem,
                    values.selectedMaterials.includes(material.id) &&
                      styles.selectedMaterialItem,
                  ]}
                  onPress={() => {
                    const selected = values.selectedMaterials.includes(
                      material.id
                    );
                    setFieldValue(
                      'selectedMaterials',
                      selected
                        ? values.selectedMaterials.filter(
                            (id: string) => id !== material.id
                          )
                        : [...values.selectedMaterials, material.id]
                    );
                  }}
                >
                  <Icon
                    name={
                      values.selectedMaterials.includes(material.id)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={24}
                    color="#2D9CDB"
                  />
                  <Text style={styles.materialTitle}>{material.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {touched.selectedMaterials && errors.selectedMaterials && (
              <Text style={styles.errorText}>{errors.selectedMaterials}</Text>
            )}

            <TouchableOpacity
              style={[styles.generateButton, generating && styles.generatingButton]}
              onPress={handleSubmit}
              disabled={generating}
            >
              {generating ? (
                <View style={styles.generatingContent}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.buttonText}>
                    Generating... {Math.round(progress * 100)}%
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Generate Questions</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  categoryList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F6F6F6',
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: '#2D9CDB',
  },
  categoryChipText: {
    color: '#666',
  },
  selectedCategoryChipText: {
    color: '#fff',
  },
  difficultyContainer: {
    marginBottom: 16,
  },
  difficultyItem: {
    marginBottom: 12,
  },
  difficultyLabel: {
    fontSize: 14,
    color: '#666',
  },
  difficultyValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  difficultySlider: {
    width: '100%',
  },
  materialList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F6F6F6',
    marginBottom: 8,
  },
  selectedMaterialItem: {
    backgroundColor: '#E3F2FD',
  },
  materialTitle: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  generateButton: {
    backgroundColor: '#2D9CDB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  generatingButton: {
    backgroundColor: '#90CAF9',
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
});

export default QuestionGeneratorComponent;
