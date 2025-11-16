// --- src/screens/MyAppointmentsScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, Alert, Button, TouchableOpacity 
} from 'react-native';
import apiClient from '../api/client';
// ¡IMPORTACIÓN CORREGIDA!
import { useAuth } from '../context/AuthContext'; 
import { useIsFocused, useTheme, useNavigation } from '@react-navigation/native';

const MyAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const { colors } = useTheme(); // Para el modo oscuro/claro
  const isFocused = useIsFocused(); // Para recargar
  const navigation = useNavigation();

  // 1. Función para cargar las citas
  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // Llama al endpoint protegido de "mis citas"
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

  // 2. Carga los datos cuando la pantalla se enfoca
  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
    }
  }, [isFocused]); // Dependencia clave

  // 3. Función para que el paciente cancele su cita
  const handlePatientCancel = (appointmentId) => {
    Alert.alert(
      "Cancelar Cita",
      "¿Estás seguro de que quieres cancelar esta cita?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Sí, Cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              // Llama al endpoint DELETE que ya tiene permisos mixtos
              await apiClient.delete(`/appointments/${appointmentId}`);
              Alert.alert('Éxito', 'Tu cita ha sido cancelada.');
              fetchAppointments(); // Recarga la lista
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la cita.');
            }
          }
        }
      ]
    );
  };

  // 4. Lógica para Volver a Agendar (Opción 2)
  const handleReschedule = (item) => {
    // Navega al formulario de creación, pasando los datos antiguos
    navigation.navigate('AppointmentCreate', {
      defaultDoctorId: item.doctor.id,
      defaultReason: item.reason
    });
  };

  // 5. Muestra "Cargando..."
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Cargando mis citas...</Text>
      </View>
    );
  }

  // 6. Componente para renderizar cada cita
  const renderAppointmentItem = ({ item }) => {
    
    const isCancelled = item.status.name === 'cancelada';
    
    // Asigna colores de estado
    let statusColor = '#fca311'; // Pendiente (Naranja)
    if (item.status.name === 'confirmada') statusColor = '#2a9d8f'; // Confirmada (Verde)
    else if (isCancelled) statusColor = '#e63946'; // Cancelada (Rojo)

    return (
      <View style={[
        styles.itemContainer, 
        { 
          backgroundColor: colors.card, 
          borderColor: isCancelled ? '#e63946' : colors.card, // Borde rojo si está cancelada
        }
      ]}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.reason || 'Cita Médica'}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.text }]}>
          Doctor: {item.doctor.full_name}
        </Text>
        <Text style={[styles.itemSubtitle, { color: colors.text }]}>
          Fecha: {new Date(item.appointment_date).toLocaleString()}
        </Text>
        
        {/* Muestra el motivo de cancelación (Opción 3) */}
        {isCancelled && item.cancellation_reason && (
          <Text style={styles.cancelReason}>
            Motivo: {item.cancellation_reason}
          </Text>
        )}

        {/* Muestra el estado */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status.name}</Text>
        </View>

        {/* Lógica de Botones (Opción 2) */}
        <View style={styles.buttonRow}>
          {isCancelled && (
            <Button 
              title="Volver a Agendar" 
              onPress={() => handleReschedule(item)} 
              color={colors.primary}
            />
          )}
          {item.status.name === 'pendiente' && (
            <Button 
              title="Cancelar Cita"
              onPress={() => handlePatientCancel(item.id)}
              color="#e63946"
            />
          )}
        </View>
      </View>
    );
  };

  // 7. Muestra la lista de citas
  return (
    <FlatList
      data={appointments}
      renderItem={renderAppointmentItem}
      keyExtractor={(item) => item.id.toString()}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListHeaderComponent={
        <View style={{ margin: 10, marginBottom: 15 }}>
          <Button 
            title="Agendar Nueva Cita"
            // ¡Botón corregido!
            onPress={() => navigation.navigate('AppointmentCreate')}
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
    backgroundColor: 'white',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2, // Grosor del borde
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
    top: -1, 
    right: -1, 
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopRightRadius: 8, // Ajustado al radio del contenedor
    borderBottomLeftRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelReason: { // Estilo para el motivo de cancelación
    fontSize: 14,
    fontStyle: 'italic',
    color: '#e63946',
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e63946',
    paddingLeft: 8,
    marginTop: 5,
  },
  buttonRow: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});

export default MyAppointmentsScreen;