import mongoose from 'mongoose';

export const WORKOUT_GROUPS = [
  'PEITO',
  'COSTAS',
  'OMBROS',
  'TRICEPS',
  'BICEPS',
  'PERNAS',
  'PEITO_TRICEPS',
  'COSTAS_BICEPS',
  'PERNAS_OMBROS',
  'OMBROS_BRACOS',
  'FULL_BODY',
];

const exercicioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  porcaoMuscular: {
    type: String,
    required: true
  },
  series: {
    type: Number,
    required: true
  },
  repeticoes: {
    type: String,
    required: true
  },
  descanso: {
    type: String,
    required: true
  },
  tecnica: {
    type: String,
    required: true
  },
  equipamento: {
    type: [String],
    required: true
  }
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  titulo: {
    type: String,
    required: true
  },
  grupamento: {
    type: String,
    required: true,
    enum: WORKOUT_GROUPS
  },
  objetivo: {
    type: String,
    required: true
  },
  tempoDisponivel: {
    type: Number,
    required: true,
    min: 30,
    max: 120
  },
  exercicios: [exercicioSchema],
  resumo: {
    type: String,
    required: true
  },
  realizado: {
    type: Boolean,
    default: false
  },
  dataRealizacao: {
    type: Date
  }
}, {
  timestamps: true
});

// Índice para buscar treinos do usuário ordenados por data
workoutSchema.index({ user: 1, createdAt: -1 });

// Método para marcar treino como realizado
workoutSchema.methods.marcarComoRealizado = function() {
  this.realizado = true;
  this.dataRealizacao = new Date();
  return this.save();
};

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;
