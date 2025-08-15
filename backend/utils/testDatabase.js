import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod = null;

export const connectTestDB = async () => {
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri);
    console.log('✅ Conectado ao MongoDB em memória');
    console.log(`📍 URI: ${uri}`);
    
    return uri;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB em memória:', error);
    throw error;
  }
};

export const disconnectTestDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('📋 MongoDB em memória desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar do MongoDB em memória:', error);
  }
};

export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    console.log('🧹 Base de dados limpa');
  } catch (error) {
    console.error('❌ Erro ao limpar base de dados:', error);
  }
};
