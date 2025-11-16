import React, { createContext, useContext, useMemo, useReducer, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode'; 
import 'core-js/stable/atob'; 

const AuthContext = createContext();

const authReducer = (prevState, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...prevState, userToken: action.token, userRole: action.role, isLoading: false };
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
  theme: Appearance.getColorScheme() || 'light'
};

export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      let userRole = null;
      try {
        userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          const decodedToken = jwtDecode(userToken);
          userRole = decodedToken.role;
        }
      } catch (e) { console.error('Error al restaurar token:', e); }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken, role: userRole });
    };
    bootstrapAsync();
  }, []);

  const authContext = useMemo(
    () => ({
      ...authState, 
      signIn: async (token) => {
        try {
          await AsyncStorage.setItem('userToken', token);
          const decodedToken = jwtDecode(token);
          const userRole = decodedToken.role;
          dispatch({ type: 'SIGN_IN', token: token, role: userRole });
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

// 4. Exportamos el Hook "useAuth"
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};