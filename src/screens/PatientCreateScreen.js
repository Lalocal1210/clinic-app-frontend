// --- src/screens/PatientCreateScreen.js ---

import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@react-navigation/native'; // Para el modo oscuro

const PatientCreateScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState(''); // Opcional: 'male', 'female', 'other'
  const [birthDate, setBirthDate] = useState(''); // Opcional: 'YYYY-MM-DD'
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();
  const { colors } = useTheme(); // Para los estilos del tema

  const handleCreatePatient = async () => {
    if (!fullName) {
      Alert.alert('Error', 'El nombre completo es obligatorio.');
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Prepara el JSON para la API
      const patientData = {
        full_name: fullName,
        email: email || null, // Envía null si está vacío
        phone: phone || null,
        gender: gender || null,
        birth_date: birthDate || null,
      };

      // 2. Llama al endpoint POST /patients/
      await apiClient.post('/patients/', patientData);

      // 3. ¡Éxito!
      Alert.alert(
        'Paciente Creado',
        `${fullName} ha sido registrado exitosamente.`
      );
      
      // 4. Regresa a la lista de pacientes (que se recargará)
      navigation.goBack(); 

    } catch (error) {
      console.error(error.response?.data || error.message);
      const errorMsg = error.response?.data?.detail || 'No se pudo crear el paciente.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>Registrar Nuevo Paciente</Text>
      
      <Text style={[styles.label, { color: colors.text }]}>Nombre Completo *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="Nombre Apellido"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="paciente@correo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: colors.text }]}>Teléfono</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="55 1234 5678"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={[styles.label, { color: colors.text }]}>Género</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="male / female / other"
        value={gender}
        onChangeText={setGender}
        autoCapitalize="none"
      />

      <Text style={[styles.label, { color: colors.text }]}>Fecha de Nacimiento</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
        placeholder="YYYY-MM-DD"
        value={birthDate}
        onChangeText={setBirthDate}
      />

      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button 
            title="Guardar Paciente" 
            onPress={handleCreatePatient} 
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 50,
  }
});

export default PatientCreateScreen;