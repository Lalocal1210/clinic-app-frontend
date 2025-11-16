// --- src/screens/MyAvailabilityScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Button, Switch, TextInput
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useTheme, useIsFocused, useNavigation } from '@react-navigation/native';

// Estado inicial para los 7 días de la semana
const initialSchedule = [
  { day_of_week: 0, name: 'Lunes', is_active: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 1, name: 'Martes', is_active: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 2, name: 'Miércoles', is_active: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 3, name: 'Jueves', is_active: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 4, name: 'Viernes', is_active: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 5, name: 'Sábado', is_active: false, start_time: '09:00', end_time: '12:00' },
  { day_of_week: 6, name: 'Domingo', is_active: false, start_time: '09:00', end_time: '12:00' },
];

const MyAvailabilityScreen = () => {
  const { colors } = useTheme();
  const { signOut } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para los 7 días de la semana
  const [schedule, setSchedule] = useState(initialSchedule);

  // 1. Cargar el horario guardado
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/availability/me');
        const savedSchedule = response.data;
        
        // Actualiza el estado local con los datos de la BBDD
        setSchedule(prevSchedule => 
          prevSchedule.map(day => {
            const savedDay = savedSchedule.find(s => s.day_of_week === day.day_of_week);
            if (savedDay) {
              return {
                ...day,
                is_active: true, // Si está en la BBDD, está activo
                start_time: savedDay.start_time.substring(0, 5), // Formato "HH:MM"
                end_time: savedDay.end_time.substring(0, 5),
              };
            }
            // Si no está en la BBDD, resetea a inactivo
            return { ...day, is_active: false }; 
          })
        );
      } catch (error) {
        console.error("Error al cargar horario:", error);
        if (error.response?.status === 401) signOut();
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isFocused) {
        fetchSchedule();
    }
  }, [isFocused, signOut]);

  // 2. Función para actualizar el estado local (cuando se toca un Switch o TextInput)
  const handleDayChange = (dayIndex, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex] = { ...newSchedule[dayIndex], [field]: value };
    setSchedule(newSchedule);
  };

  // 3. Función para Guardar el horario en la API
  const handleSaveSchedule = async () => {
    setIsSaving(true);
    try {
      // Filtra solo los días activos
      const activeDays = schedule.filter(day => day.is_active);
      
      // Valida y formatea los datos para la API (añade :00 a las horas)
      const payload = activeDays.map(day => {
        if (!/^\d{2}:\d{2}$/.test(day.start_time) || !/^\d{2}:\d{2}$/.test(day.end_time)) {
          throw new Error(`Formato de hora inválido para ${day.name}. Use HH:MM`);
        }
        return {
          day_of_week: day.day_of_week,
          start_time: `${day.start_time}:00`,
          end_time: `${day.end_time}:00`,
        };
      });

      // Llama al endpoint POST /availability/set
      await apiClient.post('/availability/set', payload);
      
      Alert.alert('Éxito', 'Tu horario semanal ha sido guardado.');
      navigation.goBack();

    } catch (error) {
      console.error("Error al guardar horario:", error.response?.data || error.message);
      Alert.alert('Error', error.message || 'No se pudo guardar el horario.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 4. Renderizado del formulario
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Gestionar mi Horario</Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Define los días y horas en que estás disponible para citas.
      </Text>
      
      {schedule.map((day, index) => (
        <View key={day.day_of_week} style={[styles.dayContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayName, { color: colors.text }]}>{day.name}</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={day.is_active ? colors.primary : "#f4f3f4"}
              onValueChange={(newValue) => handleDayChange(index, 'is_active', newValue)}
              value={day.is_active}
            />
          </View>
          
          {/* Muestra los selectores de hora solo si el día está activo */}
          {day.is_active && (
            <View style={styles.timeContainer}>
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Inicio (HH:MM)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={day.start_time}
                  onChangeText={(text) => handleDayChange(index, 'start_time', text)}
                  placeholder="09:00"
                  maxLength={5}
                  keyboardType="numeric"
                />
              </View>
              <View>
                <Text style={[styles.label, { color: colors.text }]}>Fin (HH:MM)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={day.end_time}
                  onChangeText={(text) => handleDayChange(index, 'end_time', text)}
                  placeholder="17:00"
                  maxLength={5}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>
      ))}
      
      <View style={styles.buttonContainer}>
        {isSaving ? (
            <ActivityIndicator size="large" color={colors.primary} />
        ) : (
            <Button 
            title="Guardar Horario" 
            onPress={handleSaveSchedule} 
            />
        )}
      </View>
    </ScrollView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', margin: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20, opacity: 0.7 },
  dayContainer: {
    marginVertical: 5,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.8
  },
  input: {
    height: 40,
    width: 120, // Ancho fijo para las horas
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  buttonContainer: {
    margin: 20,
    marginBottom: 50,
  }
});

export default MyAvailabilityScreen;