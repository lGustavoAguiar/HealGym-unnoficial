import express from 'express';
import axios from 'axios';
import { authenticate } from '../middleware/auth.js';
import Diet from '../models/Diet.js';

const router = express.Router();

// USDA FoodData Central API
const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Mapeamento de alimentos comuns em português para FDC IDs da USDA
const FOOD_DATABASE = {
  // Alimentos principais da dieta
  'arroz_branco': { fdcId: 168878, nome: 'Arroz Branco Cozido', categoria: 'carboidrato', unidade: 'g' },
  'feijao': { fdcId: 173735, nome: 'Feijão Cozido', categoria: 'carboidrato', unidade: 'g' },
  'frango_peito': { fdcId: 171477, nome: 'Peito de Frango Grelhado', categoria: 'proteina', unidade: 'g' },
  'ovo': { fdcId: 173424, nome: 'Ovo Cozido', categoria: 'proteina', unidade: 'unidade' },
  'azeite': { fdcId: 171413, nome: 'Azeite de Oliva Extra Virgem', categoria: 'gordura', unidade: 'ml' },
};

// Cache para armazenar dados nutricionais (evitar requisições repetidas)
const nutritionCache = new Map();

/**
 * Busca informações nutricionais detalhadas de um alimento na API USDA
 */
async function fetchNutritionData(fdcId) {
  // Verifica cache primeiro
  if (nutritionCache.has(fdcId)) {
    return nutritionCache.get(fdcId);
  }

  try {
    const response = await axios.get(`${USDA_BASE_URL}/food/${fdcId}`, {
      params: { api_key: USDA_API_KEY }
    });

    const foodData = response.data;
    const nutrients = {};

    // Mapeia os nutrientes da USDA para o formato simplificado
    const nutrientMap = {
      1008: 'calorias',        // Energy (kcal)
      1003: 'proteinas',       // Protein
      1005: 'carboidratos',    // Carbohydrate
      1004: 'gorduras',        // Total lipid (fat)
      1079: 'fibras',          // Fiber, total dietary
      1087: 'calcio',          // Calcium, Ca
      1089: 'ferro',           // Iron, Fe
      1090: 'magnesio',        // Magnesium, Mg
      1091: 'fosforo',         // Phosphorus, P
      1092: 'potassio',        // Potassium, K
      1093: 'sodio',           // Sodium, Na
      1095: 'zinco',           // Zinc, Zn
      1106: 'vitaminaA',       // Vitamin A, RAE
      1162: 'vitaminaC',       // Vitamin C
      1114: 'vitaminaD',       // Vitamin D
      1109: 'vitaminaE',       // Vitamin E
      1178: 'vitaminaB12',     // Vitamin B-12
      1177: 'folato',          // Folate, total
      1258: 'gorduraSaturada', // Fatty acids, total saturated
      1292: 'gorduraMonoinsaturada', // Fatty acids, total monounsaturated
      1293: 'gorduraPoliinsaturada', // Fatty acids, total polyunsaturated
      1253: 'colesterol',      // Cholesterol
    };

    // Extrai os nutrientes
    if (foodData.foodNutrients) {
      foodData.foodNutrients.forEach(nutrient => {
        const nutrientId = nutrient.nutrient?.id;
        const mappedName = nutrientMap[nutrientId];
        if (mappedName) {
          nutrients[mappedName] = parseFloat(nutrient.amount || 0);
        }
      });
    }

    const nutritionData = {
      fdcId: foodData.fdcId,
      nome: foodData.description,
      ...nutrients
    };

    // Armazena no cache
    nutritionCache.set(fdcId, nutritionData);

    return nutritionData;
  } catch (error) {
    console.error(`Erro ao buscar dados nutricionais do FDC ID ${fdcId}:`, error.message);
    throw new Error('Não foi possível buscar informações nutricionais');
  }
}

/**
 * GET /api/nutrition/foods
 * Lista todos os alimentos disponíveis
 */
router.get('/foods', authenticate, async (req, res) => {
  try {
    const foodList = Object.entries(FOOD_DATABASE).map(([key, value]) => ({
      id: key,
      nome: value.nome,
      categoria: value.categoria,
      unidade: value.unidade
    }));

    res.json({
      success: true,
      foods: foodList
    });
  } catch (error) {
    console.error('Erro ao listar alimentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar alimentos'
    });
  }
});

/**
 * GET /api/nutrition/food/:foodId
 * Busca informações nutricionais detalhadas de um alimento específico
 */
router.get('/food/:foodId', authenticate, async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = FOOD_DATABASE[foodId];

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Alimento não encontrado'
      });
    }

    const nutritionData = await fetchNutritionData(food.fdcId);

    res.json({
      success: true,
      food: {
        id: foodId,
        ...food,
        nutrition: nutritionData
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alimento:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao buscar informações nutricionais'
    });
  }
});

/**
 * POST /api/nutrition/search
 * Busca alimentos na API USDA por termo
 */
router.post('/search', authenticate, async (req, res) => {
  try {
    const { query, pageSize = 10 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Termo de busca é obrigatório'
      });
    }

    const response = await axios.get(`${USDA_BASE_URL}/foods/search`, {
      params: {
        api_key: USDA_API_KEY,
        query: query,
        pageSize: pageSize
      }
    });

    const foods = response.data.foods.map(food => ({
      fdcId: food.fdcId,
      nome: food.description,
      brandOwner: food.brandOwner,
      dataType: food.dataType
    }));

    res.json({
      success: true,
      foods: foods,
      totalResults: response.data.totalHits
    });
  } catch (error) {
    console.error('Erro ao buscar alimentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar alimentos'
    });
  }
});

/**
 * POST /api/nutrition/generate-diet
 * Gera uma dieta personalizada com informações nutricionais detalhadas
 */
router.post('/generate-diet', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      targetCalories, 
      objetivo,
      weight, // peso em kg
      refeicoesPorDia = 4,
      preferencias = [] 
    } = req.body;

    if (!targetCalories || !objetivo || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Calorias alvo, objetivo e peso são obrigatórios'
      });
    }

    // CÁLCULO CORRETO DOS MACROS - REGRA FIXA
    // 1. Proteína: 2g por kg de peso corporal
    const targetProtein = weight * 2;
    
    // 2. Gordura: 1g por kg de peso corporal
    const targetFat = weight * 1;
    
    // 3. Carboidratos: resto das calorias para bater o TMB
    const caloriasProteina = targetProtein * 4; // 4 cal/g
    const caloriasGordura = targetFat * 9;      // 9 cal/g
    const caloriasRestantes = targetCalories - caloriasProteina - caloriasGordura;
    const targetCarbs = Math.max(0, caloriasRestantes / 4); // resto em carboidratos
    
    // Validar se as contas batem
    const totalCaloriasCalculadas = (targetProtein * 4) + (targetCarbs * 4) + (targetFat * 9);
    
    console.log('🎯 CÁLCULO DE MACROS - REGRA FIXA:');
    console.log(`   Peso: ${weight}kg`);
    console.log(`   TMB/Calorias Alvo: ${targetCalories} kcal`);
    console.log('');
    console.log(`   Proteína: ${weight}kg × 2 = ${targetProtein}g → ${targetProtein * 4} kcal`);
    console.log(`   Gordura: ${weight}kg × 1 = ${targetFat}g → ${targetFat * 9} kcal`);
    console.log(`   Carboidratos (resto): ${Math.round(targetCarbs)}g → ${Math.round(targetCarbs * 4)} kcal`);
    console.log('');
    console.log(`   ✅ Total Calculado: ${Math.round(totalCaloriasCalculadas)} kcal`);
    console.log(`   ✅ Diferença: ${Math.round(totalCaloriasCalculadas - targetCalories)} kcal`);
    console.log('');

    // Gera o plano de refeições
    const mealPlan = await generateMealPlan(
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      weight,
      refeicoesPorDia,
      preferencias
    );

    // Salva a dieta no banco de dados
    const diet = new Diet({
      user: userId,
      objetivo,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      mealPlan,
      createdAt: new Date()
    });

    await diet.save();

    res.json({
      success: true,
      diet: {
        id: diet._id,
        objetivo,
        targets: {
          calorias: Math.round(targetCalories),
          proteinas: Math.round(targetProtein),
          carboidratos: Math.round(targetCarbs),
          gorduras: Math.round(targetFat)
        },
        mealPlan
      }
    });
  } catch (error) {
    console.error('Erro ao gerar dieta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar dieta personalizada'
    });
  }
});

/**
 * Função auxiliar para gerar plano de refeições com cálculo preciso de macros
 */
async function generateMealPlan(targetCalories, targetProtein, targetCarbs, targetFat, weight, refeicoesPorDia, preferencias) {
  const mealPlan = [];
  const mealNames = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];

  // Distribuir macros entre as refeições
  const proteinPerMeal = targetProtein / refeicoesPorDia;
  const carbsPerMeal = targetCarbs / refeicoesPorDia;
  const fatPerMeal = targetFat / refeicoesPorDia;

  console.log('🍽️ Macros por refeição:', {
    refeicoes: refeicoesPorDia,
    proteinPerMeal: `${Math.round(proteinPerMeal)}g`,
    carbsPerMeal: `${Math.round(carbsPerMeal)}g`,
    fatPerMeal: `${Math.round(fatPerMeal)}g`
  });

  for (let i = 0; i < refeicoesPorDia; i++) {
    const meal = {
      nome: mealNames[i] || `Refeição ${i + 1}`,
      horario: `${7 + (i * 3)}:00`,
      alimentos: []
    };

    // Macros restantes para esta refeição
    let proteinRestante = proteinPerMeal;
    let carbsRestante = carbsPerMeal;
    let fatRestante = fatPerMeal;

    // ESTRATÉGIA: Adicionar alimentos na ordem: proteína -> carboidrato -> gordura

    // 1. FONTE DE PROTEÍNA (frango, carne, peixe, ovo)
    const proteinFoods = ['frango_peito', 'carne_vermelha', 'peixe_tilapia', 'ovo'];
    const proteinKey = proteinFoods[i % proteinFoods.length]; // Varia entre refeições
    const proteinFood = FOOD_DATABASE[proteinKey];
    
    try {
      const proteinNutrition = await fetchNutritionData(proteinFood.fdcId);
      
      // Calcular quantidade necessária para atingir a proteína alvo
      // quantidade (g) = proteínaAlvo / (proteína por 100g / 100)
      const proteinPorcao = Math.round((proteinRestante / proteinNutrition.proteinas) * 100);
      
      meal.alimentos.push({
        id: proteinKey,
        nome: proteinFood.nome,
        porcao: proteinPorcao,
        unidade: proteinFood.unidade,
        nutrition: proteinNutrition
      });

      // Descontar macros já adicionados
      const fatorProtein = proteinPorcao / 100;
      proteinRestante -= proteinNutrition.proteinas * fatorProtein;
      carbsRestante -= (proteinNutrition.carboidratos || 0) * fatorProtein;
      fatRestante -= (proteinNutrition.gorduras || 0) * fatorProtein;

      console.log(`   ${proteinFood.nome}: ${proteinPorcao}g`);
    } catch (error) {
      console.error(`Erro ao buscar ${proteinKey}:`, error.message);
    }

    // 2. FONTE DE CARBOIDRATO (arroz, batata doce, aveia, etc)
    const carbFoods = ['arroz_branco', 'batata_doce', 'batata_inglesa', 'aveia', 'macarrao_integral'];
    const carbKey = carbFoods[i % carbFoods.length];
    const carbFood = FOOD_DATABASE[carbKey];
    
    try {
      const carbNutrition = await fetchNutritionData(carbFood.fdcId);
      
      // Calcular quantidade para atingir carboidratos restantes
      const carbPorcao = Math.round((carbsRestante / carbNutrition.carboidratos) * 100);
      
      meal.alimentos.push({
        id: carbKey,
        nome: carbFood.nome,
        porcao: carbPorcao,
        unidade: carbFood.unidade,
        nutrition: carbNutrition
      });

      // Descontar macros
      const fatorCarb = carbPorcao / 100;
      proteinRestante -= (carbNutrition.proteinas || 0) * fatorCarb;
      carbsRestante -= carbNutrition.carboidratos * fatorCarb;
      fatRestante -= (carbNutrition.gorduras || 0) * fatorCarb;

      console.log(`   ${carbFood.nome}: ${carbPorcao}g`);
    } catch (error) {
      console.error(`Erro ao buscar ${carbKey}:`, error.message);
    }

    // 3. FONTE DE GORDURA (azeite, abacate, castanhas)
    if (fatRestante > 5) { // Se ainda precisa de gordura
      const fatKey = 'azeite';
      const fatFood = FOOD_DATABASE[fatKey];
      
      try {
        const fatNutrition = await fetchNutritionData(fatFood.fdcId);
        
        // Azeite: 1 colher de sopa (15ml) = ~13.5g de gordura
        const colheres = Math.max(1, Math.round(fatRestante / 13.5));
        
        meal.alimentos.push({
          id: fatKey,
          nome: fatFood.nome,
          porcao: colheres * 15, // ml
          unidade: 'ml',
          nutrition: fatNutrition
        });

        console.log(`   ${fatFood.nome}: ${colheres} colher(es)`);
      } catch (error) {
        console.error(`Erro ao buscar ${fatKey}:`, error.message);
      }
    }

    // 4. VEGETAIS (opcional, para micronutrientes)
    if (i >= 1 && i <= 3) { // Almoço e jantar
      const veggies = ['brocolos', 'couve', 'cenoura', 'alface'];
      const veggieKey = veggies[i % veggies.length];
      const veggieFood = FOOD_DATABASE[veggieKey];
      
      try {
        const veggieNutrition = await fetchNutritionData(veggieFood.fdcId);
        
        meal.alimentos.push({
          id: veggieKey,
          nome: veggieFood.nome,
          porcao: 100, // porção padrão de vegetais
          unidade: veggieFood.unidade,
          nutrition: veggieNutrition
        });

        console.log(`   ${veggieFood.nome}: 100g`);
      } catch (error) {
        console.error(`Erro ao buscar ${veggieKey}:`, error.message);
      }
    }

    mealPlan.push(meal);
  }

  // VALIDAÇÃO FINAL: Calcular totais reais da dieta gerada
  let totaisReais = {
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
    calorias: 0
  };

  mealPlan.forEach(refeicao => {
    refeicao.alimentos.forEach(alimento => {
      const fator = alimento.porcao / 100;
      totaisReais.proteinas += (alimento.nutrition.proteinas || 0) * fator;
      totaisReais.carboidratos += (alimento.nutrition.carboidratos || 0) * fator;
      totaisReais.gorduras += (alimento.nutrition.gorduras || 0) * fator;
    });
  });

  totaisReais.calorias = (totaisReais.proteinas * 4) + (totaisReais.carboidratos * 4) + (totaisReais.gorduras * 9);

  console.log('');
  console.log('📈 VALIDAÇÃO FINAL DA DIETA:');
  console.log(`   🎯 Alvo: P:${Math.round(targetProtein)}g | C:${Math.round(targetCarbs)}g | G:${Math.round(targetFat)}g | ${Math.round(targetCalories)} kcal`);
  console.log(`   ✅ Real: P:${Math.round(totaisReais.proteinas)}g | C:${Math.round(totaisReais.carboidratos)}g | G:${Math.round(totaisReais.gorduras)}g | ${Math.round(totaisReais.calorias)} kcal`);
  console.log(`   📊 Diferença: P:${Math.round(totaisReais.proteinas - targetProtein)}g | C:${Math.round(totaisReais.carboidratos - targetCarbs)}g | G:${Math.round(totaisReais.gorduras - targetFat)}g | ${Math.round(totaisReais.calorias - targetCalories)} kcal`);
  console.log('');

  return mealPlan;
}
/**
 * GET /api/nutrition/my-diets
 * Lista todas as dietas do usuário
 */
router.get('/my-diets', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const diets = await Diet.find({ user: userId }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      diets
    });
  } catch (error) {
    console.error('Erro ao buscar dietas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de dietas'
    });
  }
});

/**
 * GET /api/nutrition/diet/:dietId
 * Busca uma dieta específica
 */
router.get('/diet/:dietId', authenticate, async (req, res) => {
  try {
    const { dietId } = req.params;
    const userId = req.user._id;

    const diet = await Diet.findOne({ _id: dietId, user: userId });

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: 'Dieta não encontrada'
      });
    }

    res.json({
      success: true,
      diet
    });
  } catch (error) {
    console.error('Erro ao buscar dieta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dieta'
    });
  }
});

/**
 * DELETE /api/nutrition/diet/:dietId
 * Deleta uma dieta específica
 */
router.delete('/diet/:dietId', authenticate, async (req, res) => {
  try {
    const { dietId } = req.params;
    const userId = req.user._id;

    const diet = await Diet.findOneAndDelete({ _id: dietId, user: userId });

    if (!diet) {
      return res.status(404).json({
        success: false,
        message: 'Dieta não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Dieta excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir dieta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir dieta'
    });
  }
});

export default router;

