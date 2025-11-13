// --- src/screens/LoginScreen.js ---

import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, ActivityIndicator } from 'react-native';
import apiClient from '../api/client'; // Importa tu cliente Axios
import { useNavigation } from '@react-navigation/native'; // Para ir a Registro
import { useAuth } from '../context/AuthContext'; // ¡Importa el hook de Autenticación!

const LoginScreen = () => {
  const [email, setEmail] = useState(''); // 'username' para el form
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();
  const { signIn } = useAuth(); // ¡Obtiene la función signIn del Contexto!

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos vacíos', 'Por favor, ingresa tu email y contraseña.');
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Prepara los datos para el form-data
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      // 2. Llama a tu endpoint de API
      const response = await apiClient.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // 3. ¡Éxito! Obtén el token
      const { access_token } = response.data;

      // 4. ¡GUARDA EL TOKEN y CAMBIA DE PANTALLA!
      // Esta función (de App.js) guardará el token Y
      // actualizará el estado de la app para mostrar el Dashboard.
      signIn(access_token);

    } catch (error) {
      console.error('Error en Login:', error.response?.data || error.message);
      Alert.alert('Error', 'Correo electrónico o contraseña incorrectos.');
      setIsLoading(false); // Asegúrate de detener la carga en caso de error
    } 
    // No 'finally' aquí, 'signIn' cambia el estado y 'isLoading' no importa ya
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Email (username)"
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
        onSubmitEditing={handleLogin} // Permite iniciar sesión con 'Enter'
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button 
          title="Iniciar Sesión" 
          onPress={handleLogin} 
        />
      )}

      <Button 
        title="¿No tienes cuenta? Regístrate"
        onPress={() => navigation.navigate('Register')} // Botón para ir a la otra pantalla
        color="#888"
      />
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

export default LoginScreen;