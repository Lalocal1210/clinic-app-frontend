// --- src/screens/DashboardScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  Button, Alert, ScrollView, FlatList,
  TouchableOpacity, Modal, TextInput
} from 'react-native';
import apiClient from '../api/client';
// ¡IMPORTACIÓN CORREGIDA!
import { useAuth } from '../context/AuthContext'; 
import { useNavigation, useTheme, useIsFocused } from '@react-navigation/native';

const DashboardScreen = () => {
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para el Modal de cancelación
  const [modalVisible, setModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  
  const navigation = useNavigation();
  const { signOut, userRole } = useAuth(); // Obtenemos el rol del contexto
  const { colors } = useTheme(); // Para el modo oscuro/claro
  const isFocused = useIsFocused(); // Para recargar

  // --- 1. Lógica de Carga de Datos ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Siempre obtenemos el perfil del usuario
      const userResponse = await apiClient.get('/users/me');
      const currentUser = userResponse.data;
      setUser(currentUser);

      // Si es médico o admin, buscamos métricas Y citas
      if (currentUser.role.name === 'medico' || currentUser.role.name === 'admin') {
        
        const [metricsResponse, allAppointmentsResponse] = await Promise.all([
          apiClient.get('/dashboard/'),     // Las métricas
          apiClient.get('/appointments/all') // TODAS las citas
        ]);
        
        setMetrics(metricsResponse.data);
        
        // --- FILTRO IMPORTANTE (CORREGIDO) ---
        // Filtramos por estado 'pendiente' Y que la cita pertenezca a ESTE doctor
        const pending = allAppointmentsResponse.data.filter(
          (app) => app.status.name === 'pendiente' && app.doctor.id === currentUser.id
        );
        setPendingAppointments(pending);
      }
      
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Error', 'Tu sesión ha expirado.');
        signOut();
      } else {
        // No mostramos alerta si solo fallan las métricas (ej. un paciente logueado)
        if (userRole && userRole !== 'paciente') {
            Alert.alert('Error', 'No se pudieron cargar los datos.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Carga los datos cuando la pantalla se enfoca
  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]); // Dependencia clave

  // --- 2. Lógica de Citas ---
  
  // Función para Confirmar (simple)
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await apiClient.patch(
        `/appointments/${appointmentId}/status`, 
        { status_id: 2 } // 2 = confirmada
      );
      Alert.alert('Éxito', 'Cita Confirmada correctamente.');
      loadData(); // Recarga
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la cita.');
    }
  };

  // Función para Cancelar (compleja, con motivo)
  const handleCancelAppointment = async () => {
    if (!cancellationReason) {
      Alert.alert('Error', 'Por favor, escribe un motivo para la cancelación.');
      return;
    }
    
    try {
      await apiClient.patch(
        `/appointments/${selectedAppointmentId}/status`, 
        { 
          status_id: 4, // 4 = cancelada
          cancellation_reason: cancellationReason // ¡Enviamos el motivo!
        }
      );
      
      Alert.alert('Éxito', 'Cita Cancelada correctamente.');
      loadData(); // Recarga
      
    } catch (error) {
      console.error(error.response?.data);
      Alert.alert('Error', 'No se pudo cancelar la cita.');
    } finally {
      // Cerramos el modal
      setModalVisible(false);
      setCancellationReason('');
      setSelectedAppointmentId(null);
    }
  };

  // Función que ABRE el modal
  const openCancelModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setModalVisible(true);
  };
  
  // --- 3. Lógica de Logout ---
  const handleLogout = () => { signOut(); };

  // --- 4. Componente de Cabecera (para el médico) ---
  const DoctorDashboardHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Bienvenido,</Text>
      <Text style={[styles.username, { color: colors.text }]}>{user ? user.full_name : 'Usuario'}</Text>
      <Text style={[styles.roleLabel, { color: colors.primary }]}>Rol: {user ? user.role.name : '...'}</Text>
      
      {/* Métricas */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Métricas</Text>
      {metrics ? (
        <View style={styles.metricsContainer}>
          <View style={[styles.metricBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics.total_patients}</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>Pacientes</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.metricValue, { color: colors.primary }]}>{metrics.upcoming_appointments}</Text>
            <Text style={[styles.metricLabel, { color: colors.text }]}>Citas Próximas</Text>
          </View>
        </View>
      ) : <ActivityIndicator color={colors.primary} />}
      
      {/* Botones de Navegación (CORREGIDOS PARA TABS) */}
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button title="Ver Lista de Pacientes" onPress={() => navigation.navigate('PacientesTab')} />
      </View>
      <View style={[styles.menuButton, { backgroundColor: colors.card, marginTop: 10 }]}>
        <Button title="Mi Perfil y Configuración" onPress={() => navigation.navigate('Mi CuentaTab')} />
      </View>

      {/* Botón de Admin (solo si es admin) */}
      {user && user.role.name === 'admin' && (
        <View style={[styles.menuButton, { backgroundColor: '#e63946', marginTop: 10 }]}>
          {/* Navega al Stack de Cuenta, y luego a la pantalla UserList */}
          <Button 
            title="Gestionar Usuarios (Admin)" 
            onPress={() => navigation.navigate('Mi CuentaTab', { screen: 'UserList' })}
            color="white"
          />
        </View>
      )}
      
      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>
        Citas Pendientes de Confirmación
      </Text>
    </View>
  );

  // --- Menú para Pacientes ---
  const PatientMenu = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background, padding: 20 }]}>
      <Text style={[styles.title, { color: colors.text }]}>Bienvenido,</Text>
      <Text style={[styles.username, { color: colors.text }]}>{user ? user.full_name : 'Usuario'}</Text>
      <Text style={[styles.roleLabel, { color: colors.primary }]}>Rol: {user ? user.role.name : '...'}</Text>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Cuenta</Text>
      
      {/* Botones de Navegación (CORREGIDOS PARA TABS) */}
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button title="Ver Mis Citas" onPress={() => navigation.navigate('Mis CitasTab')} />
      </View>
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button title="Mi Perfil y Configuración" onPress={() => navigation.navigate('Mi CuentaTab')} />
      </View>
      
      <View style={{ marginTop: 40, marginBottom: 40 }}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#e63946" />
      </View>
    </ScrollView>
  );

  // --- 5. Renderizado Principal ---
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  // Si es Paciente, renderiza el Menú de Paciente
  if (!user || user.role.name === 'paciente') {
    return <PatientMenu />;
  }
  
  // Si es Médico o Admin, renderiza el Menú del Doctor (FlatList)
  return (
    <>
      {/* Modal de Cancelación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>Motivo de Cancelación</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, borderWidth: 1 }]}
              placeholder="Ej. Emergencia del médico"
              placeholderTextColor="#999"
              value={cancellationReason}
              onChangeText={setCancellationReason}
            />
            <View style={styles.modalButtonRow}>
              <Button title="Cerrar" onPress={() => setModalVisible(false)} color="#888" />
              <Button title="Confirmar" onPress={handleCancelAppointment} color="#e63946" />
            </View>
          </View>
        </View>
      </Modal>
    
      {/* Lista de Doctor */}
      <FlatList
        style={[styles.container, { backgroundColor: colors.background }]}
        data={pendingAppointments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={DoctorDashboardHeader}
        renderItem={({ item }) => (
          <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.itemTitle, { color: colors.text }]}>Paciente: {item.patient.full_name}</Text>
            <Text style={[styles.itemSubtitle, { color: colors.text }]}>Motivo: {item.reason}</Text>
            <Text style={[styles.itemSubtitle, { color: colors.text }]}>Fecha: {new Date(item.appointment_date).toLocaleString()}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => openCancelModal(item.id)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => handleConfirmAppointment(item.id)}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.itemContainer, { backgroundColor: colors.card, opacity: 0.7 }]}>
            <Text style={{ color: colors.text, textAlign: 'center' }}>
              No hay citas pendientes por confirmar.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ marginTop: 40, marginBottom: 40, paddingHorizontal: 20 }}>
            <Button title="Cerrar Sesión" onPress={handleLogout} color="#e63946" />
          </View>
        }
      />
    </>
  );
};

// --- 6. Estilos (Completos) ---
const styles = StyleSheet.create({
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: {
    flex: 1,
  },
  headerContainer: { // Contenedor para la cabecera del médico
    padding: 20,
  },
  title: {
    fontSize: 24,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  roleLabel: {
    fontSize: 16,
    marginBottom: 25,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricBox: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  menuButton: {
    borderRadius: 8,
    marginBottom: 10,
    padding: 5,
    elevation: 2,
  },
  itemContainer: { // Estilo para la lista de citas pendientes
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 20, // Alineado con el padding del header
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginLeft: 10,
  },
  confirmButton: {
    backgroundColor: '#2a9d8f', // Verde
  },
  cancelButton: {
    backgroundColor: '#e76f51', // Naranja/Rojo
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // --- Estilos del Modal ---
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Fondo oscuro semitransparente
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Espacio entre botones
    width: '100%',
  }
});

export default DashboardScreen;