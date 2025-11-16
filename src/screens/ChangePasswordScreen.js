// --- src/screens/ChangePasswordScreen.js ---

import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, 
  StyleSheet, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import apiClient from '../api/client';
import { useNavigation, useTheme } from '@react-navigation/native';

const ChangePasswordScreen = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation();
  const { colors } = useTheme();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las nuevas contraseñas no coinciden.');
      return;
    }
    if (!oldPassword || !newPassword) {
      Alert.alert('Error', 'Por favor, rellena todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      // Llama al endpoint PUT /users/me/change-password
      const response = await apiClient.put('/users/me/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      
      Alert.alert(
        'Éxito', 
        response.data.detail,
        [{ text: 'OK', onPress: () => navigation.goBack() }] // Regresa a "Mi Cuenta"
      );

    } catch (error) {
      console.error(error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo cambiar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="always"
      >
        <Text style={[styles.title, { color: colors.text }]}>Cambiar Contraseña</Text>
        
        <Text style={[styles.label, { color: colors.text }]}>Contraseña Actual:</Text>
        <TextInput 
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} 
            secureTextEntry 
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholder="Tu contraseña actual"
            placeholderTextColor="#999"
        />
        
        <Text style={[styles.label, { color: colors.text }]}>Nueva Contraseña:</Text>
        <TextInput 
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} 
            secureTextEntry 
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 4 caracteres"
            placeholderTextColor="#999"
        />
        
        <Text style={[styles.label, { color: colors.text }]}>Confirmar Nueva Contraseña:</Text>
        <TextInput 
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]} 
            secureTextEntry 
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite la nueva contraseña"
            placeholderTextColor="#999"
        />

        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button title="Guardar Contraseña" onPress={handleChangePassword} color={colors.primary} />
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 40 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center'
  },
  label: { 
    fontSize: 16, 
    marginBottom: 8, 
    marginLeft: 5,
    fontWeight: '500'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 50,
  }
});

export default ChangePasswordScreen;