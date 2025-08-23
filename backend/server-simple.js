import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configurar dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Simple HealGym Backend...');
console.log('🔧 PORT:', PORT);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV || 'development');

// CORS completamente aberto
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers CORS manuais
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight request');
    res.sendStatus(200);
    return;
  }
  
  console.log(`📥 ${req.method} ${req.path} from origin: ${req.get('Origin') || 'no-origin'}`);
  next();
});

// Rotas básicas
app.get('/', (req, res) => {
  res.json({ 
    message: 'HealGym Backend is alive!', 
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'HealGym API is running', 
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de forgot-password simplificada para teste
app.post('/api/auth/forgot-password', (req, res) => {
  console.log('📧 Forgot password request received:', req.body);
  res.json({
    message: 'Forgot password endpoint is working!',
    received: req.body
  });
});

// Rota de reset-password simplificada para teste
app.post('/api/auth/reset-password/:token', (req, res) => {
  console.log('🔐 Reset password request received for token:', req.params.token);
  console.log('🔐 Body:', req.body);
  res.json({
    message: 'Reset password endpoint is working!',
    token: req.params.token,
    received: req.body
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 CORS: Completely open`);
});

export default app;
