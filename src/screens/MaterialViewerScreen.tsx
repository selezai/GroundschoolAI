import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { StudyMaterial, StudyNote } from '../types/studyMaterial';
import StudyMaterialService from '../services/studyMaterial/studyMaterialService';

const MaterialViewerScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { material } = route.params as { material: StudyMaterial };
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const studyMaterialService = StudyMaterialService.getInstance();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const materialNotes = await studyMaterialService.getNotes(material.id);
    setNotes(materialNotes);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    const note: StudyNote = {
      id: Date.now().toString(),
      materialId: material.id,
      content: newNote.trim(),
      timestamp: Date.now(),
      tags: [],
    };

    try {
      await studyMaterialService.saveNote(note);
      setNewNote('');
      await loadNotes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const renderContent = () => {
    switch (material.type) {
      case 'document':
        return (
          <WebView
            source={{ uri: material.fileUrl || '' }}
            style={styles.webview}
            javaScriptEnabled={true}
          />
        );
      case 'video':
        return (
          <WebView
            source={{ uri: material.fileUrl || '' }}
            style={styles.webview}
            allowsFullscreenVideo={true}
          />
        );
      case 'interactive':
        return (
          <WebView
            source={{ uri: material.fileUrl || '' }}
            style={styles.webview}
            javaScriptEnabled={true}
          />
        );
      default:
        return (
          <ScrollView style={styles.contentContainer}>
            <Text style={styles.content}>{material.content}</Text>
          </ScrollView>
        );
    }
  };

  const renderNotes = () => (
    <View style={[styles.notesContainer, showNotes && styles.notesVisible]}>
      <View style={styles.notesHeader}>
        <Text style={styles.notesTitle}>Notes</Text>
        <TouchableOpacity onPress={() => setShowNotes(false)}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.notesList}>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteItem}>
            <Text style={styles.noteContent}>{note.content}</Text>
            <Text style={styles.noteTimestamp}>
              {new Date(note.timestamp).toLocaleString()}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.addNoteContainer}>
        <TextInput
          style={styles.noteInput}
          value={newNote}
          onChangeText={setNewNote}
          placeholder="Add a note..."
          multiline
        />
        <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
          <Ionicons name="send" size={24} color="#2D9CDB" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{material.title}</Text>
        <TouchableOpacity onPress={() => setShowNotes(true)}>
          <Ionicons name="document-text" size={24} color="#2D9CDB" />
        </TouchableOpacity>
      </View>
      {renderContent()}
      {showNotes && renderNotes()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  webview: {
    flex: 1,
  },
  notesContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    transform: [{ translateX: 1000 }],
  },
  notesVisible: {
    transform: [{ translateX: 0 }],
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  notesList: {
    flex: 1,
    padding: 16,
  },
  noteItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  addNoteContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  noteInput: {
    flex: 1,
    marginRight: 12,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    maxHeight: 100,
  },
  addNoteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
});

export default MaterialViewerScreen;
