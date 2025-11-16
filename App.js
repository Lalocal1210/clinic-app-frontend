// --- App.js ---

import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { 
  NavigationContainer, 
  DefaultTheme, // Tema por defecto (claro)
  DarkTheme     // Tema oscuro
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; // Para los íconos

// 1. Importa el Proveedor y el Hook de Autenticación
// (Asegúrate de tener src/context/AuthContext.js creado)
import { AuthProvider, useAuth } from './src/context/AuthContext';

// 2. Importa TODAS tus pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import MyAppointmentsScreen from './src/screens/MyAppointmentsScreen';
import MyAccountScreen from './src/screens/MyAccountScreen';
import PatientCreateScreen from './src/screens/PatientCreateScreen';
import AppointmentCreateScreen from './src/screens/AppointmentCreateScreen';
import UserListScreen from './src/screens/UserListScreen'; 
import PatientEditScreen from './src/screens/PatientEditScreen'; 
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import MyScheduleScreen from './src/screens/MyScheduleScreen';
import MyAvailabilityScreen from './src/screens/MyAvailabilityScreen';

// 3. Definimos los Navegadores
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Stack de Autenticación (Login/Registro) ---
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// --- Stack de "Mi Cuenta" (Común) ---
// Contiene la pantalla de perfil y las sub-pantallas (cambiar pass, etc.)
const AccountStack = () => (
   <Stack.Navigator>
    {/* La primera pantalla del stack no muestra cabecera 
        porque la Pestaña (Tab) ya tiene el título */}
    <Stack.Screen 
      name="MyAccount" 
      component={MyAccountScreen} 
      options={{ title: 'Mi Cuenta', headerShown: false }}
    />
    <Stack.Screen 
      name="ChangePassword" 
      component={ChangePasswordScreen} 
      options={{ title: 'Cambiar Contraseña' }}
    />
    <Stack.Screen 
      name="UserList" 
      component={UserListScreen} 
      options={{ title: 'Gestionar Usuarios' }}
    /> 
    <Stack.Screen 
      name="MyAvailability" 
      component={MyAvailabilityScreen} 
      options={{ title: 'Gestionar Horario' }} 
    />
  </Stack.Navigator>
);

// --- Stack de "Mis Citas" (Paciente) ---
// Contiene la lista de citas y el formulario para crear una
const AppointmentStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MyAppointments" 
      component={MyAppointmentsScreen} 
      options={{ title: 'Mis Citas', headerShown: false }}
    /> 
    <Stack.Screen 
      name="AppointmentCreate" 
      component={AppointmentCreateScreen} 
      options={{ title: 'Agendar Cita' }}
    /> 
  </Stack.Navigator>
);

// --- Stack de "Pacientes" (Médico/Admin) ---
// Contiene la lista de pacientes y las sub-pantallas
const PatientStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="PatientList" 
      component={PatientListScreen} 
      options={{ title: 'Pacientes', headerShown: false }}
    /> 
    <Stack.Screen 
      name="PatientDetail" 
      component={PatientDetailScreen} 
      options={{ title: 'Ficha del Paciente' }}
    /> 
    <Stack.Screen 
      name="PatientCreate" 
      component={PatientCreateScreen} 
      options={{ title: 'Nuevo Paciente' }}
    /> 
    <Stack.Screen 
      name="PatientEdit" 
      component={PatientEditScreen} 
      options={{ title: 'Editar Paciente' }}
    /> 
  </Stack.Navigator>
);

// --- Pestañas para PACIENTES ---
const PatientTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      // Dejamos que el Stack de CADA PESTAÑA maneje su propia cabecera
      headerShown: false, 
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'InicioTab') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'Mis CitasTab') iconName = focused ? 'calendar' : 'calendar-outline';
        else if (route.name === 'Mi CuentaTab') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen 
      name="InicioTab" 
      component={DashboardScreen} 
      options={{ title: 'Mi Clínica', headerShown: true }} // El Dashboard es simple, puede mostrar su header
    />
    <Tab.Screen 
      name="Mis CitasTab" 
      component={AppointmentStack} // Usa el Stack de Citas
      options={{ title: 'Mis Citas' }}
    />
    <Tab.Screen 
      name="Mi CuentaTab" 
      component={AccountStack} // Usa el Stack de Cuenta
      options={{ title: 'Mi Cuenta' }} 
    />
  </Tab.Navigator>
);

// --- Pestañas para MÉDICOS y ADMINS ---
const DoctorTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false, // Dejamos que el Stack de CADA PESTAÑA maneje su propia cabecera
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'InicioTab') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === 'PacientesTab') iconName = focused ? 'people' : 'people-outline';
        else if (route.name === 'AgendaTab') iconName = focused ? 'calendar' : 'calendar-outline';
        else if (route.name === 'Mi CuentaTab') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen 
      name="InicioTab" 
      component={DashboardScreen} 
      options={{ title: 'Panel Médico', headerShown: true }} // El Dashboard es simple
    />
    <Tab.Screen 
      name="PacientesTab" 
      component={PatientStack} // Usa el Stack de Pacientes
      options={{ title: 'Pacientes' }} 
    />
    <Tab.Screen 
      name="AgendaTab" 
      component={MyScheduleScreen} 
      options={{ title: 'Agenda', headerShown: true }} // Esta pantalla es simple
    />
    <Tab.Screen 
      name="Mi CuentaTab" 
      component={AccountStack} // Usa el Stack de Cuenta
      options={{ title: 'Mi Cuenta' }} 
    />
  </Tab.Navigator>
);

// --- Componente de Navegación (Cerebro) ---
// Esta arquitectura SOLUCIONA el error 'A navigator can only contain Screen...'
const RootNavigator = () => {
  const { isLoading, userToken, theme, userRole } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      {userToken == null ? (
        <AuthStack /> // No hay token -> Login
      ) : (
        // Si hay token, decide qué Pestañas mostrar
        userRole === 'paciente' ? <PatientTabs /> : <DoctorTabs />
      )}
    </NavigationContainer>
  );
}

// --- Componente Principal ---
export default function App() {
  return (
    // Envuelve toda la app en el AuthProvider
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});