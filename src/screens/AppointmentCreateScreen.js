import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
  FlatList, TouchableOpacity 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const AppointmentCreateScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { signOut } = useAuth();
  
  // Para volver a agendar o venir de otra pantalla
  const route = useRoute();
  const { defaultDoctorId, defaultReason } = route.params || {};

  // --- Estados ---
  const [doctors, setDoctors] = useState([]); 
  const [selectedDoctor, setSelectedDoctor] = useState(defaultDoctorId || null);
  
  // Inicializamos la fecha a HOY
  const [date, setDate] = useState(new Date()); 
  
  const [reason, setReason] = useState(defaultReason || '');
  const [slots, setSlots] = useState([]); 
  const [selectedSlot, setSelectedSlot] = useState(null); 
  
  // Estados de Carga UI
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 

  // --- HELPER CRÍTICO: Formatea fecha local a "YYYY-MM-DD" ---
  // Evita que JS convierta a UTC y cambie el día por la diferencia horaria
  const formatDateLocal = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Carga la lista de médicos
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        const response = await apiClient.get('/users/doctors'); 
        setDoctors(response.data);
        // Si no venimos pre-seleccionados y hay doctores, seleccionamos el primero
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

  // 2. Carga Slots Disponibles
  // Usamos useCallback para que no se cree la función en cada render
  const fetchSlots = useCallback(async (doctorId, queryDate) => {
    if (!doctorId) return;
    
    setIsLoadingSlots(true);
    setSlots([]); // Limpiar slots anteriores
    setSelectedSlot(null); // Limpiar selección
    
    // Usamos la función local para enviar la fecha correcta
    const dateString = formatDateLocal(queryDate);
    
    try {
      const response = await apiClient.get('/availability/slots', {
        params: {
          doctor_id: doctorId,
          query_date: dateString
        }
      });
      // Filtramos solo los disponibles (aunque el backend ya debería hacerlo)
      setSlots(response.data.filter(slot => slot.is_available));
    } catch (error) {
      console.error("Error cargando slots:", error);
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  // Efecto: Recargar slots cuando cambia Doctor o Fecha
  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor, date);
    }
  }, [selectedDoctor, date, fetchSlots]);

  // 3. Manejo del Calendario
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // 4. Guardar Cita (¡LÓGICA CORREGIDA!)
  const handleCreateAppointment = async () => {
    if (!selectedDoctor || !reason || !selectedSlot) { 
      Alert.alert('Faltan datos', 'Por favor selecciona un médico, una fecha, un horario y escribe el motivo.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // --- CORRECCIÓN DE ZONA HORARIA ---
      // No usamos toISOString() porque cambia la hora a UTC.
      // Construimos el string manualmente para que el backend reciba la hora "local" seleccionada.
      
      const datePart = formatDateLocal(date); // "2023-10-25"
      const timePart = selectedSlot;          // "09:30"
      
      // Formato final: "2023-10-25T09:30:00"
      const finalIsoString = `${datePart}T${timePart}:00`; 

      const appointmentData = {
        appointment_date: finalIsoString, 
        reason: reason,
        doctor_id: selectedDoctor,
      };

      await apiClient.post('/appointments/', appointmentData);
      
      Alert.alert(
        '¡Cita Agendada!',
        'Tu solicitud ha sido enviada. Espera la confirmación del médico.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo crear la cita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizado de cada "botón" de hora
  const renderSlot = ({ item }) => {
    const isSelected = selectedSlot === item.time;
    return (
      <TouchableOpacity
        style={[
          styles.slotButton, 
          { 
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            // Sombra suave
            elevation: isSelected ? 4 : 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
          }
        ]}
        onPress={() => setSelectedSlot(item.time)}
      >
        <Text style={{ 
          color: isSelected ? '#fff' : colors.text,
          fontWeight: isSelected ? 'bold' : 'normal'
        }}>
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
      <Text style={[styles.title, { color: colors.text }]}>Nueva Cita</Text>
      
      {/* Paso 1: Médico */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>1. Selecciona Médico:</Text>
        <View style={[styles.pickerContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Picker
            selectedValue={selectedDoctor}
            onValueChange={(itemValue) => setSelectedDoctor(itemValue)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.text}
          >
            {doctors.map((doc) => (
              <Picker.Item key={doc.id} label={`Dr. ${doc.full_name}`} value={doc.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Paso 2: Fecha */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>2. Selecciona Fecha:</Text>
        <TouchableOpacity 
          onPress={() => setShowDatePicker(true)}
          style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
           <Text style={{fontSize: 16, color: colors.text}}>
             📅 {date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </Text>
        </TouchableOpacity>
        
        {(showDatePicker || Platform.OS === 'ios') && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? "inline" : "default"}
            onChange={onDateChange}
            minimumDate={new Date()}
            textColor={colors.text}
          />
        )}
      </View>

      {/* Paso 3: Horarios */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>3. Horarios Disponibles:</Text>
        {isLoadingSlots ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />
        ) : (
          <FlatList
            data={slots}
            renderItem={renderSlot}
            keyExtractor={(item) => item.time}
            numColumns={3} 
            scrollEnabled={false} // Importante dentro de ScrollView
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 10 }} // Gap para espaciado moderno
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.text }]}>
                No hay horarios disponibles para esta fecha.
              </Text>
            }
          />
        )}
      </View>

      {/* Paso 4: Motivo */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>4. Motivo de consulta:</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Ej. Dolor de cabeza, revisión mensual..."
          placeholderTextColor="#999"
          value={reason}
          onChangeText={setReason}
          multiline
        />
      </View>

      {/* Botón Acción */}
      <View style={styles.buttonContainer}>
        {isSubmitting ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <Button 
            title="Confirmar Cita" 
            onPress={handleCreateAppointment} 
            color={colors.primary}
            disabled={!selectedSlot || !reason} // Deshabilitado si faltan datos
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 25 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '600' },
  input: {
    borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  pickerContainer: { borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
  dateButton: { 
    padding: 15, 
    borderRadius: 8, 
    borderWidth: 1, 
    alignItems: 'center' 
  },
  buttonContainer: { marginBottom: 50 },
  
  // Slots optimizados
  slotButton: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%', // 3 columnas aprox
    marginBottom: 10,
    marginRight: 10
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginTop: 10,
    textAlign: 'center'
  }
});

export default AppointmentCreateScreen;