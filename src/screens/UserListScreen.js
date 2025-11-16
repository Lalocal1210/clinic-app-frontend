// --- src/screens/UserListScreen.js ---

import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, 
  ActivityIndicator, TouchableOpacity, Alert, Button, Switch
} from 'react-native';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext'; // ¡IMPORTACIÓN CORREGIDA!
import { useIsFocused, useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; // Usaremos el Picker para cambiar roles

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obtenemos el ID del propio admin para no mostrar el botón de borrar
  const [myUserId, setMyUserId] = useState(null); 
  
  const { signOut } = useAuth(); 
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  // 1. Carga la lista de TODOS los usuarios
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Pedimos la lista de usuarios y nuestro propio perfil (para saber quiénes somos)
      const [usersResponse, meResponse] = await Promise.all([
        apiClient.get('/admin/users'),
        apiClient.get('/users/me') // Para obtener nuestro propio ID
      ]);
      
      setUsers(usersResponse.data);
      setMyUserId(meResponse.data.id); // Guardamos nuestro propio ID

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
  }, [isFocused]); // Dependencia clave

  // 2. Lógica para CAMBIAR EL ROL
  const handleRoleChange = async (userId, newRoleId) => {
    try {
      // Llama al endpoint de Admin para actualizar el rol
      const response = await apiClient.put(`/admin/users/${userId}/role`, {
        role_id: newRoleId
      });
      
      Alert.alert('Éxito', 'Rol actualizado correctamente.');
      
      // Actualiza la lista localmente para ver el cambio al instante
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? response.data : user // Actualiza con la respuesta
        )
      );
      
    } catch (error) {
      console.error("Error al cambiar rol:", error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo actualizar el rol.');
      fetchUsers(); // Recarga la lista si hay error
    }
  };
  
  // 3. Lógica para DESACTIVAR/ACTIVAR
  const handleToggleActive = async (userId, newStatus) => {
    try {
        await apiClient.patch(`/admin/users/${userId}/status`, { is_active: newStatus });
        Alert.alert('Éxito', `Usuario ${newStatus ? 'reactivado' : 'desactivado'}.`);
        // Actualiza el estado local
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, is_active: newStatus } : user
          )
        );
    } catch (error) {
        console.error("Error al cambiar estado:", error.response?.data);
        Alert.alert('Error', error.response?.data?.detail || 'No se pudo cambiar el estado.');
    }
  };

  // 4. Lógica para BORRAR USUARIO
  const handleDeleteUser = (userId, userName) => {
    Alert.alert(
      "Borrar Usuario",
      `¿Estás seguro de que quieres eliminar permanentemente a ${userName}? Esta acción no se puede deshacer.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Llama al nuevo endpoint DELETE de la API
              await apiClient.delete(`/admin/users/${userId}`);
              Alert.alert('Éxito', `${userName} ha sido eliminado.`);
              fetchUsers(); // Recarga la lista
            } catch (error) {
              console.error("Error al eliminar:", error.response?.data);
              Alert.alert('Error', error.response?.data?.detail || 'No se pudo eliminar al usuario.');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 5. Componente para renderizar cada usuario
  const renderUserItem = ({ item }) => {
    // Verificamos si este item es el admin logueado
    const isMe = item.id === myUserId; 

    return (
      <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
        <View style={styles.infoContainer}>
          <Text style={[styles.itemTitle, { color: colors.text, opacity: item.is_active ? 1 : 0.5 }]}>
            {item.full_name}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.text, opacity: item.is_active ? 0.7 : 0.4 }]}>
            {item.email}
          </Text>
          
          <View style={styles.buttonRow}>
            {/* --- Switch para Activar/Desactivar --- */}
            <View style={styles.switchContainer}>
              <Text style={{ color: colors.text, opacity: 0.7 }}>Activo:</Text>
              <Switch
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={colors.primary}
                onValueChange={(newValue) => handleToggleActive(item.id, newValue)}
                value={item.is_active}
                disabled={isMe} // No te puedes desactivar a ti mismo
              />
            </View>
            
            {/* --- Botón de Borrar (Oculto si es el admin mismo) --- */}
            {!isMe && ( 
              <Button 
                title="Borrar" 
                color="#e63946" // Rojo peligro
                onPress={() => handleDeleteUser(item.id, item.full_name)} 
              />
            )}
          </View>
        </View>
        
        {/* Selector de Rol */}
        <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Picker
            selectedValue={item.role.id}
            onValueChange={(itemValue) => handleRoleChange(item.id, itemValue)}
            style={{ color: colors.text, height: 50, width: 150 }}
            dropdownIconColor={colors.text}
            // Deshabilita el picker si es el admin mismo
            enabled={!isMe} 
          >
            {/* Estos IDs (1, 2, 3) deben coincidir con tu BBDD */}
            <Picker.Item label="Admin" value={1} />
            <Picker.Item label="Médico" value={2} />
            <Picker.Item label="Paciente" value={3} />
          </Picker>
        </View>
      </View>
    );
  };

  // 6. Muestra la lista de usuarios
  return (
    <FlatList
      data={users}
      renderItem={renderUserItem}
      keyExtractor={(item) => item.id.toString()}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
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
    marginVertical: 6,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContainer: {
    flex: 1, // Permite que el texto se acorte
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 14,
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    opacity: 0.6,
  }
});

export default UserListScreen;