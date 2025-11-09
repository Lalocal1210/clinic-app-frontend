// --- App.js ---

import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  NavigationContainer, 
  DefaultTheme, // Tema por defecto (claro)
  DarkTheme     // Tema oscuro
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// --- 1. Importa todas tus pantallas ---
// (Asegúrate de que todos estos archivos existan en src/screens/)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PatientListScreen from './src/screens/PatientListScreen';
import PatientDetailScreen from './src/screens/PatientDetailScreen';
import MyAppointmentsScreen from './src/screens/MyAppointmentsScreen';
import MyAccountScreen from './src/screens/MyAccountScreen';
import PatientCreateScreen from './src/screens/PatientCreateScreen'; // La pantalla de formulario

// --- 2. Contexto de Autenticación (ahora también maneja el tema) ---
const AuthContext = createContext();

// --- 3. Stacks de Navegación ---
const Stack = createStackNavigator();

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
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ title: 'Mi Clínica' }}
    />
    {/* Pantallas de Médico */}
    <Stack.Screen 
      name="PatientList" 
      component={PatientListScreen} 
      options={{ title: 'Pacientes' }}
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
    {/* Pantallas de Paciente */}
    <Stack.Screen 
      name="MyAppointments" 
      component={MyAppointmentsScreen} 
      options={{ title: 'Mis Citas' }}
    /> 
    <Stack.Screen 
      name="MyAccount" 
      component={MyAccountScreen}     
      options={{ title: 'Mi Cuenta' }}
    /> 
  </Stack.Navigator>
);

// --- 4. Componente Principal App ---
export default function App() {
  
  // Reducer para manejar el estado global (token y tema)
  const [authState, dispatch] = useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return { ...prevState, userToken: action.token, isLoading: false };
        case 'SIGN_IN':
          return { ...prevState, userToken: action.token };
        case 'SIGN_OUT':
          return { ...prevState, userToken: null };
        case 'SET_THEME': // Nueva acción para el tema
          return { ...prevState, theme: action.theme };
      }
    },
    { 
      isLoading: true, 
      userToken: null,
      theme: Appearance.getColorScheme() || 'light' // Tema inicial basado en el teléfono
    }
  );

  // Efecto para revisar el token al iniciar la app
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      try {
        userToken = await AsyncStorage.getItem('userToken');
      } catch (e) { console.error('Error al restaurar el token:', e); }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };
    bootstrapAsync();
  }, []);

  // Funciones que se compartirán a través del contexto
  const authContext = useMemo(
    () => ({
      signIn: async (token) => {
        try {
          await AsyncStorage.setItem('userToken', token);
          dispatch({ type: 'SIGN_IN', token: token });
        } catch (e) { console.error('Error al guardar el token:', e); }
      },
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('userToken');
          dispatch({ type: 'SIGN_OUT' });
        } catch (e) { console.error('Error al eliminar el token:', e); }
      },
      // Funciones del Tema
      theme: authState.theme,
      setTheme: (theme) => {
        dispatch({ type: 'SET_THEME', theme: theme });
      }
    }),
    [authState.theme] // El contexto se actualiza si el tema cambia
  );

  // Si está cargando, muestra un indicador
  if (authState.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Renderiza el navegador apropiado (con el tema correcto)
  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer theme={authState.theme === 'dark' ? DarkTheme : DefaultTheme}>
        {authState.userToken == null ? (
          <AuthStack /> // No hay token, muestra Login
        ) : (
          <AppStack /> // Hay token, muestra la App
        )}
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

// --- 5. Hook Personalizado useAuth ---
// Para que las pantallas accedan a `signIn`, `signOut`, `theme` y `setTheme`
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// --- 6. Estilos ---
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