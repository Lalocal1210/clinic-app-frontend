// --- src/screens/PatientEditScreen.js ---

import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

// ¡Este es el formulario que usan Médicos/Admins!
const PatientEditScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  
  // 1. Recibimos el paciente que vamos a editar (pasado desde PatientDetailScreen)
  const route = useRoute();
  const { patient } = route.params;

  // 2. Seteamos el estado inicial con los datos del paciente
  // (Estos son los campos que solo un admin/médico puede cambiar)
  const [fullName, setFullName] = useState(patient.full_name || '');
  const [email, setEmail] = useState(patient.email || '');
  const [phone, setPhone] = useState(patient.phone || '');
  const [gender, setGender] = useState(patient.gender || 'male');
  const [birthDate, setBirthDate] = useState(patient.birth_date || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 3. Lógica para Guardar
  const handleSave = async () => {
    if (!fullName || !email) {
      Alert.alert('Error', 'Nombre y Email son obligatorios.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Prepara los datos del schema AdminUpdate
      const updatedData = {
        full_name: fullName,
        email: email,
        phone: phone,
        gender: gender,
        birth_date: birthDate || null,
        // Nota: Los campos de perfil (alergias, etc.) no se editan aquí,
        // se editan en MyAccountScreen. Este form es solo para datos de registro.
      };
      
      // Llama al endpoint PUT (como Admin/Médico, la API lo permite)
      await apiClient.put(`/patients/${patient.id}`, updatedData);
      
      Alert.alert('Éxito', 'Paciente actualizado.');
      
      // Regresa a la pantalla de Detalle (que se recargará)
      navigation.goBack(); 
      
    } catch (error) {
      console.error(error.response?.data);
      Alert.alert('Error', 'No se pudo actualizar el paciente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="always"
    >
      <Text style={[styles.title, { color: colors.text }]}>Editar Paciente</Text>
      
      <Text style={[styles.label, { color: colors.text }]}>Nombre Completo *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: colors.text }]}>Teléfono</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: colors.text }]}>Género</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Picker
          selectedValue={gender}
          onValueChange={setGender}
          style={{ color: colors.text }}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="Masculino" value="male" />
          <Picker.Item label="Femenino" value="female" />
          <Picker.Item label="Otro" value="other" />
        </Picker>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Fecha de Nacimiento (YYYY-MM-DD)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="YYYY-MM-DD"
      />

      <View style={styles.buttonContainer}>
        {isSubmitting ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button title="Guardar Cambios" onPress={handleSave} />
        )}
      </View>
    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 50,
  }
});

export default PatientEditScreen;