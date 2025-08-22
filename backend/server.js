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
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not configured');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDatabase();

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
  console.error('Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid data',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error'
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
