// --- src/screens/MyAccountScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Switch, TextInput, Button 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; // Importación correcta
import { useIsFocused, useTheme } from '@react-navigation/native';

const MyAccountScreen = () => {
  const [user, setUser] = useState(null);
  const [patientData, setPatientData] = useState(null); // Datos detallados del paciente
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para edición de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');

  const { signOut, setTheme } = useAuth(); // Obtenemos setTheme para cambiar el color global
  const isFocused = useIsFocused();
  const { colors } = useTheme(); // Obtenemos los colores actuales

  // 1. Carga los datos
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carga usuario y ajustes en paralelo
      const [userResponse, settingsResponse] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/settings/me')
      ]);
      setUser(userResponse.data);
      setSettings(settingsResponse.data);

      // Sincroniza el tema de la app con lo que viene de la BBDD
      // (Esto es útil si inicias sesión en otro dispositivo)
      const themeMode = settingsResponse.data.dark_mode ? 'dark' : 'light';
      setTheme(themeMode);

      // Si tiene perfil de paciente, carga los detalles extra
      if (userResponse.data.patient_profile) {
        const patientResponse = await apiClient.get(`/patients/${userResponse.data.patient_profile.id}`);
        setPatientData(patientResponse.data);
        
        // Pre-llenar formulario de edición
        setEditPhone(patientResponse.data.phone || '');
        setEditGender(patientResponse.data.gender || '');
        setEditBirthDate(patientResponse.data.birth_date || '');
      }

    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) signOut();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]); // Dependencia segura

  // 2. Lógica para Guardar Perfil (PUT /patients/{id})
  const handleSaveProfile = async () => {
    try {
      await apiClient.put(`/patients/${patientData.id}`, {
        phone: editPhone,
        gender: editGender,
        birth_date: editBirthDate || null
      });
      Alert.alert('Éxito', 'Perfil actualizado.');
      setIsEditing(false);
      loadData(); // Recargar datos para asegurar consistencia
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    }
  };

  // 3. Lógica para Modo Oscuro (PUT /settings/me + Contexto)
  const handleToggleDarkMode = async (newValue) => {
    // 1. Actualiza la UI inmediatamente (Feedback rápido)
    const newTheme = newValue ? 'dark' : 'light';
    setTheme(newTheme); // Cambia los colores de toda la app
    setSettings(prev => ({ ...prev, dark_mode: newValue })); // Actualiza el switch
    
    try {
      // 2. Guarda en el Backend en segundo plano
      await apiClient.put('/settings/me', { dark_mode: newValue });
    } catch (error) {
      console.error('Error al guardar modo oscuro:', error);
      Alert.alert('Error', 'No se pudo guardar tu preferencia.');
      
      // Si falla, revertimos los cambios
      setTheme(newValue ? 'light' : 'dark');
      setSettings(prev => ({ ...prev, dark_mode: !newValue }));
    }
  };

  if (isLoading || !user || !settings) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Sección de Datos Personales */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15}}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Mis Datos</Text>
            
            {/* Botón Editar/Guardar (Solo visible si tienes perfil de paciente) */}
            {patientData && (
                <Button 
                    title={isEditing ? "Guardar" : "Editar"} 
                    onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)} 
                    color={colors.primary}
                />
            )}
        </View>

        {/* Datos de Usuario (Solo lectura) */}
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Nombre:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user.full_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Email:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.text }]}>Rol:</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user.role.name}</Text>
        </View>

        {/* Campos Editables del Paciente */}
        {patientData && (
            <>
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Teléfono:</Text>
                {isEditing ? (
                    <TextInput 
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                        value={editPhone} 
                        onChangeText={setEditPhone} 
                        placeholder="Ej. 5512345678"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                    />
                ) : (
                    <Text style={[styles.infoValue, { color: colors.text, marginBottom: 10 }]}>{patientData.phone || 'No registrado'}</Text>
                )}

                <Text style={[styles.inputLabel, { color: colors.text }]}>Género:</Text>
                {isEditing ? (
                    <TextInput 
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                        value={editGender} 
                        onChangeText={setEditGender} 
                        placeholder="male / female"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />
                ) : (
                    <Text style={[styles.infoValue, { color: colors.text, marginBottom: 10 }]}>{patientData.gender || 'No registrado'}</Text>
                )}

                <Text style={[styles.inputLabel, { color: colors.text }]}>Fecha Nacimiento:</Text>
                {isEditing ? (
                    <TextInput 
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                        value={editBirthDate} 
                        onChangeText={setEditBirthDate} 
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#999"
                    />
                ) : (
                    <Text style={[styles.infoValue, { color: colors.text, marginBottom: 10 }]}>{patientData.birth_date || 'No registrado'}</Text>
                )}
            </>
        )}
      </View>
      
      {/* Sección de Ajustes */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajustes</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoValue, { color: colors.text }]}>Modo Oscuro</Text>
          <Switch
            value={settings.dark_mode}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={settings.dark_mode ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoValue, { color: colors.text }]}>Idioma</Text>
          <Text style={[styles.infoValue, { color: colors.text, opacity: 0.7 }]}>{settings.language}</Text>
        </View>
      </View>

    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingTop: 10 },
  section: { marginHorizontal: 15, marginBottom: 15, padding: 20, borderRadius: 10, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 16, opacity: 0.7 },
  infoValue: { fontSize: 16, fontWeight: '500' },
  inputLabel: { fontSize: 14, marginTop: 5, opacity: 0.7 },
  input: { borderWidth: 1, borderRadius: 5, padding: 8, marginTop: 5, marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  separator: { height: 1, marginVertical: 10 }
});

export default MyAccountScreen;