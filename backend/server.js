import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🚀 Starting HealGym Backend...');
console.log('📍 Current directory:', __dirname);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('🔧 PORT:', PORT);

const app = express();
const PORT = process.env.PORT || 5000;

// Desabilitar helmet temporariamente para debug
// app.use(helmet({
//   crossOriginResourcePolicy: false,
//   crossOriginEmbedderPolicy: false
// }));

console.log('🔧 Helmet desabilitado para debug');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Aumentei temporariamente
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  },
  skip: (req) => {
    // Pular rate limiting para OPTIONS (preflight)
    return req.method === 'OPTIONS';
  }
});
app.use(limiter);

// Configuração CORS completamente aberta para debug
const corsOptions = {
  origin: '*', // Temporariamente permitir todas as origens
  credentials: false, // Desabilitar credentials temporariamente
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

console.log('🔧 CORS configurado como permissivo para debug');

app.use(cors(corsOptions));

// Adicionar headers CORS manualmente como fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight request');
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Middleware de debug para CORS
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} from origin: ${req.get('Origin') || 'no-origin'}`);
  console.log(`📥 Headers:`, {
    origin: req.get('Origin'),
    'access-control-request-method': req.get('Access-Control-Request-Method'),
    'access-control-request-headers': req.get('Access-Control-Request-Headers')
  });
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.warn('⚠️  MONGODB_URI not configured. Skipping database connection for now.');
      // Em vez de sair, vamos continuar sem database para debug
      return;
    }
    
    console.log('🔌 Attempting to connect to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Em vez de process.exit(1), vamos continuar para debug
    console.warn('⚠️  Continuing without database connection for debugging...');
  }
};

connectDatabase();

// Endpoint de teste simples
app.get('/', (req, res) => {
  res.json({ 
    message: 'HealGym Backend is alive!', 
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'HealGym API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

app.use((error, req, res, next) => {
  console.error('❌ Error caught by middleware:', error.message);
  console.error('❌ Stack:', error.stack);
  
  // Não crashar o servidor, sempre retornar uma resposta
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 CORS: Completamente aberto para debug`);
  console.log(`🔧 Helmet: Desabilitado para debug`);
  console.log(`📧 Frontend URL: ${process.env.FRONTEND_URL || 'não definida'}`);
});

export default app;
