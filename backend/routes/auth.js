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
        createdAt: user.createdAt
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

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
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
        lastLogin: user.lastLogin
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
    .withMessage('E-mail inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, email, profile } = req.body;
    const userId = req.user._id;

    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          error: 'E-mail já está em uso'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (profile) updateData.profile = { ...req.user.profile, ...profile };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

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
      await EmailService.sendPasswordResetEmail(user.email, resetToken);
      
      console.log(`✅ Email de recuperação enviado para: ${user.email}`);
      res.json({
        message: 'E-mail de recuperação enviado com sucesso!'
      });
    } catch (emailError) {

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

export default router;
