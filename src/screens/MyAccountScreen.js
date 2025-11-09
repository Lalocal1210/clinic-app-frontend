// --- src/screens/MyAccountScreen.js (Actualizado) ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Switch 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../../App'; // ¡Importa nuestro hook actualizado!
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native'; // Hook de React Navigation

const MyAccountScreen = () => {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 1. Obtenemos el tema y la función para cambiarlo desde nuestro Contexto
  const { signOut, theme, setTheme } = useAuth();
  const isFocused = useIsFocused();
  
  // 2. Obtenemos los colores del tema (oscuro o claro)
  const { colors } = useTheme(); 

  // Carga los datos (igual que antes)
  useEffect(() => {
    if (!isFocused) return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [userResponse, settingsResponse] = await Promise.all([
          apiClient.get('/users/me'),
          apiClient.get('/settings/me')
        ]);
        setUser(userResponse.data);
        setSettings(settingsResponse.data);
        
        // 3. ¡Importante! Sincroniza el tema de la app con el de la BBDD
        setTheme(settingsResponse.data.dark_mode ? 'dark' : 'light');
        
      } catch (error) {
        // ... (manejo de errores idéntico) ...
        console.error(error);
        if (error.response?.status === 401) { signOut(); }
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isFocused, signOut, setTheme]); // Añadimos 'setTheme' a las dependencias

  // 4. Función para actualizar el modo oscuro (¡ACTUALIZADA!)
  const handleToggleDarkMode = async (newValue) => {
    // Actualiza el estado local Y el tema global de la app
    const newTheme = newValue ? 'dark' : 'light';
    setTheme(newTheme); // Cambia el tema de toda la app
    setSettings(prev => ({ ...prev, dark_mode: newValue }));
    
    try {
      // Llama a la API en segundo plano para guardar el cambio
      await apiClient.put('/settings/me', { dark_mode: newValue });
    } catch (error) {
      console.error('Error al guardar modo oscuro:', error);
      Alert.alert('Error', 'No se pudo guardar tu preferencia.');
      // Revierte el cambio si la API falla
      setTheme(newValue ? 'light' : 'dark');
      setSettings(prev => ({ ...prev, dark_mode: !newValue }));
    }
  };

  if (isLoading || !user || !settings) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 5. ¡Estilos dinámicos!
  // Usamos los 'colors' del tema para el fondo y el texto
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sección de Perfil */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Perfil</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Nombre:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user.full_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
        </View>
      </View>
      
      {/* Sección de Ajustes */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajustes de la App</Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.infoValue, { color: colors.text }]}>Modo Oscuro</Text>
          <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={settings.dark_mode ? "#f5dd4b" : "#f4f3f4"}
            onValueChange={handleToggleDarkMode}
            value={settings.dark_mode}
          />
        </View>
        {/* ... (otros switches) ... */}
      </View>
    </ScrollView>
  );
};

// --- Estilos ---
// (Los estilos base siguen siendo los mismos)
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  section: {
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  }
});

export default MyAccountScreen;