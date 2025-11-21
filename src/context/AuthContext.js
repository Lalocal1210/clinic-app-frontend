import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; 
import 'core-js/stable/atob'; 
import apiClient from '../api/client'; // <--- 1. IMPORTANTE: Importamos el cliente API

const AuthContext = createContext();

const authReducer = (prevState, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { 
        ...prevState, 
        userToken: action.token, 
        userRole: action.role, 
        theme: action.theme, 
        isLoading: false 
      };
    case 'SIGN_IN':
      return { ...prevState, userToken: action.token, userRole: action.role };
    case 'SIGN_OUT':
      return { ...prevState, userToken: null, userRole: null };
    case 'SET_THEME':
      return { ...prevState, theme: action.theme };
  }
};

const initialState = {
  isLoading: true,
  userToken: null,
  userRole: null, 
  theme: 'dark' 
};

export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      let userRole = null;
      let savedTheme = 'dark'; 

      try {
        userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          const decodedToken = jwtDecode(userToken);
          userRole = decodedToken.role;
        }

        const localTheme = await AsyncStorage.getItem('localTheme');
        if (localTheme) {
          savedTheme = localTheme;
        } else {
           const colorScheme = Appearance.getColorScheme();
           if (colorScheme) savedTheme = colorScheme;
        }

      } catch (e) { console.error('Error bootstrap:', e); }

      dispatch({ 
        type: 'RESTORE_TOKEN', 
        token: userToken, 
        role: userRole,
        theme: savedTheme 
      });
    };

    bootstrapAsync();
  }, []);

  const authContext = useMemo(
    () => ({
      ...authState, 
      signIn: async (token) => {
        try {
          // A. Guardamos token localmente
          await AsyncStorage.setItem('userToken', token);
          const decodedToken = jwtDecode(token);
          const userRole = decodedToken.role;
          
          // B. Actualizamos estado de sesión
          dispatch({ type: 'SIGN_IN', token: token, role: userRole });

          // C. LOGICA DE SINCRONIZACIÓN NUBE (¡LO QUE FALTABA!)
          try {
            // Llamamos al backend para ver qué prefiere este usuario
            // (Como ya guardamos el token en AsyncStorage arriba, el interceptor de apiClient lo usará)
            const response = await apiClient.get('/settings/me');
            
            // Asumimos que la API devuelve { dark_mode: true/false }
            const cloudTheme = response.data.dark_mode ? 'dark' : 'light';
            
            // Si la preferencia de la nube es diferente a la actual, actualizamos
            if (cloudTheme !== authState.theme) {
                await AsyncStorage.setItem('localTheme', cloudTheme);
                dispatch({ type: 'SET_THEME', theme: cloudTheme });
            }
          } catch (settingsError) {
            console.log('No se pudieron sincronizar ajustes de la nube, manteniendo local.');
          }

        } catch (e) { console.error(e); }
      },
      signOut: async () => {
        try {
          await AsyncStorage.removeItem('userToken');
          dispatch({ type: 'SIGN_OUT' });
        } catch (e) { console.error(e); }
      },
      toggleTheme: async () => {
        const newTheme = authState.theme === 'dark' ? 'light' : 'dark';
        try {
            await AsyncStorage.setItem('localTheme', newTheme);
            dispatch({ type: 'SET_THEME', theme: newTheme });
            
            // Opcional: Si el usuario está logueado, podríamos intentar guardar esto en la nube aquí también
            // pero tu vista 'MyAccount' ya maneja eso por su cuenta.
        } catch (e) { console.error(e); }
      },
      setTheme: async (theme) => {
         try {
            await AsyncStorage.setItem('localTheme', theme);
            dispatch({ type: 'SET_THEME', theme: theme });
         } catch(e) { console.error(e); }
      }
    }),
    [authState]
  );

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};