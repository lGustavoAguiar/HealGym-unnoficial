import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import { connectTestDB } from './utils/testDatabase.js';

dotenv.config();

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

if (process.env.NODE_ENV === 'development') {
  app.use(express.static('public'));
}

const connectDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI.includes('mongodb+srv')) {
      await connectTestDB();
    } else {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healgym');
      console.log('✅ Conectado ao MongoDB');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

connectDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

import User from './models/User.js';

if (process.env.NODE_ENV === 'development') {
  app.get('/api/debug/users', async (req, res) => {
    try {
      const users = await User.find({}).select('-password');
      res.json({
        total: users.length,
        users: users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erro ao buscar usuários', 
        error: error.message 
      });
    }
  });

  app.delete('/api/debug/users', async (req, res) => {
    try {
      const result = await User.deleteMany({});
      res.json({ 
        message: 'Todos os usuários foram removidos',
        deletedCount: result.deletedCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erro ao remover usuários', 
        error: error.message 
      });
    }
  });

  app.get('/api/debug/stats', async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const adminUsers = await User.countDocuments({ role: 'admin' });
      
      const recentUsers = await User.find({})
        .select('name email createdAt')
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        statistics: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          adminUsers,
          regularUsers: totalUsers - adminUsers
        },
        recentUsers,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Erro ao buscar estatísticas', 
        error: error.message 
      });
    }
  });
}

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
