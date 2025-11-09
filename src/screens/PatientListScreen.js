// --- src/screens/PatientListScreen.js ---

import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, TouchableOpacity, Alert, Button 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../../App';
import { useNavigation, useIsFocused, useTheme } from '@react-navigation/native'; // Importa useTheme

const PatientListScreen = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused(); // Hook para saber si la pantalla está visible
  const { colors } = useTheme(); // ¡Obtiene los colores del tema!

  // --- 1. Añadimos un botón "+" a la barra de navegación ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button 
          onPress={() => navigation.navigate('PatientCreate')} 
          title="+" // Puedes usar un ícono aquí más adelante
          color={colors.primary} // Usa el color primario del tema
        />
      ),
    });
  }, [navigation, colors.primary]); // Se actualiza si el color del tema cambia
  
  // --- 2. Función para cargar los pacientes ---
  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/patients/');
      setPatients(response.data); // Guarda la lista de pacientes
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

  // --- 3. useEffect se ejecuta al cargar y CADA VEZ que volvemos a la pantalla ---
  useEffect(() => {
    if (isFocused) {
      fetchPatients();
    }
  }, [isFocused]); // Dependencia clave

  // --- 4. Muestra "Cargando..." ---
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text }}>Cargando pacientes...</Text>
      </View>
    );
  }

  // --- 5. Componente para renderizar cada item de la lista ---
  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      // ¡Estilos dinámicos!
      style={[styles.itemContainer, { backgroundColor: colors.card }]} 
      // Al tocar, navega a 'PatientDetail' y pasa el 'patientId'
      onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
    >
      <View>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.full_name}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.7 }]}>{item.email || 'Sin email'}</Text>
      </View>
      <Text style={[styles.itemArrow, { color: colors.text, opacity: 0.3 }]}>&gt;</Text>
    </TouchableOpacity>
  );

  // --- 6. Muestra la lista de pacientes ---
  return (
    <FlatList
      data={patients}
      renderItem={renderPatientItem}
      keyExtractor={(item) => item.id.toString()}
      // ¡Estilo dinámico!
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 10 }} // Espacio al inicio
      ListEmptyComponent={ // Se muestra si la lista está vacía
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No hay pacientes registrados.
        </Text>
      }
      // Habilitar "pull to refresh"
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
    padding: 20,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    // Sombra para Android e iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
  },
  itemArrow: {
    fontSize: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});

export default PatientListScreen;