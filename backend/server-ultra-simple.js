const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Ultra Simple Backend Starting...');
console.log('🔧 PORT:', PORT);

// CORS completamente aberto
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

// Body parser
app.use(express.json());

// Headers CORS manuais
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 OPTIONS request');
    return res.sendStatus(200);
  }
  
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Rotas
app.get('/', (req, res) => {
  console.log('📍 Root endpoint accessed');
  res.json({ 
    message: 'HealGym Backend is ALIVE!', 
    timestamp: new Date().toISOString(),
    status: 'working'
  });
});

app.get('/api/health', (req, res) => {
  console.log('📍 Health endpoint accessed');
  res.json({ 
    message: 'API Health OK', 
    timestamp: new Date().toISOString() 
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  console.log('📧 Forgot password:', req.body);
  res.json({
    message: 'Forgot password working!',
    email: req.body.email
  });
});

app.post('/api/auth/reset-password/:token', (req, res) => {
  console.log('🔐 Reset password:', req.params.token, req.body);
  res.json({
    message: 'Reset password working!',
    token: req.params.token
  });
});

app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: '404 - Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Listening on all interfaces`);
});

module.exports = app;
