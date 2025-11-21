import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  Button, Alert, ScrollView, FlatList,
  TouchableOpacity, Modal, TextInput, RefreshControl 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useNavigation, useTheme, useIsFocused } from '@react-navigation/native';

const DashboardScreen = () => {
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); 
  
  const [modalVisible, setModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  
  const navigation = useNavigation();
  const { signOut, userRole } = useAuth(); // signOut sigue disponible si lo necesitas, pero no lo usamos en UI
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  // --- 1. Carga de Datos Unificada ---
  const loadData = useCallback(async () => {
    if (!refreshing) setIsLoading(true);
    
    try {
      // a. Obtener datos del usuario actual
      const userResponse = await apiClient.get('/users/me');
      const currentUser = userResponse.data;
      setUser(currentUser);

      // b. Lógica según Rol
      if (currentUser.role.name === 'medico' || currentUser.role.name === 'admin') {
        
        const [metricsResponse, allAppointmentsResponse] = await Promise.all([
          apiClient.get('/dashboard/'),
          apiClient.get('/appointments/all')
        ]);
        
        setMetrics(metricsResponse.data);
        
        // Filtramos citas pendientes asignadas a este médico
        const pending = allAppointmentsResponse.data.filter(
          (app) => app.status.name === 'pendiente' && app.doctor.id === currentUser.id
        );
        setPendingAppointments(pending);

      } else if (currentUser.role.name === 'paciente') {
        
        const apptsResponse = await apiClient.get('/appointments/me');
        const now = new Date();
        
        // Busca la próxima cita confirmada futura
        const nextAppt = apptsResponse.data
          .filter(app => app.status.name === 'confirmada' && new Date(app.appointment_date) > now)
          .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
        
        if (nextAppt.length > 0) {
          setNextAppointment(nextAppt[0]);
        } else {
          setNextAppointment(null);
        }
      }
      
    } catch (error) {
      console.error("Dashboard Error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        signOut(); 
      } 
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, signOut]);
  
  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --- 2. Acciones de Citas (Confirmar/Cancelar) ---
  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await apiClient.patch(
        `/appointments/${appointmentId}/status`, 
        { status_id: 2 } 
      );
      Alert.alert('¡Listo!', 'Cita confirmada.');
      onRefresh(); 
    } catch (error) {
      Alert.alert('Error', 'No se pudo confirmar la cita.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellationReason) {
      Alert.alert('Requerido', 'Debes escribir un motivo para cancelar.');
      return;
    }
    try {
      await apiClient.patch(
        `/appointments/${selectedAppointmentId}/status`, 
        { 
          status_id: 4, 
          cancellation_reason: cancellationReason 
        }
      );
      Alert.alert('Cancelada', 'La cita ha sido cancelada correctamente.');
      onRefresh(); 
    } catch (error) {
      Alert.alert('Error', 'No se pudo cancelar la cita.');
    } finally {
      setModalVisible(false);
      setCancellationReason('');
      setSelectedAppointmentId(null);
    }
  };

  const openCancelModal = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setModalVisible(true);
  };
  
  // (Función handleLogout eliminada porque el botón se movió a Mi Cuenta)

  // --- 3. Renderizado de Componentes ---

  const DoctorDashboardHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.greeting, { color: colors.text }]}>Hola, Dr. {user ? user.full_name.split(' ')[0] : ''}</Text>
      <Text style={[styles.dateLabel, { color: colors.text }]}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>
            {metrics ? metrics.upcoming_appointments : '-'}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.text }]}>Próximas</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.metricNumber, { color: colors.primary }]}>
            {metrics ? metrics.total_patients : '-'}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.text }]}>Pacientes</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.metricNumber, { color: '#2a9d8f' }]}>
             {metrics ? metrics.completed_appointments_today : '-'}
          </Text>
          <Text style={[styles.metricLabel, { color: colors.text }]}>Hoy</Text>
        </View>
      </View>
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('PacientesTab')}
        >
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>👥 Pacientes</Text>
        </TouchableOpacity>
        
        {user?.role?.name === 'admin' && (
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#ffebee' }]}
            onPress={() => navigation.navigate('Mi CuentaTab', { screen: 'UserList' })}
          >
            <Text style={{color: '#e63946', fontWeight: 'bold'}}>🛡️ Admin</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.sectionHeader, { color: colors.text }]}>
        Solicitudes Pendientes
      </Text>
    </View>
  );

  const PatientMenu = () => (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ padding: 20 }}>
        <Text style={[styles.greeting, { color: colors.text }]}>Hola, {user ? user.full_name.split(' ')[0] : ''}</Text>
        <Text style={[styles.subGreeting, { color: colors.text }]}>Bienvenido a tu salud digital</Text>

        <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 20 }]}>Tu Próxima Cita</Text>
        <View style={[styles.nextAppointmentCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          {nextAppointment ? (
            <>
              <Text style={[styles.nextApptDate, { color: colors.primary }]}>
                {new Date(nextAppointment.appointment_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Text style={[styles.nextApptTime, { color: colors.text }]}>
                {new Date(nextAppointment.appointment_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={{ color: colors.text, marginTop: 5, fontSize: 16 }}>
                Dr. {nextAppointment.doctor.full_name}
              </Text>
              <Text style={{ color: colors.text, opacity: 0.7, fontStyle: 'italic' }}>
                "{nextAppointment.reason}"
              </Text>
            </>
          ) : (
            <View style={{ alignItems: 'center', padding: 10 }}>
              <Text style={{ color: colors.text, opacity: 0.6, marginBottom: 10 }}>No tienes citas confirmadas pronto.</Text>
              <Button title="Agendar Ahora" onPress={() => navigation.navigate('Mis CitasTab', { screen: 'AppointmentCreate' })} />
            </View>
          )}
        </View>

        <Text style={[styles.sectionHeader, { color: colors.text, marginTop: 25 }]}>¿Qué deseas hacer?</Text>
        
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Mis CitasTab')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>📅 Ver mis Citas</Text>
          <Text style={{ color: colors.text, opacity: 0.5 }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Mis CitasTab', { screen: 'AppointmentCreate' })}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>➕ Agendar Nueva Cita</Text>
          <Text style={{ color: colors.text, opacity: 0.5 }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('Mi CuentaTab')}
        >
          <Text style={[styles.menuItemText, { color: colors.text }]}>⚙️ Mi Perfil y Cuenta</Text>
          <Text style={{ color: colors.text, opacity: 0.5 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Botón de Cerrar Sesión ELIMINADO (está en Mi Cuenta) */}
        <View style={{ height: 30 }} /> 
      </View>
    </ScrollView>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || user.role.name === 'paciente') {
    return <PatientMenu />;
  }
  
  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>
          <View style={[styles.modalView, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalText, { color: colors.text }]}>Cancelar Cita</Text>
            <Text style={{ color: colors.text, marginBottom: 10, opacity: 0.7 }}>Indica el motivo para el paciente:</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ej. Emergencia médica..."
              placeholderTextColor="#999"
              value={cancellationReason}
              onChangeText={setCancellationReason}
            />
            <View style={styles.modalButtonRow}>
              <Button title="Volver" onPress={() => setModalVisible(false)} color="#888" />
              <Button title="Confirmar Cancelación" onPress={handleCancelAppointment} color="#e63946" />
            </View>
          </View>
        </View>
      </Modal>
    
      <FlatList
        style={[styles.container, { backgroundColor: colors.background }]}
        data={pendingAppointments}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={DoctorDashboardHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.apptItem, { backgroundColor: colors.card }]}>
            <View style={{flex: 1}}>
              <Text style={[styles.apptPatient, { color: colors.text }]}>{item.patient.full_name}</Text>
              <Text style={[styles.apptReason, { color: colors.text }]}>{item.reason}</Text>
              <Text style={[styles.apptDate, { color: colors.primary }]}>
                {new Date(item.appointment_date).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.apptActions}>
               <TouchableOpacity onPress={() => handleConfirmAppointment(item.id)} style={[styles.iconBtn, { backgroundColor: '#e0f2f1' }]}>
                 <Text style={{fontSize: 20}}>✅</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => openCancelModal(item.id)} style={[styles.iconBtn, { backgroundColor: '#ffebee', marginTop: 10 }]}>
                 <Text style={{fontSize: 20}}>❌</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.text, opacity: 0.5 }}>No tienes solicitudes pendientes.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 50 }} />} 
      />
    </>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  
  headerContainer: { padding: 20, paddingBottom: 10 },
  greeting: { fontSize: 26, fontWeight: 'bold' },
  dateLabel: { fontSize: 16, opacity: 0.6, marginBottom: 20, textTransform: 'capitalize' },
  
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 12, marginHorizontal: 4, elevation: 2 },
  metricNumber: { fontSize: 24, fontWeight: 'bold' },
  metricLabel: { fontSize: 12, opacity: 0.8 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  subGreeting: { fontSize: 16, opacity: 0.7, marginBottom: 10 },
  nextAppointmentCard: { padding: 20, borderRadius: 12, borderLeftWidth: 5, elevation: 3, marginBottom: 10 },
  nextApptDate: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
  nextApptTime: { fontSize: 22, fontWeight: '300', marginVertical: 5 },
  
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderRadius: 12, marginBottom: 10, elevation: 1 },
  menuItemText: { fontSize: 16, fontWeight: '500' },

  apptItem: { flexDirection: 'row', padding: 15, marginHorizontal: 20, marginBottom: 10, borderRadius: 10, elevation: 2 },
  apptPatient: { fontSize: 16, fontWeight: 'bold' },
  apptReason: { fontSize: 14, opacity: 0.8, marginVertical: 2 },
  apptDate: { fontSize: 14, fontWeight: '600' },
  apptActions: { justifyContent: 'center', paddingLeft: 10 },
  iconBtn: { padding: 8, borderRadius: 20 },

  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: '85%', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 5 },
  modalText: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalInput: { width: '100%', borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' }
});

export default DashboardScreen;