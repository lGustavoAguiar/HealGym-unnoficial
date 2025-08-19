#!/usr/bin/env node

// Script para rodar o servidor com MongoDB em memória
// Uso: node dev-memory.js

process.env.USE_MEMORY_DB = 'true';
process.env.NODE_ENV = 'development';

// Se não há PORT definida, usar 5000
if (!process.env.PORT) {
  process.env.PORT = '5000';
}

console.log('🚀 Iniciando HealGym Backend com MongoDB em memória...');
console.log('📍 Configurações:');
console.log(`   - PORT: ${process.env.PORT}`);
console.log(`   - MongoDB: Em memória (Memory Server)`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
console.log('');

// Importar e executar o servidor
import('./server.js').catch(error => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});
