import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, Alert, TouchableOpacity, RefreshControl, Dimensions, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useIsFocused, useTheme, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MyAppointmentsScreen = () => {
  const [appointments, setAppointments] = useState([]);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [otherAppointments, setOtherAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { signOut } = useAuth();
  const { colors } = useTheme(); 
  const isFocused = useIsFocused(); 
  const navigation = useNavigation();

  // --- Lógica de Carga Inteligente ---
  const fetchAppointments = useCallback(async () => {
    if (!refreshing) setIsLoading(true);
    try {
      const response = await apiClient.get('/appointments/me');
      const allData = response.data;
      
      // Ordenar por fecha (más cercana primero)
      const sorted = allData.sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
      
      // Separar la "Próxima Cita" (Futura y Confirmada/Pendiente) del resto
      const now = new Date();
      const upcomingIndex = sorted.findIndex(a => 
        new Date(a.appointment_date) > now && (a.status.name === 'confirmada' || a.status.name === 'pendiente')
      );

      if (upcomingIndex !== -1) {
        setNextAppointment(sorted[upcomingIndex]);
        // El resto de la lista (excluyendo la destacada)
        const others = [...sorted];
        others.splice(upcomingIndex, 1); 
        setOtherAppointments(others);
      } else {
        setNextAppointment(null);
        setOtherAppointments(sorted);
      }
      setAppointments(allData); 
      
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401 || error.response?.status === 403) signOut();
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, signOut]);

  useEffect(() => {
    if (isFocused) fetchAppointments();
  }, [isFocused, fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // --- Acciones ---
  const handleAction = (item) => {
    if (item.status.name === 'cancelada') {
       // Si está cancelada, permitimos reagendar con los mismos datos
       navigation.navigate('AppointmentCreate', { defaultDoctorId: item.doctor.id, defaultReason: item.reason });
    } else if (item.status.name === 'pendiente') {
       Alert.alert("Cancelar Cita", "¿Deseas cancelar esta solicitud?", [
         { text: "No", style: "cancel" },
         { text: "Sí, Cancelar", style: "destructive", onPress: async () => {
             try {
               await apiClient.delete(`/appointments/${item.id}`);
               onRefresh();
             } catch (e) { Alert.alert("Error", "No se pudo cancelar."); }
         }}
       ]);
    }
  };

  // --- Componente: Tarjeta Héroe (Próxima Cita Destacada) ---
  const HeroCard = ({ item }) => {
    if (!item) return null;
    const dateObj = new Date(item.appointment_date);
    
    return (
      <View style={styles.heroContainer}>
        <Text style={styles.sectionTitle}>Tu Próxima Visita</Text>
        <TouchableOpacity activeOpacity={0.9} onPress={() => {}}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']} // Gradiente Indigo "Aether"
            start={{x: 0, y: 0}} end={{x: 1, y: 1}}
            style={styles.heroCard}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroIconContainer}>
                <Ionicons name="medical" size={24} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.heroDoctor}>Dr. {item.doctor.full_name}</Text>
                <Text style={styles.heroSpecialty}>Medicina General</Text>
              </View>
            </View>

            <View style={styles.heroDateRow}>
              <View style={styles.heroDateBox}>
                <Ionicons name="calendar" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroDateText}>
                  {dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <View style={styles.heroDateBox}>
                <Ionicons name="time" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroDateText}>
                  {dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
            
            {item.status.name === 'pendiente' && (
               <View style={styles.pendingTag}>
                 <Text style={styles.pendingText}>Esperando confirmación...</Text>
               </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Componente: Item de Línea de Tiempo ---
  const TimelineItem = ({ item, index, isLast }) => {
    const dateObj = new Date(item.appointment_date);
    const isCancelled = item.status.name === 'cancelada';
    const isCompleted = item.status.name === 'completada';
    
    // Colores de estado
    let statusColor = '#F59E0B'; // Naranja (Pendiente)
    if (isCancelled) statusColor = '#EF4444'; // Rojo
    if (item.status.name === 'confirmada') statusColor = '#10B981'; // Verde
    if (isCompleted) statusColor = '#6B7280'; // Gris

    return (
      <View style={styles.timelineRow}>
        {/* Columna Izquierda: Hora y Mes */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeTextPrimary}>
            {dateObj.getDate()}
          </Text>
          <Text style={styles.timeTextSecondary}>
            {dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
          </Text>
        </View>

        {/* Columna Central: Línea y Punto Conector */}
        <View style={styles.lineColumn}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          {!isLast && <View style={styles.line} />}
        </View>

        {/* Columna Derecha: Tarjeta de Información */}
        <View style={styles.cardColumn}>
          <TouchableOpacity 
            style={[styles.timelineCard, isCancelled && styles.cardCancelled]}
            onPress={() => handleAction(item)}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, isCancelled && {color: '#999'}]}>
                {item.reason}
              </Text>
              <Text style={styles.cardSubtitle}>Dr. {item.doctor.full_name}</Text>
              <Text style={[styles.cardStatus, { color: statusColor }]}>
                {item.status.name.toUpperCase()}
              </Text>
            </View>
            {/* Icono de acción rápida según estado */}
            <Ionicons 
              name={isCancelled ? "refresh-circle" : (item.status.name === 'pendiente' ? "close-circle" : "chevron-forward")} 
              size={24} 
              color="#D1D5DB" 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- UI Principal ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Fijo Minimalista */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <View style={styles.profileBadge}>
           <Ionicons name="person" size={16} color="white" />
        </View>
      </View>

      {isLoading && !refreshing ? (
         <View style={styles.centered}><ActivityIndicator color="#4F46E5" size="large"/></View>
      ) : (
        <FlatList
          data={otherAppointments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5"/>}
          
          ListHeaderComponent={
            <>
              {nextAppointment ? (
                <HeroCard item={nextAppointment} />
              ) : (
                <View style={styles.emptyHero}>
                   <Text style={styles.emptyHeroText}>No tienes citas próximas.</Text>
                   <Text style={styles.emptyHeroSub}>¿Agendamos una revisión?</Text>
                </View>
              )}
              {otherAppointments.length > 0 && (
                <Text style={styles.sectionTitle}>Historial & Otras Citas</Text>
              )}
            </>
          }
          
          renderItem={({ item, index }) => (
            <TimelineItem 
              item={item} 
              index={index} 
              isLast={index === otherAppointments.length - 1} 
            />
          )}

          ListEmptyComponent={
             !nextAppointment && (
               <View style={styles.emptyState}>
                 <Ionicons name="file-tray-outline" size={40} color="#9CA3AF" />
                 <Text style={{color: '#9CA3AF', marginTop: 10}}>Tu historial está vacío</Text>
               </View>
             )
          }
        />
      )}

      {/* FAB (Boton Flotante) con Gradiente para Agregar Cita */}
      <TouchableOpacity 
        style={styles.fabContainer}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AppointmentCreate')}
      >
        <LinearGradient
           colors={['#4F46E5', '#ec4899']} // Gradiente "Aether" (Azul a Rosa)
           start={{x: 0, y: 0}} end={{x: 1, y: 1}}
           style={styles.fab}
        >
          <Ionicons name="add" size={32} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' }, // Gris muy suave de fondo
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 100 },

  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Safe area aproximado
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  profileBadge: { 
    width: 32, height: 32, borderRadius: 16, 
    backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' 
  },

  // HERO CARD (Tarjeta Destacada)
  heroContainer: { padding: 20, paddingBottom: 10 },
  sectionTitle: { 
    fontSize: 14, fontWeight: '700', color: '#6B7280', 
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 15, marginTop: 10
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIconContainer: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    marginRight: 15
  },
  heroDoctor: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  heroSpecialty: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  heroDateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  heroDateBox: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 
  },
  heroDateText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  pendingTag: { 
    marginTop: 15, backgroundColor: 'rgba(255,244,229,0.2)', 
    padding: 8, borderRadius: 8, alignItems: 'center' 
  },
  pendingText: { color: '#FEF3C7', fontWeight: 'bold', fontSize: 12 },
  
  emptyHero: {
    margin: 20, padding: 30, borderRadius: 20,
    backgroundColor: '#fff', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed'
  },
  emptyHeroText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  emptyHeroSub: { fontSize: 14, color: '#9CA3AF', marginTop: 5 },

  // TIMELINE LIST (Lista Vertical)
  timelineRow: { flexDirection: 'row', paddingHorizontal: 20, minHeight: 100 },
  timeColumn: { width: 50, alignItems: 'center', paddingTop: 24 },
  timeTextPrimary: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  timeTextSecondary: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  
  lineColumn: { width: 20, alignItems: 'center' },
  dot: { 
    width: 12, height: 12, borderRadius: 6, 
    marginTop: 28, zIndex: 2, borderWidth: 2, borderColor: '#F9FAFB' 
  },
  line: { 
    width: 2, flex: 1, backgroundColor: '#E5E7EB', 
    position: 'absolute', top: 28, bottom: -28 
  },
  
  cardColumn: { flex: 1, paddingLeft: 15, paddingBottom: 20 },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.05, shadowRadius: 4,
    elevation: 2,
    borderWidth: 1, borderColor: 'transparent'
  },
  cardCancelled: { opacity: 0.6, backgroundColor: '#F3F4F6' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  cardStatus: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  emptyState: { alignItems: 'center', marginTop: 40, opacity: 0.7 },

  // FAB (Botón Flotante)
  fabContainer: {
    position: 'absolute', bottom: 30, right: 20,
    shadowColor: "#EC4899", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 8,
  },
  fab: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  }
});

export default MyAppointmentsScreen;