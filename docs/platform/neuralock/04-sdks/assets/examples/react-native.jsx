import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { NeuralockClient } from '@neuralock/react-native';

// Mobile-optimized Neuralock provider
const NeuralockMobileProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    initializeClient();
    setupNetworkListener();
  }, []);

  const initializeClient = async () => {
    try {
      // Get stored session from secure storage
      const storedSession = await SecureStore.getItemAsync('neuralock_session');
      
      const config = {
        applicationContract: process.env.REACT_APP_CONTRACT,
        signer: await getMobileSigner(),
        servers: [
          { nftId: 1 },
          { nftId: 2 },
          { nftId: 3 }
        ],
        options: {
          storage: new MobileSecureStorage(),
          offlineMode: true,
          sessionPersistence: true
        }
      };

      const neuralockClient = new NeuralockClient(config);
      
      if (storedSession) {
        // Restore session
        await neuralockClient.restoreSession(JSON.parse(storedSession));
      } else {
        // Initialize new session
        await neuralockClient.initialize();
      }

      setClient(neuralockClient);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Neuralock:', error);
      Alert.alert('Error', 'Failed to initialize encryption service');
    }
  };

  const setupNetworkListener = () => {
    NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
  };

  return (
    <NeuralockContext.Provider value={{ client, isInitialized, isOffline }}>
      {children}
    </NeuralockContext.Provider>
  );
};

// Secure storage adapter for React Native
class MobileSecureStorage {
  async store(key, value) {
    const serialized = JSON.stringify(value);
    
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Use secure keychain/keystore
      await SecureStore.setItemAsync(`neuralock_${key}`, serialized);
    } else {
      // Fallback for web
      await AsyncStorage.setItem(`neuralock_${key}`, serialized);
    }
  }

  async retrieve(key) {
    let value;
    
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      value = await SecureStore.getItemAsync(`neuralock_${key}`);
    } else {
      value = await AsyncStorage.getItem(`neuralock_${key}`);
    }
    
    return value ? JSON.parse(value) : null;
  }

  async remove(key) {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await SecureStore.deleteItemAsync(`neuralock_${key}`);
    } else {
      await AsyncStorage.removeItem(`neuralock_${key}`);
    }
  }
}

// Biometric authentication hook
const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState(null);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (compatible && enrolled) {
      setIsAvailable(true);
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometricType(types[0]); // Use primary biometric type
    }
  };

  const authenticate = async (reason = 'Authenticate to access encrypted data') => {
    if (!isAvailable) {
      throw new Error('Biometric authentication not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  };

  return {
    isAvailable,
    biometricType,
    authenticate
  };
};

// Secure notes app example
const SecureNotesApp = () => {
  const { client, isInitialized, isOffline } = useNeuralock();
  const { authenticate, isAvailable: biometricAvailable } = useBiometricAuth();
  
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      loadNotes();
    }
  }, [isInitialized]);

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from local cache first
      const cachedNotes = await AsyncStorage.getItem('cached_notes_metadata');
      if (cachedNotes) {
        setNotes(JSON.parse(cachedNotes));
      }

      // Then sync with server if online
      if (!isOffline) {
        const serverNotes = await fetchNotesFromServer();
        setNotes(serverNotes);
        await AsyncStorage.setItem('cached_notes_metadata', JSON.stringify(serverNotes));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  const saveNote = async () => {
    try {
      // Require biometric auth for saving
      if (biometricAvailable) {
        const authenticated = await authenticate('Authenticate to save note');
        if (!authenticated) return;
      }

      setIsLoading(true);

      const noteId = `note-${Date.now()}`;
      const noteData = {
        ...currentNote,
        id: noteId,
        createdAt: new Date().toISOString()
      };

      if (isOffline) {
        // Save to offline queue
        await queueOfflineOperation({
          type: 'encrypt',
          data: noteData,
          objectId: noteId
        });
        
        // Update local state
        setNotes([...notes, { ...noteData, synced: false }]);
      } else {
        // Encrypt and save online
        const encrypted = await client.encrypt(
          JSON.stringify(noteData),
          noteId
        );

        await saveNoteToServer(noteId, encrypted);
        setNotes([...notes, { ...noteData, synced: true }]);
      }

      // Clear editor
      setCurrentNote({ title: '', content: '' });
      setShowNoteEditor(false);
      
      Alert.alert('Success', 'Note saved securely');
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsLoading(false);
    }
  };

  const viewNote = async (note) => {
    try {
      // Require biometric auth to view
      if (biometricAvailable) {
        const authenticated = await authenticate('Authenticate to view note');
        if (!authenticated) return;
      }

      setIsLoading(true);

      let decryptedNote;
      
      if (note.synced && !isOffline) {
        // Fetch and decrypt from server
        const encrypted = await fetchNoteFromServer(note.id);
        const decrypted = await client.decrypt(encrypted, note.id);
        decryptedNote = JSON.parse(decrypted);
      } else {
        // Load from local encrypted storage
        const localEncrypted = await SecureStore.getItemAsync(`note_${note.id}`);
        if (localEncrypted) {
          // In offline mode, we can only show cached decrypted data
          decryptedNote = await getCachedDecryptedNote(note.id);
        }
      }

      if (decryptedNote) {
        Alert.alert(
          decryptedNote.title,
          decryptedNote.content,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decrypt note');
    } finally {
      setIsLoading(false);
    }
  };

  const syncOfflineData = async () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot sync while offline');
      return;
    }

    try {
      setIsLoading(true);
      
      const offlineQueue = await getOfflineQueue();
      
      for (const operation of offlineQueue) {
        if (operation.type === 'encrypt') {
          const encrypted = await client.encrypt(
            JSON.stringify(operation.data),
            operation.objectId
          );
          
          await saveNoteToServer(operation.objectId, encrypted);
        }
      }

      // Clear offline queue
      await clearOfflineQueue();
      
      // Reload notes
      await loadNotes();
      
      Alert.alert('Success', 'All notes synced');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync notes');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Notes</Text>
        {isOffline && (
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}
      </View>

      {!isInitialized ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : showNoteEditor ? (
        <View style={styles.editor}>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={currentNote.title}
            onChangeText={(text) => setCurrentNote({ ...currentNote, title: text })}
          />
          <TextInput
            style={[styles.input, styles.contentInput]}
            placeholder="Content"
            value={currentNote.content}
            onChangeText={(text) => setCurrentNote({ ...currentNote, content: text })}
            multiline
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowNoteEditor(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={saveNote}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Saving...' : 'Save Securely'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <ScrollView style={styles.notesList}>
            {notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={styles.noteItem}
                onPress={() => viewNote(note)}
              >
                <Text style={styles.noteTitle}>{note.title}</Text>
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
                {!note.synced && (
                  <Text style={styles.unsyncedIndicator}>Not synced</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowNoteEditor(true)}
            >
              <Text style={styles.buttonText}>New Note</Text>
            </TouchableOpacity>
            
            {!isOffline && (
              <TouchableOpacity
                style={[styles.button, styles.syncButton]}
                onPress={syncOfflineData}
              >
                <Text style={styles.buttonText}>Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
};

// Offline queue management
const queueOfflineOperation = async (operation) => {
  const queue = await AsyncStorage.getItem('offline_queue');
  const operations = queue ? JSON.parse(queue) : [];
  operations.push(operation);
  await AsyncStorage.setItem('offline_queue', JSON.stringify(operations));
};

const getOfflineQueue = async () => {
  const queue = await AsyncStorage.getItem('offline_queue');
  return queue ? JSON.parse(queue) : [];
};

const clearOfflineQueue = async () => {
  await AsyncStorage.removeItem('offline_queue');
};

// Mock server functions
const fetchNotesFromServer = async () => {
  // Implement actual API call
  return [];
};

const saveNoteToServer = async (noteId, encrypted) => {
  // Implement actual API call
};

const fetchNoteFromServer = async (noteId) => {
  // Implement actual API call
};

const getCachedDecryptedNote = async (noteId) => {
  // Implement secure cache retrieval
};

// Mobile signer implementation
const getMobileSigner = async () => {
  // This would integrate with mobile wallet like WalletConnect
  // or use secure enclave for key management
  return {
    getAddress: async () => '0x1234...',
    signMessage: async (message) => '0xsignature...'
  };
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  offlineIndicator: {
    backgroundColor: '#ff9800',
    padding: 5,
    borderRadius: 5,
  },
  offlineText: {
    color: 'white',
    fontSize: 12,
  },
  editor: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  contentInput: {
    height: 200,
    textAlignVertical: 'top',
  },
  notesList: {
    flex: 1,
    padding: 20,
  },
  noteItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  noteDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  unsyncedIndicator: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 5,
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
});

export { NeuralockMobileProvider, SecureNotesApp, useBiometricAuth };