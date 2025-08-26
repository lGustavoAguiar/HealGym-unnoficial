import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';
  return jwt.sign(
    { userId },
    secret,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg);
    return res.status(400).json({
      error: errorMessages.join('; '),
      details: errors.array()
    });
  }
  next();
};

router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: 'E-mail já está em uso'
      });
    }

    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        profileSetupCompleted: user.profileSetupCompleted,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
], handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Tentativa de login para email:', email);

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('❌ Usuário não encontrado para email:', email);
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Conta desativada. Entre em contato com o suporte.'
      });
    }

    const isValidPassword = await user.comparePassword(password);
    console.log('🔐 Verificação de senha para', user.email, ':', isValidPassword ? 'SUCESSO' : 'FALHA');
    console.log('🔍 Hash da senha no banco:', user.password ? user.password.substring(0, 20) + '...' : 'VAZIO');
    console.log('🔍 Senha enviada:', password ? '[PRESENTE]' : '[VAZIA]');
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const token = generateToken(user._id);

    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        profileSetupCompleted: user.profileSetupCompleted,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.put('/profile', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido'),
  body('gender')
    .optional()
    .isIn(['masculino', 'feminino'])
    .withMessage('Gênero deve ser masculino ou feminino'),
  body('height')
    .optional()
    .isNumeric()
    .isFloat({ min: 100, max: 250 })
    .withMessage('Altura deve estar entre 100 e 250 cm'),
  body('weight')
    .optional()
    .isNumeric()
    .isFloat({ min: 30, max: 300 })
    .withMessage('Peso deve estar entre 30 e 300 kg'),
  body('bodyType')
    .optional()
    .isIn(['ectomorfo', 'mesomorfo', 'endomorfo'])
    .withMessage('Biotipo deve ser ectomorfo, mesomorfo ou endomorfo'),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, gender, height, weight, bodyType, newPassword } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    
    if (gender || height || weight || bodyType) {
      updateData.profile = {
        ...req.user.profile,
        ...(gender && { gender }),
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
        ...(bodyType && { bodyType })
      };
    }

    const user = await User.findById(userId);
    console.log('🔍 Usuário encontrado para atualização:', user ? user.email : 'NENHUM');
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    if (name) user.name = name;
    if (newPassword) {
      console.log('🔐 Alterando senha do usuário:', user.email);
      user.password = newPassword;
    }
    
    if (gender || height || weight || bodyType) {
      user.profile = {
        ...user.profile,
        ...(gender && { gender }),
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
        ...(bodyType && { bodyType })
      };
    }

    await user.save();

    console.log('✅ Perfil atualizado com sucesso para:', user.email);
    
    if (newPassword) {
      const testPassword = await user.comparePassword(newPassword);
      console.log('🧪 Teste imediato da nova senha:', testPassword ? 'PASSOU' : 'FALHOU');
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/change-password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
], handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId).select('+password');

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Senha atual incorreta'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/verify-token', authenticate, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log(`📧 Recebida solicitação de forgot-password para: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ Tentativa de recuperação para email não cadastrado: ${email}`);
      return res.status(404).json({
        error: 'E-mail não encontrado. Verifique se o e-mail está correto ou cadastre-se primeiro.'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Conta desativada. Entre em contato com o suporte.'
      });
    }


    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      const EmailService = (await import('../utils/email.js')).default;
      const result = await EmailService.sendPasswordResetEmail(user.email, resetToken);
      
      if (result.devMode) {
        console.log(`📤 [MODO DEV] Email simulado para: ${user.email}`);
        console.log(`⚠️ [MODO DEV] Erro de autenticação: ${result.authError}`);
        res.json({
          message: 'E-mail de recuperação enviado com sucesso!',
          devMode: true,
          note: 'Modo de desenvolvimento - configure as credenciais do Gmail para envio real'
        });
      } else {
        console.log(`✅ Email de recuperação enviado para: ${user.email}`);
        res.json({
          message: 'E-mail de recuperação enviado com sucesso!'
        });
      }
    } catch (emailError) {
      // Remover o token se falhou
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Erro ao enviar email de recuperação:', emailError);
      res.status(500).json({
        error: 'Erro ao enviar e-mail de recuperação. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});


router.post('/reset-password/:token', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirmação de senha não confere');
      }
      return true;
    })
], handleValidationErrors, async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log(`🔑 Recebido token para reset: ${token}`);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    console.log(`🔐 Token hasheado: ${hashedToken}`);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      console.log(`❌ Token inválido ou expirado: ${token.substring(0, 10)}...`);
      return res.status(400).json({
        error: 'Token de recuperação inválido ou expirado'
      });
    }

    console.log(`✅ Token válido para usuário: ${user.email}`);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log(`✅ Senha redefinida com sucesso para: ${user.email}`);

    res.json({
      message: 'Senha redefinida com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.get('/debug-user/:email', authenticate, async (req, res) => {
  try {
    const { email } = req.params;
    
    if (req.user.role !== 'admin' && req.user.email !== email) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      passwordStartsWith: user.password ? user.password.substring(0, 10) + '...' : null,
      profile: user.profile
    });
  } catch (error) {
    console.error('Erro no debug:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
