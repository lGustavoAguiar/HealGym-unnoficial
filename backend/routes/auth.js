import express from 'express';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { createProfileValidationRules } from '../validators/profile.js';

const router = express.Router();
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

const passwordRecoveryRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas solicitações de recuperação. Tente novamente em alguns minutos.' },
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de redefinição. Tente novamente em alguns minutos.' },
});

const PASSWORD_RECOVERY_RESPONSE = {
  message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.',
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
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

router.post('/register', authenticationLimiter, [
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
    .matches(STRONG_PASSWORD_PATTERN)
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

router.post('/login', authenticationLimiter, [
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
  ...createProfileValidationRules({ optional: true }),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage('Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, gender, height, weight, bodyType, age, newPassword } = req.body;
    const userId = req.user._id;



    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }
    
    if (name) user.name = name;
    if (newPassword) {
      user.password = newPassword;
    }
    
    if (gender || height || weight || bodyType || age) {
      user.profile = {
        ...user.profile,
        ...(gender && { gender }),
        ...(height && { height: parseFloat(height) }),
        ...(weight && { weight: parseFloat(weight) }),
        ...(bodyType && { bodyType })
      };

      if (age) {
        const currentYear = new Date().getFullYear();
        const birthYear = currentYear - parseInt(age);
        const dateOfBirth = new Date(birthYear, 0, 1);
        user.profile.dateOfBirth = dateOfBirth;
      }
    }

    await user.save();

    res.json({
      message: 'Perfil atualizado com sucesso',
      user
    });
  } catch {
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
    .matches(STRONG_PASSWORD_PATTERN)
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

router.post('/forgot-password', passwordRecoveryRequestLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('E-mail inválido')
], handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.json(PASSWORD_RECOVERY_RESPONSE);
    }


    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      const EmailService = (await import('../utils/emailSendGrid.js')).default;
      await EmailService.sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      // Remover o token se falhou
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Erro ao enviar email de recuperação:', emailError);
    }

    return res.json(PASSWORD_RECOVERY_RESPONSE);
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});


router.post('/reset-password/:token', passwordResetLimiter, [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(STRONG_PASSWORD_PATTERN)
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

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        error: 'Token de recuperação inválido ou expirado'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

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

router.post('/request-account-deletion', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        error: 'Conta já está desativada'
      });
    }

    // Criar token de exclusão
    const deletionToken = user.createAccountDeletionToken();
    await user.save({ validateBeforeSave: false });

    try {
      const EmailService = (await import('../utils/emailSendGrid.js')).default;
      const result = await EmailService.sendAccountDeletionEmail(user.email, deletionToken);
      
      if (result.devMode) {
        res.json({
          message: 'E-mail de confirmação de exclusão enviado com sucesso!',
          devMode: true,
          note: 'Modo de desenvolvimento - use o link exibido no terminal ou configure o SendGrid'
        });
      } else {
        res.json({
          message: 'E-mail de confirmação de exclusão enviado com sucesso! Verifique sua caixa de entrada.'
        });
      }
    } catch (emailError) {
      // Remover o token se falhou
      user.accountDeletionToken = undefined;
      user.accountDeletionExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error('Erro ao enviar email de confirmação de exclusão:', emailError);
      res.status(500).json({
        error: 'Erro ao enviar e-mail de confirmação. Tente novamente.'
      });
    }
  } catch (error) {
    console.error('Erro na solicitação de exclusão de conta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.post('/confirm-account-deletion/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      accountDeletionToken: hashedToken,
      accountDeletionExpires: { $gt: Date.now() }
    }).select('+accountDeletionToken +accountDeletionExpires');

    if (!user) {
      return res.status(400).json({
        error: 'Token de confirmação inválido ou expirado'
      });
    }

    // Excluir o usuário permanentemente
    await User.findByIdAndDelete(user._id);

    res.json({
      message: 'Conta excluída com sucesso. Sentiremos sua falta!'
    });
  } catch (error) {
    console.error('Erro ao confirmar exclusão de conta:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
