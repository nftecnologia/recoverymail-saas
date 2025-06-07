// Proxy serverless function para Vercel que redireciona para o backend Express
const path = require('path');

// Importar o app Express do backend compilado
let app;

async function getApp() {
  if (!app) {
    try {
      // Carregar o app Express do backend (TypeScript compilado)
      const serverModule = require('../backend/dist/server.js');
      
      // O app pode estar como default export ou named export
      app = serverModule.default || serverModule.app || serverModule;
      
      console.log('App Express carregado com sucesso');
    } catch (error) {
      console.error('Erro ao carregar app Express:', error);
      throw error;
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const expressApp = await getApp();
    
    // Garantir que o app é uma função
    if (typeof expressApp !== 'function') {
      throw new Error('App Express não é uma função válida');
    }
    
    return expressApp(req, res);
  } catch (error) {
    console.error('Erro na função serverless:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
