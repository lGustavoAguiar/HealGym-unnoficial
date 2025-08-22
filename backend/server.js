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

app.use(helmet());

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Muitas tentativas. Tente novamente em alguns minutos.'
  }
});
app.use(limiter);

// Configuração CORS mais permissiva para produção
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (como Postman, aplicativos móveis)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://healgym-frontend.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost'
    ];
    
    // Em produção, ser mais permissivo se necessário
    if (process.env.NODE_ENV === 'production') {
      // Permitir qualquer subdomínio do onrender.com temporariamente para debug
      if (origin.includes('onrender.com')) {
        console.log(`✅ Allowing onrender.com origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    console.log(`🌐 CORS check for origin: ${origin}`);
    console.log(`🌐 Allowed origins:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ Origin ${origin} allowed`);
      return callback(null, true);
    } else {
      console.log(`❌ Origin ${origin} not allowed`);
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
