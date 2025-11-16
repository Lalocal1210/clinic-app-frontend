// --- src/screens/PatientDetailScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, 
  ActivityIndicator, Alert, Button, Image, 
  TouchableOpacity, Modal, TextInput,
  Dimensions // Para el ancho de la gráfica
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; // ¡IMPORTACIÓN CORREGIDA!
import { useNavigation, useTheme, useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker'; 
import { LineChart } from 'react-native-chart-kit'; // Importamos la Gráfica

// Obtenemos el ancho de la pantalla para la gráfica
const screenWidth = Dimensions.get('window').width;

// --- Componente auxiliar para mostrar datos ---
const InfoRow = ({ label, value, color }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: color, opacity: 0.7 }]}>{label}:</Text>
      <Text style={[styles.infoValue, { color: color }]}>{value || 'No registrado'}</Text>
    </View>
);

const PatientDetailScreen = ({ route }) => {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estado para saber quién está mirando
  const [currentUserRole, setCurrentUserRole] = useState(null); 
  
  // --- Estados para Modales ---
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [vitalModalVisible, setVitalModalVisible] = useState(false);
  
  // --- Estados para Formularios ---
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [vitalType, setVitalType] = useState('');
  const [vitalValue, setVitalValue] = useState('');
  const [vitalUnit, setVitalUnit] = useState('');

  const { signOut } = useAuth();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const isFocused = useIsFocused(); // Para recargar

  // 1. Función para cargar datos (Actualizada)
  const fetchPatientDetail = async () => {
    try {
      // Pedimos los datos del usuario logueado Y del paciente
      const [userResponse, patientResponse] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get(`/patients/${patientId}`)
      ]);
      
      setCurrentUserRole(userResponse.data.role.name); // Guardamos el rol
      setPatient(patientResponse.data); // Guardamos los datos del paciente

    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) signOut();
      else Alert.alert('Error', 'No se pudo cargar la información.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Cargando...' });
    if (isFocused) {
        fetchPatientDetail();
    }
  }, [patientId, isFocused]); // Recarga si la pantalla se enfoca

  useEffect(() => {
    if (patient) navigation.setOptions({ title: patient.full_name });
  }, [patient]);

  // --- 2. Lógica para Agregar NOTA ---
  const handleAddNote = async () => {
    if (!noteTitle || !noteContent) return Alert.alert('Error', 'Campos vacíos');
    try {
      await apiClient.post(`/patients/${patientId}/notes`, {
        title: noteTitle,
        content: noteContent
      });
      Alert.alert('Éxito', 'Nota agregada.');
      setNoteModalVisible(false);
      setNoteTitle(''); setNoteContent(''); // Limpiar form
      fetchPatientDetail(); // Recargar datos
    } catch (e) { Alert.alert('Error', 'No se pudo guardar la nota.'); }
  };

  // --- 3. Lógica para Agregar SIGNO VITAL ---
  const handleAddVital = async () => {
    if (!vitalType || !vitalValue) return Alert.alert('Error', 'Campos vacíos');
    try {
      await apiClient.post(`/patients/${patientId}/vitals`, {
        type_name: vitalType,
        value: vitalValue,
        unit: vitalUnit
      });
      Alert.alert('Éxito', 'Signo vital registrado.');
      setVitalModalVisible(false);
      setVitalType(''); setVitalValue(''); setVitalUnit(''); // Limpiar
      fetchPatientDetail();
    } catch (e) { Alert.alert('Error', 'No se pudo guardar.'); }
  };

  // --- 4. Lógica para Subir FOTO ---
  const handleUploadPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Se requiere permiso para acceder a las fotos.");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, 
      aspect: [4, 3],
      quality: 0.5, 
    });

    if (pickerResult.canceled) return;

    const localUri = pickerResult.assets[0].uri;
    const filename = localUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    const formData = new FormData();
    formData.append('file', { uri: localUri, name: filename, type });
    formData.append('description', 'Foto subida desde App');

    try {
      setIsLoading(true); 
      await apiClient.post(`/patients/${patientId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'Imagen subida correctamente.');
      fetchPatientDetail();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
        setIsLoading(false);
    }
  };

  // --- 5. Lógica para preparar la GRÁFICA ---
  const prepareChartData = (vitalType) => {
    if (!patient || !patient.vital_signs) return null;

    const filteredVitals = patient.vital_signs
      .filter(v => v.type_name.toLowerCase() === vitalType.toLowerCase())
      .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at)); 

    if (filteredVitals.length < 2) {
      return null; // No se puede graficar menos de 2 puntos
    }

    const chartData = {
      labels: filteredVitals.map(v => new Date(v.measured_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })),
      datasets: [
        {
          data: filteredVitals.map(v => parseFloat(v.value) || 0), 
        },
      ],
    };
    return chartData;
  };

  // Preparamos los datos para una gráfica de "Peso"
  const weightChartData = prepareChartData('Peso');


  // --- Renderizado ---
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!patient) return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No se encontró el paciente.</Text>
      </View>
  );

  return (
    <View style={{flex: 1}}> 
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* --- SECCIÓN DATOS PERSONALES --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Datos Personales</Text>
            
            {/* Botón de Editar (Solo Admin/Médico) */}
            {(currentUserRole === 'admin' || currentUserRole === 'medico') && (
              <Button 
                title="Editar" 
                onPress={() => navigation.navigate('PatientEdit', { patient: patient })} 
                color={colors.primary}
              />
            )}
        </View>
        <InfoRow label="Email" value={patient.email} color={colors.text} />
        <InfoRow label="Teléfono" value={patient.phone} color={colors.text} />
        <InfoRow label="Género" value={patient.gender} color={colors.text} />
        <InfoRow label="Nacimiento" value={patient.birth_date} color={colors.text} />
        <InfoRow label="Estado Civil" value={patient.marital_status} color={colors.text} />
      </View>

      {/* --- SECCIÓN PERFIL MÉDICO (Auto-reportado) --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Perfil Médico (Reportado)</Text>
        <InfoRow label="Alergias" value={patient.allergies} color={colors.text} />
        <InfoRow label="Medicamentos" value={patient.current_medications} color={colors.text} />
        <InfoRow label="Padecimientos" value={patient.chronic_conditions} color={colors.text} />
        <InfoRow label="Tipo Sangre" value={patient.blood_type} color={colors.text} />
        <InfoRow label="Altura" value={patient.height_cm ? `${patient.height_cm} cm` : 'No registrado'} color={colors.text} />
      </View>
      
      {/* --- SECCIÓN CONTACTO DE EMERGENCIA --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contacto de Emergencia</Text>
        <InfoRow label="Nombre" value={patient.emergency_contact_name} color={colors.text} />
        <InfoRow label="Teléfono" value={patient.emergency_contact_phone} color={colors.text} />
      </View>

      {/* --- SECCIÓN NOTAS (con botón +) --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Notas Médicas</Text>
            <Button title="+ Nota" onPress={() => setNoteModalVisible(true)} />
        </View>
        {patient.medical_notes.length > 0 ? (
          patient.medical_notes.map((note) => (
            <View key={note.id} style={[styles.itemBox, { borderColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{note.title}</Text>
              <Text style={{ color: colors.text }}>{note.content}</Text>
              <Text style={styles.itemDate}>{new Date(note.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        ) : <Text style={[styles.infoText, { color: colors.text }]}>Sin notas.</Text>}
      </View>

      {/* --- SECCIÓN SIGNOS VITALES (con botón + y Gráfica) --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Signos Vitales</Text>
            <Button title="+ Signo" onPress={() => setVitalModalVisible(true)} />
        </View>

        {/* Gráfica de "Peso" */}
        {weightChartData ? (
          <>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Tendencia de Peso (kg)</Text>
            <LineChart
              data={weightChartData}
              width={screenWidth - 70} // Ancho de pantalla menos padding
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundColor: colors.card,
                backgroundGradientFrom: colors.card,
                backgroundGradientTo: colors.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(69, 123, 157, ${opacity})`, // Color de línea
                labelColor: (opacity = 1) => colors.text, // Color de etiquetas
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#1d3557",
                },
              }}
              bezier // Curva suave
              style={styles.chart}
            />
          </>
        ) : (
          <Text style={[styles.infoText, { color: colors.text, textAlign: 'center', marginVertical: 10 }]}>
            No hay suficientes datos de "Peso" para mostrar una gráfica.
          </Text>
        )}

        {/* Lista de todos los signos (como antes) */}
        {patient.vital_signs.length > 0 ? (
          patient.vital_signs.map((vital) => (
            <View key={vital.id} style={[styles.itemBox, { borderColor: colors.border }]}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{vital.type_name}: {vital.value} {vital.unit}</Text>
              <Text style={styles.itemDate}>{new Date(vital.measured_at).toLocaleString()}</Text>
            </View>
          ))
        ) : <Text style={[styles.infoText, { color: colors.text }]}>Sin registros.</Text>}
      </View>

      {/* --- SECCIÓN ARCHIVOS (con botón +) --- */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Fotos y Archivos</Text>
            <Button title="+ Foto" onPress={handleUploadPhoto} />
        </View>
        {patient.files.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {patient.files.map((file) => (
                <View key={file.id} style={{marginRight: 10}}>
                    <Image 
                        source={{ uri: `${apiClient.defaults.baseURL}${file.file_path}` }} 
                        style={styles.imageThumbnail} 
                    />
                    <Text style={[styles.itemDate, {textAlign:'center'}]}>{new Date(file.uploaded_at).toLocaleDateString()}</Text>
                </View>
            ))}
          </ScrollView>
        ) : <Text style={[styles.infoText, { color: colors.text }]}>Sin archivos.</Text>}
      </View>
      
      <View style={{ height: 50 }} />
    </ScrollView>

    {/* --- MODAL: NUEVA NOTA --- */}
    <Modal animationType="slide" transparent={true} visible={noteModalVisible} onRequestClose={() => setNoteModalVisible(false)}>
        <View style={styles.modalCenteredView}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva Nota</Text>
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                    placeholder="Título" 
                    placeholderTextColor="#999"
                    value={noteTitle} onChangeText={setNoteTitle} 
                />
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border, height: 80 }]} 
                    placeholder="Contenido de la nota..." 
                    placeholderTextColor="#999"
                    multiline 
                    value={noteContent} onChangeText={setNoteContent} 
                />
                <View style={styles.buttonRow}>
                    <Button title="Cancelar" onPress={() => setNoteModalVisible(false)} color="red" />
                    <Button title="Guardar" onPress={handleAddNote} />
                </View>
            </View>
        </View>
    </Modal>

    {/* --- MODAL: NUEVO SIGNO VITAL --- */}
    <Modal animationType="slide" transparent={true} visible={vitalModalVisible} onRequestClose={() => setVitalModalVisible(false)}>
        <View style={styles.modalCenteredView}>
            <View style={[styles.modalView, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo Signo Vital</Text>
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                    placeholder="Tipo (ej. Peso, Presión)" 
                    placeholderTextColor="#999"
                    value={vitalType} onChangeText={setVitalType} 
                />
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                    placeholder="Valor (ej. 75)" 
                    placeholderTextColor="#999"
                    value={vitalValue} onChangeText={setVitalValue} 
                />
                <TextInput 
                    style={[styles.input, { color: colors.text, borderColor: colors.border }]} 
                    placeholder="Unidad (ej. kg, mmHg)" 
                    placeholderTextColor="#999"
                    value={vitalUnit} onChangeText={setVitalUnit} 
                />
                <View style={styles.buttonRow}>
                    <Button title="Cancelar" onPress={() => setVitalModalVisible(false)} color="red" />
                    <Button title="Guardar" onPress={handleAddVital} />
                </View>
            </View>
        </View>
    </Modal>

    </View>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  section: {
    margin: 15, marginBottom: 0, padding: 20, borderRadius: 10, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  infoText: { fontSize: 16, marginBottom: 5 },
  itemBox: { borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemDate: { fontSize: 12, color: '#888', marginTop: 5 },
  imageThumbnail: { width: 100, height: 100, borderRadius: 10, backgroundColor: '#eee' },
  
  // Estilo para el perfil
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 16, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 10 },
  
  // Estilos Modal
  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: '85%', borderRadius: 20, padding: 25, shadowColor: '#000', elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 15, width: '100%' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  
  // Estilos Gráfica
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
});

export default PatientDetailScreen;