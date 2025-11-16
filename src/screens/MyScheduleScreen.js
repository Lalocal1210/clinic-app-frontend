// --- src/screens/MyScheduleScreen.js ---

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, Alert
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useIsFocused, useTheme } from '@react-navigation/native';
import { Calendar, LocaleConfig } from 'react-native-calendars'; // Importamos el Calendario

// Configuración de idioma para el calendario (opcional, pero recomendado)
LocaleConfig.locales['es'] = {
  monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  monthNamesShort: ['Ene.','Feb.','Mar.','Abr.','May.','Jun.','Jul.','Ago.','Sep.','Oct.','Nov.','Dic.'],
  dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  dayNamesShort: ['Dom.','Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const MyScheduleScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [allAppointments, setAllAppointments] = useState([]); // Todas mis citas
  const [markedDates, setMarkedDates] = useState({}); // Días marcados
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]); // Citas del día
  
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  // 1. Carga todas las citas del médico
  const loadDoctorSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      // Obtenemos el ID del médico logueado
      const meResponse = await apiClient.get('/users/me');
      const myUserId = meResponse.data.id;

      // Obtenemos TODAS las citas
      const appointmentsResponse = await apiClient.get('/appointments/all');
      
      // Filtramos solo las nuestras
      const myAppointments = appointmentsResponse.data.filter(
        (app) => app.doctor.id === myUserId
      );
      setAllAppointments(myAppointments);

      // --- Lógica para marcar el calendario ---
      const markers = {};
      myAppointments.forEach(app => {
        const dateString = app.appointment_date.split('T')[0]; // YYYY-MM-DD
        
        // Define los colores por estado
        let dotColor = '#fca311'; // Pendiente
        if (app.status.name === 'confirmada') dotColor = '#2a9d8f'; // Confirmada
        if (app.status.name === 'completada') dotColor = '#888'; // Completada
        if (app.status.name === 'cancelada') dotColor = '#e63946'; // Cancelada
        
        if (!markers[dateString]) {
          markers[dateString] = { dots: [] };
        }
        // Añadimos un punto (evita duplicados si hay varias en un día)
        if (!markers[dateString].dots.find(d => d.key === app.status.name)) {
           markers[dateString].dots.push({ key: app.status.name, color: dotColor });
        }
      });
      
      setMarkedDates(markers);

    } catch (error) {
      console.error("Error al cargar agenda:", error);
      if (error.response?.status === 401) signOut();
    } finally {
      setIsLoading(false);
    }
  }, [signOut]); // useCallback

  // Carga inicial
  useEffect(() => {
    if (isFocused) {
      loadDoctorSchedule();
    }
  }, [isFocused, loadDoctorSchedule]);

  // 2. Lógica para manejar el clic en un día
  const onDayPress = (day) => {
    const dateString = day.dateString;
    setSelectedDay(dateString); // Marca el día seleccionado
  };

  // 3. Efecto que filtra las citas CADA VEZ que el día seleccionado o las citas cargadas cambian
  useEffect(() => {
    const appointmentsForDay = allAppointments.filter(app => {
      return app.appointment_date.split('T')[0] === selectedDay;
    });
    setSelectedDayAppointments(appointmentsForDay);
  }, [selectedDay, allAppointments]); // Se re-ejecuta si 'selectedDay' o 'allAppointments' cambian

  // 4. Renderizado de cada cita en la lista inferior
  const renderAppointmentItem = ({ item }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <Text style={[styles.itemTitle, { color: colors.text }]}>{item.reason}</Text>
      <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.8 }]}>
        Paciente: {item.patient.full_name}
      </Text>
      <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.8 }]}>
        Hora: {new Date(item.appointment_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: item.status.name === 'pendiente' ? '#fca311' : (item.status.name === 'confirmada' ? '#2a9d8f' : '#e63946') }]}>
          <Text style={styles.statusText}>{item.status.name}</Text>
      </View>
    </View>
  );

  // 5. Renderizado Principal
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        // Estilos del calendario (adaptados al tema)
        style={[styles.calendar, { backgroundColor: colors.card }]}
        theme={{
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.text,
          dayTextColor: colors.text,
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#ffffff',
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textDisabledColor: colors.border,
          'stylesheet.calendar.header': { // Estilos internos para modo oscuro
             week: {
                 marginTop: 5,
                 flexDirection: 'row',
                 justifyContent: 'space-between',
                 borderBottomWidth: 1,
                 borderColor: colors.border
             }
          }
        }}
        
        // --- Lógica del Calendario ---
        current={selectedDay}
        onDayPress={onDayPress}
        markingType={'multi-dot'} // Permite múltiples puntos (pendiente, confirmada, etc.)
        markedDates={{
          ...markedDates,
          // Resalta el día que tocamos
          [selectedDay]: { 
            ...(markedDates[selectedDay] || {}), // Mantiene los puntos si los tiene
            selected: true 
          } 
        }}
      />

      <Text style={[styles.listTitle, { color: colors.text }]}>
        Agenda del {new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>

      <FlatList
        data={selectedDayAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.text }]}>No hay citas para este día.</Text>
        }
      />
    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  calendar: {
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    paddingBottom: 5,
  },
  itemContainer: {
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.6,
    marginTop: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default MyScheduleScreen;