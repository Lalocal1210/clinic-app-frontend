// --- src/screens/MyAppointmentsScreen.js (Actualizado para Tema) ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, Alert, Button 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../../App'; // Para cerrar sesión si el token falla
import { useIsFocused, useTheme } from '@react-navigation/native'; // ¡Importa useTheme!

const MyAppointmentsScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const isFocused = useIsFocused();
  const { colors } = useTheme(); // ¡Obtiene los colores del tema!

  // Función para cargar las citas
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/appointments/me');
      setAppointments(response.data); 
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Error', 'Tu sesión ha expirado o no tienes permisos.');
        signOut();
      } else {
        Alert.alert('Error', 'No se pudieron cargar tus citas.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Carga los datos cuando la pantalla se enfoca
  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
    }
  }, [isFocused, signOut]); // 'signOut' en dependencias por si acaso

  // Muestra "Cargando..."
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={{ color: colors.text }}>Cargando mis citas...</Text>
      </View>
    );
  }

  // Componente para renderizar cada cita
  const renderAppointmentItem = ({ item }) => (
    // ¡Estilos dinámicos!
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.reason || 'Cita Médica'}</Text>
      <Text style={[styles.itemSubtitle, { color: colors.text }]}>
        Doctor: {item.doctor.full_name}
      </Text>
      <Text style={[styles.itemSubtitle, { color: colors.text }]}>
        Fecha: {new Date(item.appointment_date).toLocaleString()}
      </Text>
      <View style={[
          styles.statusBadge, 
          { backgroundColor: item.status.name === 'pendiente' ? '#fca311' : '#2a9d8f' }
        ]}>
        <Text style={styles.statusText}>{item.status.name}</Text>
      </View>
    </View>
  );

  // Muestra la lista de citas
  return (
    <FlatList
      data={appointments}
      renderItem={renderAppointmentItem}
      keyExtractor={(item) => item.id.toString()}
      // ¡Estilo dinámico!
      style={[styles.container, { backgroundColor: colors.background }]}
      ListHeaderComponent={
        <View style={{ margin: 10 }}>
          <Button 
            title="Agendar Nueva Cita"
            onPress={() => Alert.alert('Próximamente', 'Aquí irá el formulario para agendar una nueva cita.')}
          />
        </View>
      }
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.text }]}>
          No tienes citas agendadas.
        </Text>
      }
      refreshing={isLoading}
      onRefresh={fetchAppointments}
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
    paddingHorizontal: 10,
  },
  itemContainer: {
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemSubtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});

export default MyAppointmentsScreen;