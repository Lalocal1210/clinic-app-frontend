// --- src/screens/PatientListScreen.js ---

import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, TouchableOpacity, Alert, Button, TextInput
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; // ¡IMPORTACIÓN CORREGIDA!
import { useNavigation, useIsFocused, useTheme } from '@react-navigation/native';

// Hook simple para "debouncing" (evitar llamar a la API en cada tecleo)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};


const PatientListScreen = () => {
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Estado para Paginación ---
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Si hay más datos por cargar

  // --- Estado para Búsqueda ---
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Espera 500ms

  const { signOut } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  // --- ¡LÍNEA CORREGIDA! (Sin el guion bajo) ---
  const { colors } = useTheme();

  // --- 1. Botón "+" en la cabecera ---
  useLayoutEffect(() => {
    navigation.setOptions({
      // Mostramos el header para que el título y el botón sean visibles
      headerShown: true, 
      headerRight: () => (
        <Button 
          onPress={() => navigation.navigate('PatientCreate')} 
          title="+"
          color={colors.primary} 
        />
      ),
    });
  }, [navigation, colors.primary]);
  
  // --- 2. Función para cargar los pacientes (¡CON PAGINACIÓN!) ---
  const fetchPatients = useCallback(async (search = '', reset = false) => {
    
    // 'reset = true' se usa para búsqueda nueva o "pull-to-refresh"
    const currentPage = reset ? 0 : page;
    
    if (reset) {
        setIsLoading(true); // Spinner principal
        setPage(0); // Resetea el contador de página
        setHasMore(true); // Asume que hay más datos
    } else {
        // No cargar más si ya se está cargando o no hay más páginas
        if (isLoading || isLoadingMore || !hasMore) return; 
        setIsLoadingMore(true); // Spinner al final de la lista
    }

    try {
      const response = await apiClient.get('/patients/', {
        params: { 
          search: search,
          skip: currentPage * 20, // 0*20=0, 1*20=20, 2*20=40
          limit: 20
        }
      });
      
      if (response.data.length < 20) {
        setHasMore(false); // No hay más páginas
      }

      if (reset) {
        setPatients(response.data); // Resetea la lista
      } else {
        // Añade los nuevos pacientes a la lista existente
        setPatients(prevPatients => [...prevPatients, ...response.data]);
      }
      setPage(currentPage + 1); // Avanza a la siguiente página

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
      setIsLoadingMore(false);
    }
  }, [page, isLoading, isLoadingMore, hasMore, signOut]); // Dependencias de useCallback

  // --- 3. Efecto de Búsqueda (Se activa cuando el usuario DEJA de teclear) ---
  useEffect(() => {
    if (isFocused) {
      fetchPatients(debouncedSearchQuery, true); // 'true' para resetear la lista
    }
  }, [debouncedSearchQuery, isFocused]); // (Quitamos fetchPatients de las deps)

  // Función para cargar más datos al hacer scroll
  const handleLoadMore = () => {
    fetchPatients(debouncedSearchQuery);
  };

  // Función para recargar (pull-to-refresh)
  const handleRefresh = () => {
    fetchPatients(debouncedSearchQuery, true); // Resetea
  };
  
  // 4. Componente de renderizado
  const renderPatientItem = ({ item }) => {
    const lastAppointments = item.appointments ? item.appointments.slice(0, 2) : [];
    return (
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: colors.card }]} 
        onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{item.full_name}</Text>
          <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.7 }]}>{item.email || 'Sin email'}</Text>
          
          {/* Resumen de Historial de Citas */}
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
        </View>
        <Text style={[styles.itemArrow, { color: colors.text, opacity: 0.3 }]}>&gt;</Text>
      </TouchableOpacity>
    );
  };

  // 5. Cabecera de la Lista (Buscador)
  const ListHeader = (
    <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Buscar paciente por nombre..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  // 6. Pie de la Lista (Spinner)
  const ListFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  return (
    <FlatList
      data={patients}
      renderItem={renderPatientItem}
      keyExtractor={(item) => item.id.toString()}
      style={[styles.container, { backgroundColor: colors.background }]}
      
      ListHeaderComponent={ListHeader} // Barra de búsqueda arriba
      ListFooterComponent={ListFooter} // Spinner abajo
      
      ListEmptyComponent={
        <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
            {isLoading ? "Cargando..." : (searchQuery ? `No se encontraron pacientes para "${searchQuery}"` : "No hay pacientes registrados.")}
            </Text>
        </View>
      }
      
      // Props de Paginación
      onRefresh={handleRefresh}
      refreshing={isLoading}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5} // A mitad de la última página
    />
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 3,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
  },
  searchInput: {
    height: 40,
    fontSize: 16,
    paddingLeft: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
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
  historyContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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