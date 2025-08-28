import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'E-mail é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, insira um e-mail válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  accountDeletionToken: {
    type: String,
    select: false
  },
  accountDeletionExpires: {
    type: Date,
    select: false
  },
  profile: {
    avatar: String,
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['masculino', 'feminino']
    },
    height: {
      type: Number,
      min: [100, 'Altura deve ser pelo menos 100 cm'],
      max: [250, 'Altura deve ser no máximo 250 cm']
    },
    weight: {
      type: Number,
      min: [30, 'Peso deve ser pelo menos 30 kg'],
      max: [300, 'Peso deve ser no máximo 300 kg']
    },
    bodyType: {
      type: String,
      enum: ['ectomorfo', 'mesomorfo', 'endomorfo']
    },
    goals: [String],
    fitnessLevel: {
      type: String,
      enum: ['iniciante', 'intermediario', 'avancado']
    }
  },
  profileSetupCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  
  return resetToken;
};

userSchema.methods.validatePasswordResetToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.passwordResetToken === hashedToken && 
         this.passwordResetExpires > Date.now();
};

userSchema.methods.createAccountDeletionToken = function() {
  const deletionToken = crypto.randomBytes(32).toString('hex');
  
  this.accountDeletionToken = crypto
    .createHash('sha256')
    .update(deletionToken)
    .digest('hex');
  
  this.accountDeletionExpires = Date.now() + 30 * 60 * 1000;
  
  return deletionToken;
};

userSchema.methods.validateAccountDeletionToken = function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
    
  return this.accountDeletionToken === hashedToken && 
         this.accountDeletionExpires > Date.now();
};

userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

export default User;
