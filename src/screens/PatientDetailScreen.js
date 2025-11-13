// --- src/screens/PatientDetailScreen.js (Actualizado para Tema) ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Button, Image 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useTheme } from '@react-navigation/native'; // ¡Importa useTheme!

const PatientDetailScreen = ({ route }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const { colors } = useTheme(); // ¡Obtiene los colores del tema!

  useEffect(() => {
    // ... (Lógica de fetchPatientDetail idéntica) ...
    const fetchPatientDetail = async () => {
      try {
        const response = await apiClient.get(`/patients/${patientId}`);
        setPatient(response.data);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) { signOut(); } 
        else { Alert.alert('Error', 'No se pudo cargar la información del paciente.'); }
      } finally {
        setIsLoading(false);
      }
    };
    navigation.setOptions({ title: 'Cargando...' });
    fetchPatientDetail();
  }, [patientId, signOut, navigation]);

  useEffect(() => {
    if (patient) {
      navigation.setOptions({ title: patient.full_name });
    }
  }, [patient, navigation]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!patient) { /* ... */ }

  // 5. Muestra la ficha completa (¡con estilos dinámicos!)
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sección de Datos Personales */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos Personales</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Email: {patient.email || 'N/A'}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Teléfono: {patient.phone || 'N/A'}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Género: {patient.gender || 'N/A'}</Text>
      </View>

      {/* Sección de Notas Médicas */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas Médicas</Text>
        {patient.medical_notes.length > 0 ? (
          patient.medical_notes.map((note) => (
            <View key={note.id} style={[styles.itemBox, { borderColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{note.title}</Text>
              <Text style={{ color: colors.text }}>{note.content}</Text>
              <Text style={styles.itemDate}>{new Date(note.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.infoText, { color: colors.text }]}>Sin notas médicas.</Text>
        )}
      </View>

      {/* Sección de Signos Vitales */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Signos Vitales</Text>
        {patient.vital_signs.length > 0 ? (
          patient.vital_signs.map((vital) => (
            <View key={vital.id} style={[styles.itemBox, { borderColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{vital.type_name}: {vital.value} {vital.unit}</Text>
              <Text style={styles.itemDate}>{new Date(vital.measured_at).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.infoText, { color: colors.text }]}>Sin signos vitales.</Text>
        )}
      </View>

      {/* Sección de Archivos (Fotos) */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Archivos y Fotos</Text>
        {patient.files.length > 0 ? (
          patient.files.map((file) => (
            <View key={file.id} style={[styles.itemBox, { borderColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{file.description || 'Archivo'}</Text>
              <Image 
                source={{ uri: `${apiClient.defaults.baseURL}${file.file_path}` }} 
                style={styles.image} 
              />
            </View>
          ))
        ) : (
          <Text style={[styles.infoText, { color: colors.text }]}>Sin archivos.</Text>
        )}
      </View>
      
      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  section: {
    margin: 15,
    marginBottom: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  itemBox: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 5,
    marginTop: 10,
    backgroundColor: '#eee'
  }
});

export default PatientDetailScreen;