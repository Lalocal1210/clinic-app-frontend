// --- src/screens/UserListScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, TouchableOpacity, Alert 
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; 
import { useIsFocused, useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; // Usaremos el Picker para cambiar roles

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  // 1. Carga la lista de TODOS los usuarios
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Llama al endpoint de Admin
      const response = await apiClient.get('/admin/users'); 
      setUsers(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert('Error', 'No tienes permisos para ver esta sección.');
        signOut();
      } else {
        Alert.alert('Error', 'No se pudieron cargar los usuarios.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchUsers();
    }
  }, [isFocused]);

  // 2. Lógica para CAMBIAR EL ROL
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      // Llama al endpoint de Admin para actualizar el rol
      await apiClient.put(`/admin/users/${userId}/role`, {
        role_id: newRoleId
      });
      
      Alert.alert('Éxito', 'Rol actualizado correctamente.');
      
      // Actualiza la lista localmente para ver el cambio al instante
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: { ...user.role, id: newRoleId } } : user
        )
      );
      // Opcional: podrías volver a llamar a fetchUsers()
      
    } catch (error) {
      console.error("Error al cambiar rol:", error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar el rol.');
    }
  };

  // 3. Muestra "Cargando..."
  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 4. Componente para renderizar cada usuario
  const renderUserItem = ({ item }) => (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      <View style={styles.infoContainer}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.full_name}</Text>
        <Text style={[styles.itemSubtitle, { color: colors.text, opacity: 0.7 }]}>{item.email}</Text>
      </View>
      <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
        <Picker
          selectedValue={item.role.id}
          // Al cambiar el valor, llama a la API
          onValueChange={(itemValue) => handleRoleChange(item.id, itemValue)}
          style={{ color: colors.text, height: 50, width: 150 }}
          dropdownIconColor={colors.text}
        >
          {/* Asumimos los IDs estándar. Deberíamos cargar esto desde la API. */}
          <Picker.Item label="Admin" value={1} />
          <Picker.Item label="Médico" value={2} />
          <Picker.Item label="Paciente" value={3} />
        </Picker>
      </View>
    </View>
  );

  // 5. Muestra la lista de usuarios
  return (
    <FlatList
      data={users}
      renderItem={renderUserItem}
      keyExtractor={(item) => item.id.toString()}
      style={[styles.container, { backgroundColor: colors.background }]}
      ListEmptyComponent={
        <Text style={[styles.emptyText, { color: colors.text }]}>No se encontraron usuarios.</Text>
      }
      refreshing={isLoading}
      onRefresh={fetchUsers}
    />
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  infoContainer: {
    flex: 1, // Permite que el texto se acorte si es necesario
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginLeft: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  }
});

export default UserListScreen;