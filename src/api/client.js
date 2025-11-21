// --- src/api/client.js ---

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- ¡IMPORTANTE! ---
// Esta es la IP de tu computadora en tu red Wi-Fi.
// (La obtuvimos de tu terminal de Expo la última vez).
const YOUR_COMPUTER_IP = '192.168.100.15';

// 1. Crea la instancia de Axios
const apiClient = axios.create({
  // Apunta a tu servidor de FastAPI (que corre en el puerto 8000)
  baseURL: `https://1b2a759f1f24.ngrok-free.app`,
});

// 2. El "Interceptor" Mágico
// Esto se ejecuta ANTES de CADA petición que haga tu app.
apiClient.interceptors.request.use(
  async (config) => {
    // 3. Revisa si hay un token guardado en el teléfono
    const token = await AsyncStorage.getItem('userToken');
    
    // 4. Si existe, lo añade a la cabecera 'Authorization'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Maneja errores de la petición
    return Promise.reject(error);
  }
);

export default apiClient;