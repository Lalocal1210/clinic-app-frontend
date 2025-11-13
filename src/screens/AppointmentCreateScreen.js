// --- src/screens/AppointmentCreateScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme } from '@react-navigation/native';

// --- ¡IMPORTACIÓN CORREGIDA! (Arregla el Require Cycle) ---
import { useAuth } from '../context/AuthContext'; 

// Importamos el selector de fecha y hora
import DateTimePicker from '@react-native-community/datetimepicker';
// Importamos el selector (Picker)
import { Picker } from '@react-native-picker/picker';

const AppointmentCreateScreen = () => {
  const [doctors, setDoctors] = useState([]); // Lista de médicos
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState(new Date());
  
  // --- LÓGICA DE FECHA CORREGIDA ---
  // Controlamos el estado del picker y el modo (fecha o hora)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('date'); 
  
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Cargando médicos
  const [isSubmitting, setIsSubmitting] = useState(false); // Para guardar cita
  
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { signOut } = useAuth();

  // 1. Carga la lista de médicos
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        // Llama al endpoint público /users/doctors
        const response = await apiClient.get('/users/doctors'); 
        
        setDoctors(response.data);
        if (response.data.length > 0) {
          setSelectedDoctor(response.data[0].id); // Selecciona el primero por defecto
        }
      } catch (error) {
        console.error("Error al cargar médicos:", error);
        if (error.response?.status === 401) signOut();
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, [signOut]);

  // 2. Lógica para manejar el selector de fecha (¡CORREGIDA PARA EL CRASH!)
  const onDateChange = (event, selectedDate) => {
    // Si el usuario presiona "Cancelar" o cierra el picker
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    
    // Si el usuario presiona "Aceptar"
    if (event.type === 'set' && selectedDate) {
      const currentDate = selectedDate;
      
      // En Android, el flujo es en dos pasos: Fecha -> Hora
      if (Platform.OS === 'android') {
        // Si acabamos de seleccionar la FECHA
        if (datePickerMode === 'date') {
          setDate(currentDate); // Guarda la fecha
          setDatePickerMode('time'); // Pasa al modo 'time'
          setShowDatePicker(true); // Vuelve a mostrar el picker (ahora como reloj)
        } 
        // Si acabamos de seleccionar la HORA
        else {
          setDate(currentDate); // Guarda la hora final
          setShowDatePicker(false); // Oculta el picker (flujo terminado)
          setDatePickerMode('date'); // Resetea al modo 'date' para la próxima vez
        }
      } else {
        // En iOS, el picker 'datetime' lo hace todo de una vez
        setDate(currentDate);
      }
    }
  };

  // Función auxiliar para mostrar el picker en Android
  const showDateTimePicker = () => {
    setDatePickerMode('date'); // Siempre empezamos por la fecha
    setShowDatePicker(true);
  };
  
  // 3. Lógica para guardar la cita
  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !reason) {
      Alert.alert('Error', 'Por favor, selecciona un médico y escribe un motivo.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const appointmentData = {
        appointment_date: date.toISOString(), 
        reason: reason,
        doctor_id: selectedDoctor,
      };
      await apiClient.post('/appointments/', appointmentData);
      Alert.alert(
        'Cita Creada',
        'Tu cita ha sido registrada como "pendiente".'
      );
      navigation.goBack(); 
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo crear la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && doctors.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Cargando médicos...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      // --- ¡ESTA ES LA LÍNEA CORREGIDA PARA EL BOTÓN! ---
      keyboardShouldPersistTaps="always" 
    >
      <Text style={[styles.title, { color: colors.text }]}>Agendar Nueva Cita</Text>
      
      {/* Selector de Médico */}
      <Text style={[styles.label, { color: colors.text }]}>Médico</Text>
      <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Picker
          selectedValue={selectedDoctor}
          onValueChange={(itemValue) => setSelectedDoctor(itemValue)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.text}
        >
          {doctors.map((doc) => (
            <Picker.Item key={doc.id} label={doc.full_name} value={doc.id} />
          ))}
        </Picker>
      </View>

      {/* Selector de Fecha y Hora */}
      <Text style={[styles.label, { color: colors.text }]}>Fecha y Hora</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="datetime"
          is24Hour={true}
          display="spinner"
          onChange={onDateChange}
          textColor={colors.text}
        />
      ) : (
        <>
          <View style={{ marginBottom: 10 }}>
            {/* Este botón inicia el flujo de Fecha -> Hora */}
            <Button onPress={showDateTimePicker} title="Seleccionar Fecha y Hora" />
          </View>
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode={datePickerMode} // 'date' o 'time'
              is24Hour={true}
              display="default"
              onChange={onDateChange}
            />
          )}
        </>
      )}
      <Text style={[styles.dateText, { color: colors.text }]}>
        Seleccionado: {date.toLocaleString()}
      </Text>

      {/* Motivo de la Cita */}
      <Text style={[styles.label, { color: colors.text }]}>Motivo de la Cita</Text>
      <TextInput
        style={[
          styles.input, 
          styles.textArea, 
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
        ]}
        placeholder="Ej. Dolor de cabeza, revisión general..."
        placeholderTextColor="#999"
        value={reason}
        onChangeText={setReason}
        multiline={true}
        numberOfLines={4}
      />

      <View style={styles.buttonContainer}>
        {isSubmitting ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button 
            title="Agendar Cita" 
            onPress={handleCreateAppointment} 
          />
        )}
      </View>
    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center'
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    marginLeft: 5,
    fontWeight: '500'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top', // Para Android
    paddingTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center'
  },
  dateText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: '500'
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 50,
  }
});

export default AppointmentCreateScreen;