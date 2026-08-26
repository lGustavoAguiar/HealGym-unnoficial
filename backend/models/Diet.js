import mongoose from 'mongoose';

const dietSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  objetivo: {
    type: String,
    enum: ['emagrecimento', 'ganho_peso', 'manutencao'],
    required: true,
  },
  targetCalories: {
    type: Number,
    required: true,
  },
  targetProtein: {
    type: Number,
    required: true,
  },
  targetCarbs: {
    type: Number,
    required: true,
  },
  targetFat: {
    type: Number,
    required: true,
  },
  mealPlan: [
    {
      nome: String,
      horario: String,
      alimentos: [
        {
          id: String,
          nome: String,
          porcao: Number,
          unidade: String,
          nutrition: {
            fdcId: Number,
            nome: String,
            calorias: Number,
            proteinas: Number,
            carboidratos: Number,
            gorduras: Number,
            fibras: Number,
            calcio: Number,
            ferro: Number,
            magnesio: Number,
            fosforo: Number,
            potassio: Number,
            sodio: Number,
            zinco: Number,
            vitaminaA: Number,
            vitaminaC: Number,
            vitaminaD: Number,
            vitaminaE: Number,
            vitaminaB12: Number,
            folato: Number,
            gorduraSaturada: Number,
            gorduraMonoinsaturada: Number,
            gorduraPoliinsaturada: Number,
            colesterol: Number,
          },
        },
      ],
    },
  ],
  preferencias: [String],
  orcamento: Number, // Para implementação futura
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Índice para buscar dietas por usuário
dietSchema.index({ user: 1, createdAt: -1 });

const Diet = mongoose.model('Diet', dietSchema);

export default Diet;
