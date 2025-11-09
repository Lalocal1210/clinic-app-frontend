// --- src/screens/DashboardScreen.js (Actualizado) ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  Button, Alert, ScrollView 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../../App';
import { useNavigation, useTheme } from '@react-navigation/native'; // Importa useTheme

const DashboardScreen = () => {
  const [metrics, setMetrics] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { colors } = useTheme(); // ¡Obtiene los colores del tema!

  useEffect(() => {
    // ... (La lógica de loadData es idéntica) ...
    const loadData = async () => {
      setIsLoading(true);
      try {
        const userResponse = await apiClient.get('/users/me');
        const currentUser = userResponse.data;
        setUser(currentUser);
        if (currentUser.role.name === 'medico' || currentUser.role.name === 'admin') {
          const metricsResponse = await apiClient.get('/dashboard/');
          setMetrics(metricsResponse.data);
        }
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          Alert.alert('Error', 'Tu sesión ha expirado o no tienes permisos.');
          signOut();
        } else {
          Alert.alert('Error', 'No se pudieron cargar los datos.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [signOut]);

  const handleLogout = () => {
    signOut(); 
  };

  // --- Componente de Menú del Médico (¡ACTUALIZADO!) ---
  const DoctorMenu = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Métricas del Día</Text>
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
      ) : (
        <Text style={{ color: colors.text }}>Cargando métricas...</Text>
      )}
      
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button 
          title="Ver Lista de Pacientes" 
          onPress={() => navigation.navigate('PatientList')} 
        />
      </View>

      {/* --- ¡BOTÓN AÑADIDO! --- */}
      <View style={[styles.menuButton, { backgroundColor: colors.card, marginTop: 10 }]}>
        <Button 
          title="Mi Perfil y Configuración" 
          onPress={() => navigation.navigate('MyAccount')}
        />
      </View>
    </View>
  );

  const PatientMenu = () => (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Cuenta</Text>
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button 
          title="Ver Mis Citas" 
          onPress={() => navigation.navigate('MyAppointments')} 
        />
      </View>
      <View style={[styles.menuButton, { backgroundColor: colors.card }]}>
        <Button 
          title="Mi Perfil y Configuración" 
          onPress={() => navigation.navigate('MyAccount')}
        />
      </View>
    </View>
  );

  // --- Renderizado Principal (sin cambios) ---
  if (isLoading) { /* ... */ }
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Bienvenido,</Text>
      <Text style={[styles.username, { color: colors.text }]}>{user ? user.full_name : 'Usuario'}</Text>
      <Text style={[styles.roleLabel, { color: colors.primary }]}>Rol: {user ? user.role.name : '...'}</Text>
      
      {user && (user.role.name === 'medico' || user.role.name === 'admin') ? (
        <DoctorMenu />
      ) : (
        <PatientMenu />
      )}
      
      <View style={{ marginTop: 40, marginBottom: 20 }}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#e63946" />
      </View>
    </ScrollView>
  );
};

// --- Estilos (Simplificado, sin cambios) ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24 },
  username: { fontSize: 28, fontWeight: 'bold' },
  roleLabel: { fontSize: 16, marginBottom: 25, fontStyle: 'italic' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  metricsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  metricBox: { paddingVertical: 20, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 5, elevation: 3 },
  metricValue: { fontSize: 32, fontWeight: 'bold' },
  metricLabel: { fontSize: 14, textAlign: 'center', marginTop: 5 },
  menuButton: { borderRadius: 8, marginBottom: 10, padding: 5, elevation: 2 }
});

export default DashboardScreen;