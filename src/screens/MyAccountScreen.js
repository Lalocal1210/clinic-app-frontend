// --- src/screens/MyAccountScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Switch, TextInput, Button 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useIsFocused, useTheme, useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; 

const MyAccountScreen = () => {
  const [user, setUser] = useState(null);
  const [patientData, setPatientData] = useState(null); 
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- Estados para el formulario de edición ---
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editAllergies, setEditAllergies] = useState('');
  const [editMedications, setEditMedications] = useState('');
  const [editConditions, setEditConditions] = useState('');
  const [editBloodType, setEditBloodType] = useState('No sé');
  const [editHeight, setEditHeight] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editMaritalStatus, setEditMaritalStatus] = useState('Soltero(a)');
  
  const { signOut, theme, setTheme, userRole } = useAuth(); // Obtenemos el rol
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const navigation = useNavigation(); // Para navegar

  // 1. Carga los datos (Perfil y Ajustes)
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [userResponse, settingsResponse] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/settings/me')
      ]);
      setUser(userResponse.data);
      setSettings(settingsResponse.data);
      setTheme(settingsResponse.data.dark_mode ? 'dark' : 'light');

      if (userResponse.data.patient_profile) {
        // Usamos el endpoint de paciente para obtener TODOS los datos
        const patientResponse = await apiClient.get(`/patients/${userResponse.data.patient_profile.id}`);
        const patient = patientResponse.data;
        setPatientData(patient);
        
        // Pre-llenar formulario
        setEditPhone(patient.phone || '');
        setEditAllergies(patient.allergies || '');
        setEditMedications(patient.current_medications || '');
        setEditConditions(patient.chronic_conditions || '');
        setEditBloodType(patient.blood_type || 'No sé');
        setEditHeight(patient.height_cm ? String(patient.height_cm) : '');
        setEditEmergencyName(patient.emergency_contact_name || '');
        setEditEmergencyPhone(patient.emergency_contact_phone || '');
        setEditMaritalStatus(patient.marital_status || 'Soltero(a)');
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
  }, [isFocused]);

  // 2. Lógica para Guardar Perfil (PUT /patients/{id})
  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Prepara solo los datos que el paciente puede editar
      const updatedData = {
        phone: editPhone,
        allergies: editAllergies,
        current_medications: editMedications,
        chronic_conditions: editConditions,
        blood_type: editBloodType,
        height_cm: parseInt(editHeight) || null,
        emergency_contact_name: editEmergencyName,
        emergency_contact_phone: editEmergencyPhone,
        marital_status: editMaritalStatus
      };
      
      await apiClient.put(`/patients/${patientData.id}`, updatedData);
      
      Alert.alert('Éxito', 'Perfil actualizado.');
      setIsEditing(false);
      loadData(); // Recargar datos
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
      setIsLoading(false);
    }
  };

  // 3. Lógica para Modo Oscuro
  const handleToggleDarkMode = async (newValue) => {
    const newTheme = newValue ? 'dark' : 'light';
    setTheme(newTheme); 
    setSettings(prev => ({ ...prev, dark_mode: newValue }));
    try {
      await apiClient.put('/settings/me', { dark_mode: newValue });
    } catch (error) {
      // Revertir si falla
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
  
  // Componente auxiliar
  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.text, opacity: 0.7 }]}>{label}:</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'No registrado'}</Text>
    </View>
  );

  return (
    // Usamos ScrollView, ya que el KeyboardAvoidingView se movió a la pantalla de contraseña
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* --- Sección de Datos Personales --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mi Perfil</Text>
            {/* Solo los pacientes pueden editar su *propio* perfil desde aquí */}
            {userRole === 'paciente' && patientData && (
                <Button 
                    title={isEditing ? "Guardar" : "Editar"} 
                    onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)} 
                    color={colors.primary}
                />
            )}
        </View>

        {/* --- Modo Lectura (isEditing == false) --- */}
        {!isEditing && (
            <>
                <InfoRow label="Nombre" value={user.full_name} />
                <InfoRow label="Email" value={user.email} />
                {patientData && (
                    <>
                        <InfoRow label="Teléfono" value={patientData.phone} />
                        <InfoRow label="Género" value={patientData.gender} />
                        <InfoRow label="Nacimiento" value={patientData.birth_date} />
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <InfoRow label="Alergias" value={patientData.allergies} />
                        <InfoRow label="Medicamentos" value={patientData.current_medications} />
                        <InfoRow label="Padecimientos" value={patientData.chronic_conditions} />
                        <InfoRow label="Tipo Sangre" value={patientData.blood_type} />
                        <InfoRow label="Altura" value={patientData.height_cm ? `${patientData.height_cm} cm` : 'No registrado'} />
                        <InfoRow label="Estado Civil" value={patientData.marital_status} />
                        <View style={[styles.separator, { backgroundColor: colors.border }]} />
                        <InfoRow label="Contacto (Emergencia)" value={patientData.emergency_contact_name} />
                        <InfoRow label="Teléfono (Emergencia)" value={patientData.emergency_contact_phone} />
                    </>
                )}
            </>
        )}

        {/* --- Modo Edición (isEditing == true) --- */}
        {isEditing && patientData && (
            <>
                {/* Datos no editables */}
                <InfoRow label="Nombre" value={user.full_name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Género" value={patientData.gender} />
                <InfoRow label="Nacimiento" value={patientData.birth_date} />
                
                <View style={[styles.separator, { backgroundColor: colors.border }]} />
                
                {/* Campos Editables */}
                <Text style={[styles.inputLabel, { color: colors.text }]}>Teléfono:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Alergias:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, height: 60 }]} value={editAllergies} onChangeText={setEditAllergies} multiline placeholder="Penicilina, Nueces..." />
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Medicamentos Actuales:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, height: 60 }]} value={editMedications} onChangeText={setEditMedications} multiline placeholder="Losartán 50mg..." />
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Padecimientos Crónicos:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, height: 60 }]} value={editConditions} onChangeText={setEditConditions} multiline placeholder="Diabetes Tipo 2..." />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Altura (cm):</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" placeholder="180" />

                <Text style={[styles.inputLabel, { color: colors.text }]}>Estado Civil:</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Picker selectedValue={editMaritalStatus} onValueChange={setEditMaritalStatus} style={{ color: colors.text }} dropdownIconColor={colors.text}>
                        <Picker.Item label="Soltero(a)" value="Soltero(a)" />
                        <Picker.Item label="Casado(a)" value="Casado(a)" />
                        <Picker.Item label="Viudo(a)" value="Viudo(a)" />
                    </Picker>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Tipo de Sangre:</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Picker selectedValue={editBloodType} onValueChange={setEditBloodType} style={{ color: colors.text }} dropdownIconColor={colors.text}>
                        <Picker.Item label="No sé" value="No sé" />
                        <Picker.Item label="O+" value="O+" />
                        <Picker.Item label="O-" value="O-" />
                        <Picker.Item label="A+" value="A+" />
                        <Picker.Item label="A-" value="A-" />
                        <Picker.Item label="B+" value="B+" />
                        <Picker.Item label="B-" value="B-" />
                        <Picker.Item label="AB+" value="AB+" />
                        <Picker.Item label="AB-" value="AB-" />
                    </Picker>
                </View>

                <Text style={[styles.inputLabel, { color: colors.text }]}>Contacto de Emergencia:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editEmergencyName} onChangeText={setEditEmergencyName} placeholder="Nombre Apellido" />
                
                <Text style={[styles.inputLabel, { color: colors.text }]}>Teléfono de Emergencia:</Text>
                <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border }]} value={editEmergencyPhone} onChangeText={setEditEmergencyPhone} keyboardType="phone-pad" />
            </>
        )}
      </View>
      
      {/* --- Sección de Ajustes --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajustes y Seguridad</Text>
        
        {/* Modo Oscuro */}
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>Modo Oscuro</Text>
          <Switch
            value={settings.dark_mode}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>

        {/* Cambiar Contraseña */}
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>Cambiar Contraseña</Text>
            <Button title="Ir" onPress={() => navigation.navigate('ChangePassword')} />
        </View>

        {/* --- Botón para MÉDICOS/ADMINS --- */}
        {userRole && (userRole === 'medico' || userRole === 'admin') && (
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>Gestionar Horario</Text>
                <Button title="Ir" onPress={() => navigation.navigate('MyAvailability')} />
            </View>
        )}

         {/* --- Botón solo para ADMINS --- */}
         {userRole && userRole === 'admin' && (
            <View style={styles.settingRow}>
                <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>Gestionar Usuarios</Text>
                <Button title="Ir (Admin)" onPress={() => navigation.navigate('UserList')} color="red" />
            </View>
        )}
      </View>

      <View style={{height: 50}} />
    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, paddingTop: 10 },
  section: { marginHorizontal: 15, marginBottom: 15, padding: 20, borderRadius: 10, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  infoLabel: { fontSize: 16, color: '#666' },
  infoValue: { fontSize: 16, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 10 },
  inputLabel: { fontSize: 16, opacity: 0.7, marginBottom: 5, marginTop: 5 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 10 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 10 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  separator: { height: 1, marginVertical: 15, backgroundColor: '#eee' },
});

export default MyAccountScreen;