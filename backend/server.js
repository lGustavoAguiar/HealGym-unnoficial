import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { connectTestDB } from './utils/testDatabase.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env com caminho específico
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  }
});
app.use(limiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const connectDatabase = async () => {
  try {
    // Se USE_MEMORY_DB estiver definida, sempre usar MongoDB em memória
    if (process.env.USE_MEMORY_DB === 'true') {
      console.log('🧠 Usando MongoDB Memory Server...');
      await connectTestDB();
    } else if (process.env.NODE_ENV === 'development' && process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('mongodb+srv')) {
      await connectTestDB();
    } else if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Conectado ao MongoDB');
    } else {
      // Fallback para MongoDB em memória se não houver MONGODB_URI
      console.log('⚠️ MONGODB_URI não encontrada, usando MongoDB em memória');
      await connectTestDB();
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    console.log('🔄 Tentando usar MongoDB em memória como fallback...');
    try {
      await connectTestDB();
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError);
      process.exit(1);
    }
  }
};

connectDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'HealGym API está funcionando!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Erro:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
