// --- src/screens/RegisterScreen.js ---

import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import apiClient from '../api/client'; // Importa tu cliente Axios
import { useNavigation } from '@react-navigation/native';

const RegisterScreen = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Campos vacíos', 'Por favor, rellena todos los campos.');
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Prepara el JSON (como pide tu API de registro)
      const userData = {
        full_name: fullName,
        email: email,
        password: password,
        phone: '' // El teléfono es opcional
      };

      // 2. Llama a tu endpoint de API
      await apiClient.post('/auth/register', userData);

      // 3. ¡Éxito!
      Alert.alert(
        'Registro Exitoso',
        'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.'
      );
      navigation.navigate('Login'); // Envía al usuario de vuelta al Login

    } catch (error) {
      console.error('Error en Registro:', error.response?.data || error.message);
      // Tu API envía un 'detail' en el error 409
      const errorMsg = error.response?.data?.detail || 'Ese email ya está registrado o los datos son inválidos.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      <TextInput 
        style={styles.input}
        placeholder="Nombre Completo" 
        value={fullName} 
        onChangeText={setFullName} 
        returnKeyType="next"
      />
      <TextInput 
        style={styles.input}
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail} 
        autoCapitalize="none" 
        keyboardType="email-address"
        returnKeyType="next"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        returnKeyType="go"
        onSubmitEditing={handleRegister}
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button 
          title="Registrarse" 
          onPress={handleRegister} 
        />
      )}
    </View>
  );
};

// Estilos básicos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingLeft: 15,
    fontSize: 16,
  },
});

export default RegisterScreen;