// --- src/screens/PatientCreateScreen.js ---

import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme } from '@react-navigation/native';

// Importamos las librerías necesarias
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const PatientCreateScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Estados para los selectores
  const [gender, setGender] = useState('male'); // Valor por defecto
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const { colors } = useTheme();

  // --- Lógica del Calendario (Corregida para Android) ---
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Función auxiliar para formatear fecha a YYYY-MM-DD
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const handleCreatePatient = async () => {
    if (!fullName) {
      Alert.alert('Error', 'El nombre completo es obligatorio.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Prepara el JSON
      const patientData = {
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        gender: gender,
        birth_date: formatDateForAPI(birthDate),
      };

      // Llama a la API
      const response = await apiClient.post('/patients/', patientData);

      // --- Lógica de Contraseña Temporal ---
      const tempPassword = response.data.temporary_password;
      
      let alertMessage = `${fullName} ha sido registrado exitosamente.`;
      if (tempPassword) {
        alertMessage += `\n\n🔑 Contraseña Temporal: ${tempPassword}\n\n(Por favor, compártela con el paciente para que pueda iniciar sesión).`;
      }

      Alert.alert(
        'Paciente Creado',
        alertMessage,
        [
          { text: "OK", onPress: () => navigation.goBack() }
        ]
      );

    } catch (error) {
      console.error(error.response?.data || error.message);
      const errorMsg = error.response?.data?.detail || 'No se pudo crear el paciente.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="always" // ¡Clave para que el botón funcione!
    >
      <Text style={[styles.title, { color: colors.text }]}>Registrar Nuevo Paciente</Text>
      
      {/* Nombre */}
      <Text style={[styles.label, { color: colors.text }]}>Nombre Completo *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Ej. Juan Perez"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Email */}
      <Text style={[styles.label, { color: colors.text }]}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="paciente@correo.com"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Teléfono */}
      <Text style={[styles.label, { color: colors.text }]}>Teléfono</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="55 1234 5678"
        placeholderTextColor="#999"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* --- SELECTOR DE GÉNERO --- */}
      <Text style={[styles.label, { color: colors.text }]}>Género</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label="Masculino" value="male" />
          <Picker.Item label="Femenino" value="female" />
          <Picker.Item label="Otro" value="other" />
        </Picker>
      </View>

      {/* --- SELECTOR DE FECHA DE NACIMIENTO --- */}
      <Text style={[styles.label, { color: colors.text }]}>Fecha de Nacimiento</Text>
      
      {Platform.OS === 'android' && (
        <View style={{ marginBottom: 15 }}>
            <Button 
                onPress={() => setShowDatePicker(true)} 
                title={`Seleccionar Fecha: ${birthDate.toLocaleDateString()}`} 
                color={colors.primary}
            />
        </View>
      )}

      {(showDatePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          testID="dateTimePicker"
          value={birthDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()} // No puede nacer en el futuro
          textColor={colors.text}
        />
      )}
      
      {Platform.OS === 'ios' && (
         <Text style={[styles.dateText, { color: colors.text }]}>
            Seleccionado: {birthDate.toLocaleDateString()}
         </Text>
      )}

      <View style={styles.buttonContainer}>
        {isSubmitting ? (
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
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 50,
  }
});

export default PatientCreateScreen;