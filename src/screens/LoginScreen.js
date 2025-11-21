import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Dimensions, 
  KeyboardAvoidingView, Platform, StatusBar,
  TouchableWithoutFeedback, Keyboard, Animated, ScrollView,
  Modal 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; 
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';
import { useNavigation, useTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto

const { width } = Dimensions.get('window');

// --- PALETAS DE COLORES DINÁMICAS ---
const THEME_COLORS = {
  dark: {
    bgStart: '#0F172A',
    bgEnd: '#1E293B',
    accent: '#2DD4BF', 
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
    accent: '#0EA5E9', 
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

const LoginScreen = () => {
  const navigation = useNavigation();
  
  // Obtenemos toggleTheme del contexto
  const { signIn, toggleTheme } = useAuth();
  
  // Obtenemos el tema actual
  const { dark } = useTheme(); 
  const activeColors = dark ? THEME_COLORS.dark : THEME_COLORS.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '', type: 'error', onPress: () => {} });

  // Animaciones
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  const showAuraAlert = (title, message, type = 'error', action = () => {}) => {
    setCustomAlert({ visible: true, title, message, type, onPress: action });
  };
  const closeAuraAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
    if (customAlert.onPress) customAlert.onPress();
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('Completa todos los campos.');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email.trim());
      formData.append('password', password);
      const response = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      signIn(response.data.access_token);
    } catch (error) {
      if (!error.response) {
         showAuraAlert('Error de Conexión', 'No se pudo contactar con el servidor.');
      } else {
         setErrorMessage('Credenciales incorrectas. Intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeColors.bgStart }}>
      <StatusBar barStyle={activeColors.statusBar} />
      
      <LinearGradient colors={[activeColors.bgStart, activeColors.bgEnd]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blob1, { backgroundColor: activeColors.blob1 }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: activeColors.blob2 }]} />

      {/* --- BOTÓN FLOTANTE PARA CAMBIAR TEMA --- */}
      <TouchableOpacity 
        style={[styles.themeToggle, { backgroundColor: activeColors.glassBg, borderColor: activeColors.glassBorder }]}
        onPress={toggleTheme} // Llama a la función del contexto
        activeOpacity={0.7}
      >
        <Ionicons 
          name={dark ? "sunny" : "moon"} 
          size={24} 
          color={dark ? "#FDB813" : activeColors.accent} 
        />
      </TouchableOpacity>

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

              <View style={styles.headerContainer}>
                <View style={[styles.logoGlow, { shadowColor: activeColors.accent }]}>
                   <Ionicons name="planet-outline" size={56} color={activeColors.accent} />
                </View>
                <Text style={[styles.appTitle, { color: activeColors.textPrimary }]}>AURA</Text>
                <Text style={[styles.appSubtitle, { color: activeColors.textSecondary }]}>Salud Inteligente</Text>
              </View>

              <View style={[styles.glassCard, { backgroundColor: activeColors.glassBg, borderColor: activeColors.glassBorder }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.welcomeText, { color: activeColors.textPrimary }]}>Bienvenido</Text>
                  <Text style={[styles.subWelcomeText, { color: activeColors.textSecondary }]}>Tu portal personal de salud</Text>
                </View>

                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>CORREO</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="mail-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        placeholder="tu@email.com"
                        placeholderTextColor={activeColors.placeholder}
                        cursorColor={activeColors.accent}
                      />
                   </View>
                </View>

                <View style={styles.inputGroup}>
                   <Text style={[styles.label, { color: activeColors.accent }]}>CONTRASEÑA</Text>
                   <View style={[styles.inputContainer, { backgroundColor: activeColors.inputBg, borderColor: activeColors.glassBorder }]}>
                      <Ionicons name="lock-closed-outline" size={20} color={activeColors.textSecondary} />
                      <TextInput
                        style={[styles.textInput, { color: activeColors.textPrimary }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPass}
                        placeholder="••••••••"
                        placeholderTextColor={activeColors.placeholder}
                        cursorColor={activeColors.accent}
                      />
                      <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{padding: 5}}>
                        <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={activeColors.textSecondary} />
                      </TouchableOpacity>
                   </View>
                </View>

                {errorMessage && (
                   <View style={styles.errorBanner}>
                     <Ionicons name="alert-circle" size={16} color={activeColors.error} />
                     <Text style={[styles.errorText, { color: activeColors.error }]}>{errorMessage}</Text>
                   </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={[styles.btnShadow, { shadowColor: activeColors.accent }]}
                >
                   <LinearGradient
                      colors={dark ? [activeColors.accent, '#0EA5E9'] : [activeColors.accent, '#0284C7']}
                      start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                      style={styles.loginBtn}
                   >
                     {isLoading ? (
                        <ActivityIndicator color={dark ? "#0F172A" : "#FFFFFF"} />
                     ) : (
                        <Text style={[styles.loginBtnText, { color: dark ? '#0F172A' : '#FFFFFF' }]}>INICIAR SESIÓN</Text>
                     )}
                   </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={{alignSelf: 'center', marginTop: 20}}>
                    <Text style={[styles.linkText, { color: activeColors.textSecondary }]}>Recuperar Contraseña</Text>
                 </TouchableOpacity>
              </View>
              
              <View style={styles.registerContainer}>
                <Text style={[styles.noAccountText, { color: activeColors.textSecondary }]}>¿Eres nuevo aquí?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                   <Text style={[styles.registerLink, { color: activeColors.accent }]}>Crear Cuenta</Text>
                </TouchableOpacity>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <Modal transparent={true} visible={customAlert.visible} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: dark ? '#1E293B' : '#FFFFFF', borderColor: activeColors.glassBorder }]}>
            <LinearGradient
              colors={[activeColors.error, '#F43F5E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.modalHeaderLine}
            />
            <View style={styles.modalContent}>
              <View style={[styles.modalIconBox, { shadowColor: activeColors.error }]}>
                <Ionicons name="alert-circle" size={48} color={activeColors.error} />
              </View>
              <Text style={[styles.modalTitle, { color: activeColors.textPrimary }]}>{customAlert.title}</Text>
              <Text style={[styles.modalMessage, { color: activeColors.textSecondary }]}>{customAlert.message}</Text>

              <TouchableOpacity activeOpacity={0.8} onPress={closeAuraAlert} style={[styles.btnShadow, { width: '100%', marginTop: 20, shadowColor: activeColors.error }]}>
                 <LinearGradient
                    colors={[activeColors.error, '#E11D48']}
                    start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                    style={[styles.loginBtn, { height: 48 }]}
                 >
                    <Text style={[styles.loginBtnText, { color: '#FFFFFF' }]}>ENTENDIDO</Text>
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

  // Botón de Tema Flotante
  themeToggle: {
    position: 'absolute',
    top: 50, // Ajustar según status bar
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 100, // Asegurar que esté por encima
    elevation: 5,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },

  headerContainer: { alignItems: 'center', marginBottom: 30 },
  logoGlow: { marginBottom: 15, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.8, shadowRadius: 20, elevation: 10 },
  appTitle: { fontSize: 42, fontWeight: '900', letterSpacing: 6 },
  appSubtitle: { fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginTop: 5 },

  glassCard: { borderRadius: 24, padding: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  cardHeader: { marginBottom: 25 },
  welcomeText: { fontSize: 24, fontWeight: 'bold' },
  subWelcomeText: { fontSize: 14, marginTop: 4 },

  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, gap: 12 },
  textInput: { flex: 1, fontSize: 16, height: '100%' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244, 63, 94, 0.1)', padding: 10, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F43F5E' },
  errorText: { marginLeft: 8, fontSize: 13, flex: 1 },
  
  btnShadow: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5, marginTop: 10 },
  loginBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  linkText: { fontSize: 14 },

  registerContainer: { marginTop: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  noAccountText: { marginRight: 6 },
  registerLink: { fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 340, borderRadius: 24, borderWidth: 1, overflow: 'hidden', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20 },
  modalHeaderLine: { height: 4, width: '100%' },
  modalContent: { padding: 24, alignItems: 'center' },
  modalIconBox: { marginBottom: 16, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center', letterSpacing: 0.5 },
  modalMessage: { fontSize: 15, textAlign: 'center', marginBottom: 10, lineHeight: 22 },
});

export default LoginScreen;