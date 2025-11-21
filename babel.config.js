module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ¡HEMOS QUITADO 'react-native-reanimated/plugin'!
      // Si tienes otros plugins, déjalos aquí, pero asegúrate de borrar el de reanimated.
    ],
  };
};