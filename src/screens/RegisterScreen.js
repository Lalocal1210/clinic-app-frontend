import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Dimensions, 
  KeyboardAvoidingView, Platform, StatusBar,
  TouchableWithoutFeedback, Keyboard, Animated, ScrollView, 
  Alert, Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import apiClient from '../api/client';
import { useNavigation, useTheme } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// --- PALETAS DE COLORES DINÁMICAS ---
const THEME_COLORS = {
  dark: {
    bgStart: '#0F172A',
    bgEnd: '#1E293B',
    accent: '#2DD4BF', // Turquesa Neón
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    error: '#F43F5E',
    glassBg: 'rgba(30, 41, 59, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    inputBg: 'rgba(15, 23, 42, 0.5)',
    placeholder: 'rgba(148, 163, 184, 0.4)',
    blob1: 'rgba(45, 212, 191, 0.1)', 
    blob2: 'rgba(139, 92, 246, 0.1)',
    statusBar: 'light-content'
  },
  light: {
    bgStart: '#F0F9FF', 
    bgEnd: '#E0F2FE',   
    accent: '#0EA5E9',  // Azul Océano
    textPrimary: '#1E293B', 
    textSecondary: '#64748B', 
    error: '#EF4444',
    glassBg: 'rgba(255, 255, 255, 0.85)', 
    glassBorder: 'rgba(255, 255, 255, 0.6)',
    inputBg: 'rgba(255, 255, 255, 0.6)',
    placeholder: 'rgba(100, 116, 139, 0.5)',
    blob1: 'rgba(14, 165, 233, 0.15)', 
    blob2: 'rgba(99, 102, 241, 0.15)', 
    statusBar: 'dark-content'
  }
};

const RegisterScreen = () => {
  const navigation = useNavigation();
  
  // Detectar tema actual
  const { dark } = useTheme(); 
  const activeColors = dark ? THEME_COLORS.dark : THEME_COLORS.light;

  // Estados del Formulario
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  
  // Estados de UI
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Alerta Personalizada
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'success', onPress: () => {} });

  // Animación de entrada
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Helper para Alerta
  const showAuraAlert = (title, message, type = 'success', action = () => {}) => {
    setCustomAlert({ visible: true, title, message, type, onPress: action });
  };
  const closeAuraAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
    if (customAlert.onPress) customAlert.onPress();
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    if (!fullName || !email || !password) {
      setErrorMessage('Por favor rellena los campos obligatorios.');
      return;
    }
    
    setIsLoading(true);
    try {
      const formattedDate = birthDate.toISOString().split('T')[0];
      const userData = { 
        full_name: fullName, 
        email: email, 
        password: password, 
        phone: phone, 
        birth_date: formattedDate 
      };

      await apiClient.post('/auth/register', userData);

      showAuraAlert(
        '¡Bienvenido!',
        'Tu cuenta ha sido creada con éxito. Accede ahora a tu salud inteligente.',
        'success',
        () => navigation.navigate('Login')
      );

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || 'No se pudo crear la cuenta.';
      if (error.response?.status === 409) {
          setErrorMessage('Este correo ya está registrado.');
      } else {
          setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeColors.bgStart }}>
      <StatusBar barStyle={activeColors.statusBar} />
      
      {/* Fondo Dinámico */}
      <LinearGradient colors={[activeColors.bgStart, activeColors.bgEnd]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blob1, { backgroundColor: activeColors.blob1 }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: activeColors.blob2 }]} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Animated.View 
              style={[
                styles.contentPadding, 
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
              ]}
            >
              
              {/* Header */}
              <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color={activeColors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: activeColors.textPrimary }]}>Crear Cuenta</Text>
                <Text style={[styles.headerSubtitle, { color: activeColors.textSecondary }]}>Únete a la salud inteligente</Text>
              </View>

              {/* Tarjeta de Cristal */}
              <View style={[
                  styles.glassCard, 
                  { backgroundColor: activeColors.glassBg, borderColor: activeColors.glassBorder }
              ]}>
                
                {/* Nombre */}
                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>NOMBRE COMPLETO</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="person-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        placeholder="Ej. Juan Pérez"
                        placeholderTextColor={activeColors.placeholder}
                        value={fullName}
                        onChangeText={setFullName}
                        cursorColor={activeColors.accent}
                      />
                   </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>CORREO ELECTRÓNICO</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="mail-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        placeholder="tu@email.com"
                        placeholderTextColor={activeColors.placeholder}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        cursorColor={activeColors.accent}
                      />
                   </View>
                </View>

                {/* Fecha */}
                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>FECHA DE NACIMIENTO</Text>
                   <TouchableOpacity 
                      style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]} 
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.8}
                   >
                      <Ionicons name="calendar-outline" size={20} color={activeColors.textSecondary} />
                      <Text style={[styles.textInput, { color: activeColors.textPrimary, paddingTop: 14 }]}>
                        {birthDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </Text>
                      <Ionicons name="chevron-down" size={16} color={activeColors.textSecondary} />
                   </TouchableOpacity>
                   
                   {(showDatePicker || Platform.OS === 'ios') && (
                    <View style={Platform.OS === 'ios' ? styles.iosPicker : {}}>
                      <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        maximumDate={new Date()}
                        themeVariant={dark ? "dark" : "light"}
                        textColor={activeColors.textPrimary}
                      />
                    </View>
                   )}
                </View>

                {/* Teléfono */}
                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>TELÉFONO (Opcional)</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="call-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        placeholder="55 1234 5678"
                        placeholderTextColor={activeColors.placeholder}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        cursorColor={activeColors.accent}
                      />
                   </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>CONTRASEÑA</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="lock-closed-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        placeholder="••••••••"
                        placeholderTextColor={activeColors.placeholder}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        cursorColor={activeColors.accent}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                         <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={activeColors.textSecondary} />
                      </TouchableOpacity>
                   </View>
                </View>

                {/* Error */}
                {errorMessage && (
                   <View style={styles.errorBanner}>
                     <Ionicons name="alert-circle" size={16} color={activeColors.error} />
                     <Text style={[styles.errorText, { color: activeColors.error }]}>{errorMessage}</Text>
                   </View>
                )}

                {/* Botón */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleRegister}
                  disabled={isLoading}
                  style={[styles.btnShadow, { shadowColor: activeColors.accent }]}
                >
                   <LinearGradient
                      colors={dark ? [activeColors.accent, '#0EA5E9'] : [activeColors.accent, '#0284C7']}
                      start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                      style={styles.registerBtn}
                   >
                     {isLoading ? (
                        <ActivityIndicator color={dark ? "#0F172A" : "#FFFFFF"} />
                     ) : (
                        <Text style={[styles.registerBtnText, { color: dark ? '#0F172A' : '#FFFFFF' }]}>CREAR CUENTA</Text>
                     )}
                   </LinearGradient>
                </TouchableOpacity>

              </View>

              {/* Footer */}
              <View style={styles.footerContainer}>
                <Text style={[styles.footerText, { color: activeColors.textSecondary }]}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                   <Text style={[styles.loginLink, { color: activeColors.accent }]}>Inicia Sesión</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Alerta Modal Personalizada */}
      <Modal transparent={true} visible={customAlert.visible} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: dark ? '#1E293B' : '#FFFFFF', borderColor: activeColors.glassBorder }]}>
            <LinearGradient
              colors={[activeColors.accent, dark ? '#0EA5E9' : '#0284C7']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.modalHeaderLine}
            />
            <View style={styles.modalContent}>
              <View style={[styles.modalIconBox, { shadowColor: activeColors.accent }]}>
                <Ionicons 
                  name={customAlert.type === 'success' ? "checkmark-circle" : "alert-circle"} 
                  size={48} 
                  color={customAlert.type === 'success' ? activeColors.accent : activeColors.error} 
                />
              </View>
              <Text style={[styles.modalTitle, { color: activeColors.textPrimary }]}>{customAlert.title}</Text>
              <Text style={[styles.modalMessage, { color: activeColors.textSecondary }]}>{customAlert.message}</Text>

              <TouchableOpacity activeOpacity={0.8} onPress={closeAuraAlert} style={[styles.btnShadow, { width: '100%', marginTop: 20, shadowColor: activeColors.accent }]}>
                 <LinearGradient
                    colors={[activeColors.accent, dark ? '#0EA5E9' : '#0284C7']}
                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    style={[styles.registerBtn, { height: 48 }]}
                 >
                    <Text style={[styles.registerBtnText, { color: dark ? '#0F172A' : '#FFFFFF' }]}>CONTINUAR</Text>
                 </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40 },
  contentPadding: { paddingHorizontal: 24, width: '100%', maxWidth: 450, alignSelf: 'center' },

  blob: { position: 'absolute', borderRadius: 200 },
  blob1: { top: -100, right: -100, width: 400, height: 400 },
  blob2: { bottom: -100, left: -100, width: 350, height: 350, borderRadius: 175 },

  headerContainer: { marginBottom: 30 },
  backBtn: { marginBottom: 15, width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: 1 },
  headerSubtitle: { fontSize: 16, marginTop: 5 },

  glassCard: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', height: 56,
    borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, gap: 12 
  },
  textInput: { flex: 1, fontSize: 16, height: '100%' },
  
  iosPicker: { marginTop: 10 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244, 63, 94, 0.1)',
    padding: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F43F5E'
  },
  errorText: { marginLeft: 8, fontSize: 13, flex: 1 },
  
  btnShadow: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 10 },
  registerBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  registerBtnText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  footerContainer: { marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { marginRight: 6 },
  loginLink: { fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 340, borderRadius: 24, borderWidth: 1, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
  modalHeaderLine: { height: 4, width: '100%' },
  modalContent: { padding: 24, alignItems: 'center' },
  modalIconBox: { marginBottom: 16, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 },
  modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 10, lineHeight: 22 },
});

export default RegisterScreen;