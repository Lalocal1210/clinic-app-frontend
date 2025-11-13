// --- src/screens/PatientListScreen.js ---

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, TouchableOpacity, Alert, Button 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useIsFocused, useTheme } from '@react-navigation/native';

const PatientListScreen = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Hook para saber si la pantalla está visible
  const { colors } = useTheme(); // ¡Obtiene los colores del tema!

  // --- 1. Añadimos el botón "+" a la barra de navegación ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button 
          onPress={() => navigation.navigate('PatientCreate')} 
          title="+" // Puedes cambiar esto por un ícono si prefieres
          color={colors.primary} 
        />
      ),
    });
  }, [navigation, colors.primary]); 
  
  // --- 2. Función para cargar los pacientes ---
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      // Llama al endpoint protegido de pacientes
      const response = await apiClient.get('/patients/');
      setPatients(response.data); 
    } catch (error) {
      console.error('Error fetching patients:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Error', 'Tu sesión ha expirado o no tienes permisos.');
        signOut();
      } else {
        Alert.alert('Error', 'No se pudieron cargar los pacientes.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. Recargar al enfocar ---
  useEffect(() => {
    if (isFocused) {
      fetchPatients();
    }
  }, [isFocused]); 

  // --- 4. Loading ---
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Cargando pacientes...</Text>
      </View>
    );
  }

  // --- 5. Renderizado de cada paciente ---
  const renderPatientItem = ({ item }) => {
    // Obtenemos las últimas 2 citas para el resumen (si existen)
    // (La API ya devuelve 'appointments' dentro del objeto Patient)
    const lastAppointments = item.appointments ? item.appointments.slice(0, 2) : [];

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: colors.card }]} 
        onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
      >
        <View style={{ flex: 1 }}>
          {/* Nombre y Email */}
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.full_name}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.7 }]}>{item.email || 'Sin email'}</Text>
          
          {/* --- Resumen de Historial de Citas --- */}
          {lastAppointments.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={[styles.historyTitle, { color: colors.primary }]}>Últimas citas:</Text>
              {lastAppointments.map(appt => (
                <Text key={appt.id} style={[styles.historyText, { color: colors.text }]}>
                  • {new Date(appt.appointment_date).toLocaleDateString()} - {appt.reason}
                </Text>
              ))}
            </View>
          )}
          {/* ----------------------------------- */}
          
        </View>
        <Text style={[styles.itemArrow, { color: colors.text, opacity: 0.3 }]}>&gt;</Text>
      </TouchableOpacity>
    );
  };

  // --- 6. Lista Principal ---
  return (
    <FlatList
      data={patients}
      renderItem={renderPatientItem}
      keyExtractor={(item) => item.id.toString()}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No hay pacientes registrados.
        </Text>
      }
      refreshing={isLoading}
      onRefresh={fetchPatients}
    />
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  itemArrow: {
    fontSize: 24,
    marginLeft: 10,
  },
  // Estilos para el historial
  historyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee', // Podrías usar colors.border si lo tuvieras en el theme
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyText: {
    fontSize: 12,
    opacity: 0.8,
    marginLeft: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  }
});

export default PatientListScreen;