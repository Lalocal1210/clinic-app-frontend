// --- src/screens/AppointmentCreateScreen.js ---

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
  FlatList, TouchableOpacity // ¡Importamos FlatList y TouchableOpacity para los slots!
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // ¡Importación Corregida!
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const AppointmentCreateScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { signOut } = useAuth();
  
  // Para la lógica de "Volver a Agendar"
  const route = useRoute();
  const { defaultDoctorId, defaultReason } = route.params || {};

  // --- Estados del Formulario ---
  const [doctors, setDoctors] = useState([]); 
  const [selectedDoctor, setSelectedDoctor] = useState(defaultDoctorId || null);
  const [date, setDate] = useState(new Date()); // La fecha seleccionada
  const [reason, setReason] = useState(defaultReason || '');
  
  // --- ¡NUEVOS ESTADOS PARA SLOTS! ---
  const [slots, setSlots] = useState([]); // Los slots que vienen de la API
  const [selectedSlot, setSelectedSlot] = useState(null); // El slot (string) que elija
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Estados de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  // 1. Carga la lista de médicos (al inicio)
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const response = await apiClient.get('/users/doctors'); 
        setDoctors(response.data);
        if (!defaultDoctorId && response.data.length > 0) {
          setSelectedDoctor(response.data[0].id);
        }
      } catch (error) {
        console.error("Error al cargar médicos:", error);
        if (error.response?.status === 401) signOut();
      } finally {
        setIsLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [signOut, defaultDoctorId]);

  // 2. ¡NUEVO! Carga los SLOTS (horarios) cada vez que cambia el doctor o la fecha
  const fetchSlots = useCallback(async (doctorId, queryDate) => {
    if (!doctorId) return;
    
    setIsLoadingSlots(true);
    setSlots([]); // Limpia los slots anteriores
    setSelectedSlot(null); // Deselecciona el slot
    
    // Formatea la fecha a YYYY-MM-DD
    const dateString = queryDate.toISOString().split('T')[0];
    
    try {
      const response = await apiClient.get('/availability/slots', {
        params: {
          doctor_id: doctorId,
          query_date: dateString
        }
      });
      // Filtramos solo los que están disponibles
      setSlots(response.data.filter(slot => slot.is_available));
    } catch (error) {
      console.error("Error al cargar slots:", error);
      Alert.alert('Error', 'No se pudo cargar la disponibilidad horaria.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Efecto que llama a fetchSlots
  useEffect(() => {
    fetchSlots(selectedDoctor, date);
  }, [selectedDoctor, date, fetchSlots]); // Se re-ejecuta si cambia el doctor o la fecha

  // 3. Lógica del Calendario (simplificada a solo FECHA)
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false); // Cierra el picker
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate); // Actualiza la fecha
    }
  };
  
  // 4. Lógica para guardar la cita (¡ACTUALIZADA!)
  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !reason || !selectedSlot) { // ¡Ahora valida el slot!
      Alert.alert('Error', 'Por favor, selecciona un médico, un horario disponible y escribe un motivo.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // --- ¡LÓGICA CLAVE! ---
      // Combina la fecha (YYYY-MM-DD) con el slot (HH:MM)
      const [hour, minute] = selectedSlot.split(':').map(Number);
      const finalDateTime = new Date(date);
      // Setea la hora y minuto LOCALES (importante)
      finalDateTime.setHours(hour, minute, 0, 0); 

      const appointmentData = {
        appointment_date: finalDateTime.toISOString(), // Envía la fecha/hora combinada en UTC
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

  // 5. Renderizado de cada botón de "Slot"
  const renderSlot = ({ item }) => {
    const isSelected = selectedSlot === item.time;
    return (
      <TouchableOpacity
        style={[
          styles.slotButton, 
          { 
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: colors.border
          }
        ]}
        onPress={() => setSelectedSlot(item.time)}
      >
        <Text style={{ color: isSelected ? 'white' : colors.text }}>
          {item.time}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoadingDoctors) {
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
      keyboardShouldPersistTaps="always" 
    >
      <Text style={[styles.title, { color: colors.text }]}>Agendar Nueva Cita</Text>
      
      {/* Paso 1: Selector de Médico */}
      <Text style={[styles.label, { color: colors.text }]}>Paso 1: Selecciona un Médico</Text>
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

      {/* Paso 2: Selector de Fecha (Calendario) */}
      <Text style={[styles.label, { color: colors.text }]}>Paso 2: Selecciona una Fecha</Text>
      {Platform.OS === 'android' && (
         <View style={{ marginBottom: 10 }}>
            <Button onPress={() => setShowDatePicker(true)} title={`Cambiar Fecha: ${date.toLocaleDateString()}`} />
         </View>
      )}
      {(showDatePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date" // ¡Modo solo FECHA!
          display={Platform.OS === 'ios' ? "inline" : "default"}
          onChange={onDateChange}
          textColor={colors.text}
          minimumDate={new Date()} // No se puede agendar en el pasado
        />
      )}

      {/* Paso 3: Selector de Hora (Slots) */}
      <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Paso 3: Selecciona un Horario</Text>
      {isLoadingSlots ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <FlatList
          data={slots}
          renderItem={renderSlot}
          keyExtractor={(item) => item.time}
          numColumns={3} // Muestra 3 slots por fila
          columnWrapperStyle={{ justifyContent: 'space-around' }}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No hay horarios disponibles para este día.
            </Text>
          }
        />
      )}

      {/* Paso 4: Motivo de la Cita */}
      <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Paso 4: Motivo de la Cita</Text>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Ej. Dolor de cabeza, revisión general..."
        placeholderTextColor="#999"
        value={reason}
        onChangeText={setReason}
        multiline
      />

      {/* Botón de Agendar */}
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
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 8, marginLeft: 5, fontWeight: '500' },
  input: {
    height: 50, borderWidth: 1, borderRadius: 8, paddingLeft: 15,
    marginBottom: 20, fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15, },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 20, justifyContent: 'center' },
  dateText: { fontSize: 16, textAlign: 'center', marginVertical: 15, fontWeight: '500' },
  buttonContainer: { marginTop: 20, marginBottom: 50 },
  // Estilos para los Slots
  slotButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%', // 3 columnas
    margin: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 15,
    fontSize: 14,
    opacity: 0.7,
  }
});

export default AppointmentCreateScreen;