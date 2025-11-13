// --- src/context/AuthContext.js ---

import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Creamos el Contexto
const AuthContext = createContext();

// 2. Definimos el reducer y el estado inicial
const authReducer = (prevState, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...prevState, userToken: action.token, isLoading: false };
    case 'SIGN_IN':
      return { ...prevState, userToken: action.token };
    case 'SIGN_OUT':
      return { ...prevState, userToken: null };
    case 'SET_THEME':
      return { ...prevState, theme: action.theme };
  }
};

const initialState = {
  isLoading: true,
  userToken: null,
  theme: Appearance.getColorScheme() || 'light'
};

// 3. Creamos el "Proveedor" (Provider)
// Este es el componente que envolverá tu app
export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Revisa el token al iniciar
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

  // Funciones que se compartirán (signIn, signOut, setTheme)
  const authContext = useMemo(
    () => ({
      ...authState, // Pasa el estado (isLoading, userToken, theme)
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
      setTheme: (theme) => {
        dispatch({ type: 'SET_THEME', theme: theme });
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

// 4. Creamos el Hook "useAuth"
// Las pantallas usarán esto para acceder al contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};