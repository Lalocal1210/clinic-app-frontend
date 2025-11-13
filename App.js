// --- App.js ---

import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { 
  NavigationContainer, 
  DefaultTheme, // Tema por defecto (claro)
  DarkTheme     // Tema oscuro
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// 1. Importa el NUEVO Proveedor y el Hook
// (Asegúrate de haber creado 'src/context/AuthContext.js')
import { AuthProvider, useAuth } from './src/context/AuthContext';

// 2. Importa todas tus pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import MyAppointmentsScreen from './src/screens/MyAppointmentsScreen';
import MyAccountScreen from './src/screens/MyAccountScreen';
import PatientCreateScreen from './src/screens/PatientCreateScreen';
import AppointmentCreateScreen from './src/screens/AppointmentCreateScreen';
import UserListScreen from './src/screens/UserListScreen'; // Pantalla de Admin

const Stack = createStackNavigator();

// 3. Stacks de Navegación

// Stack para usuarios NO autenticados
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Stack para usuarios AUTENTICADOS
const AppStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Mi Clínica' }}/>
    
    {/* Pantallas de Médico */}
    <Stack.Screen name="PatientList" component={PatientListScreen} options={{ title: 'Pacientes' }}/> 
    <Stack.Screen name="PatientDetail" component={PatientDetailScreen} options={{ title: 'Ficha del Paciente' }}/> 
    <Stack.Screen name="PatientCreate" component={PatientCreateScreen} options={{ title: 'Nuevo Paciente' }}/> 

    {/* Pantallas de Paciente */}
    <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} options={{ title: 'Mis Citas' }}/> 
    <Stack.Screen name="MyAccount" component={MyAccountScreen} options={{ title: 'Mi Cuenta' }}/>
    <Stack.Screen name="AppointmentCreate" component={AppointmentCreateScreen} options={{ title: 'Agendar Cita' }}/> 

    {/* Pantalla de Admin */}
    <Stack.Screen name="UserList" component={UserListScreen} options={{ title: 'Gestionar Usuarios' }}/> 
  </Stack.Navigator>
);

// 4. Componente de Navegación (el "cerebro" que decide)
const RootNavigator = () => {
  // 5. Usa el hook que viene del AuthContext
  const { isLoading, userToken, theme } = useAuth();

  // Muestra la pantalla de carga mientras se restaura el token
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Renderiza el navegador (con el tema correcto)
  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {userToken == null ? (
        <AuthStack /> // No hay token, muestra Login
      ) : (
        <AppStack /> // Hay token, muestra la App
      )}
    </NavigationContainer>
  );
}

// 5. Componente Principal App
// (Ahora solo es un "envoltorio" (wrapper)
export default function App() {
  return (
    // Envuelve toda la app en el AuthProvider
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// (¡IMPORTANTE! El hook 'useAuth' ya NO se exporta desde aquí)

// --- Estilos ---
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});