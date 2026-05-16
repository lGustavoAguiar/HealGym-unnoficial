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
 * Normaliza string de horário (ex.: "7:30", "07:30:00") para "HH:MM" 24h.
 */
function normalizeHorarioString(value) {
  if (value == null || value === '') return null;
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let hh = parseInt(match[1], 10);
  let mm = parseInt(match[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Um horário por refeição; índices faltantes ou inválidos usam espaçamento padrão (7h, 10h, 13h…).
 */
function resolveHorariosParaRefeicoes(refeicoesPorDia, horariosBody) {
  const arr = [];
  for (let i = 0; i < refeicoesPorDia; i++) {
    const fromUser = Array.isArray(horariosBody) ? horariosBody[i] : null;
    const parsed = normalizeHorarioString(fromUser);
    if (parsed) {
      arr.push(parsed);
    } else {
      arr.push(`${String(7 + i * 3).padStart(2, '0')}:00`);
    }
  }
  return arr;
}

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
      preferencias = [],
      horarios = null
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

    const horariosResolvidos = resolveHorariosParaRefeicoes(refeicoesPorDia, horarios);

    // Gera o plano de refeições
    const mealPlan = await generateMealPlan(
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      weight,
      refeicoesPorDia,
      preferencias,
      horariosResolvidos
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
 * Usa APENAS: Frango, Arroz, Feijão, Ovo, Azeite
 */
async function generateMealPlan(targetCalories, targetProtein, targetCarbs, targetFat, weight, refeicoesPorDia, preferencias, horariosResolvidos) {
  const mealPlan = [];
  const mealNames = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];

  // VALORES HARDCODED para evitar rate limit da API USDA
  // Fonte: USDA FoodData Central (valores médios por 100g ou unidade)
  // ⚠️ IMPORTANTE: Calorias declaradas NÃO são usadas! Apenas macros (P/C/G)
  // Calorias são SEMPRE calculadas pelo modelo 4/4/9
  const frango = {
    proteinas: 31,
    carboidratos: 0,
    gorduras: 3.6,
    fibras: 0,
    sodio: 74,
    acucares: 0,
    calcio: 15,
    ferro: 1.0,
    magnesio: 29,
    fosforo: 220,
    potassio: 256,
    zinco: 1.0,
    vitaminaA: 9,
    vitaminaC: 0,
    vitaminaD: 0.1,
    vitaminaE: 0.3,
    vitaminaB12: 0.3,
    folato: 4,
    gorduraSaturada: 1.0,
    colesterol: 85
  };

  const arroz = {
    proteinas: 2.7,
    carboidratos: 28,
    gorduras: 0.3,
    fibras: 0.4,
    sodio: 1,
    acucares: 0.1,
    calcio: 10,
    ferro: 0.2,
    magnesio: 12,
    fosforo: 43,
    potassio: 35,
    zinco: 0.5,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 0.1,
    vitaminaB12: 0,
    folato: 3,
    gorduraSaturada: 0.1,
    colesterol: 0
  };

  const feijao = {
    proteinas: 9,
    carboidratos: 23,
    gorduras: 0.5,
    fibras: 9,
    sodio: 2,
    acucares: 0.3,
    calcio: 46,
    ferro: 2.1,
    magnesio: 45,
    fosforo: 140,
    potassio: 391,
    zinco: 1.0,
    vitaminaA: 0,
    vitaminaC: 1.2,
    vitaminaD: 0,
    vitaminaE: 0.2,
    vitaminaB12: 0,
    folato: 90,
    gorduraSaturada: 0.1,
    colesterol: 0
  };

  const ovo = {
    proteinas: 6,
    carboidratos: 0.6,
    gorduras: 5,
    fibras: 0,
    sodio: 71,
    acucares: 0.6,
    calcio: 28,
    ferro: 0.9,
    magnesio: 6,
    fosforo: 99,
    potassio: 69,
    zinco: 0.6,
    vitaminaA: 80,
    vitaminaC: 0,
    vitaminaD: 1.1,
    vitaminaE: 0.5,
    vitaminaB12: 0.6,
    folato: 24,
    gorduraSaturada: 1.6,
    colesterol: 186
  };

  const azeite = {
    proteinas: 0,
    carboidratos: 0,
    gorduras: 100,
    fibras: 0,
    sodio: 2,
    acucares: 0,
    calcio: 1,
    ferro: 0.4,
    magnesio: 0,
    fosforo: 0,
    potassio: 1,
    zinco: 0,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 14.4,
    vitaminaB12: 0,
    folato: 0,
    gorduraSaturada: 13.8,
    colesterol: 0
  };

  console.log('📊 Valores nutricionais (macros fixos + micronutrientes):');
  console.log(`   Frango (100g): P:${frango.proteinas}g C:${frango.carboidratos}g G:${frango.gorduras}g`);
  console.log(`   Arroz (100g): P:${arroz.proteinas}g C:${arroz.carboidratos}g G:${arroz.gorduras}g`);
  console.log(`   Feijão (100g): P:${feijao.proteinas}g C:${feijao.carboidratos}g G:${feijao.gorduras}g`);
  console.log(`   Ovo (unidade): P:${ovo.proteinas}g C:${ovo.carboidratos}g G:${ovo.gorduras}g`);
  console.log(`   Azeite (100ml): P:${azeite.proteinas}g C:${azeite.carboidratos}g G:${azeite.gorduras}g`);
  console.log('   ⚠️  Calorias calculadas APENAS pelo modelo 4/4/9 (não usamos tabelas)');
  console.log('');

  // ====================================================================
  // CÁLCULO DINÂMICO DAS QUANTIDADES - SEMPRE BATE OS MACROS EXATOS
  // ====================================================================
  // REGRA FIXA: 2g P/kg, 1g G/kg, resto em carboidratos
  // Quantidades ajustadas automaticamente para o peso do usuário
  // ====================================================================
  
  console.log('🎯 ALVOS (regra fixa - 2g P/kg, 1g G/kg, resto C):');
  console.log(`   Peso: ${weight}kg`);
  console.log(`   Proteína: ${targetProtein}g → ${targetProtein * 4} kcal`);
  console.log(`   Gordura: ${targetFat}g → ${targetFat * 9} kcal`);
  console.log(`   Carboidrato: ${Math.round(targetCarbs)}g → ${Math.round(targetCarbs * 4)} kcal`);
  console.log(`   TOTAL: ${targetCalories} kcal`);
  console.log('');

  // CÁLCULO DAS QUANTIDADES BASEADO NOS MACROS
  // Estrutura fixa: 6 ovos divididos em café e lanche
  const ovosTotal = 6;
  const proteinaOvos = ovosTotal * 6;      // 36g
  const carboOvos = ovosTotal * 0.6;       // 3.6g
  const gorduraOvos = ovosTotal * 5;       // 30g

  // Passo 1: Calcular arroz e feijão para os carboidratos EXATOS
  const carboRestante = targetCarbs - carboOvos;
  // Dividir carboidratos: 55% arroz (mais carbo), 45% feijão
  const carboArroz = carboRestante * 0.55;
  const carboFeijao = carboRestante * 0.45;
  // Não arredondar ainda - manter precisão
  let arrozGramas = (carboArroz / 28) * 100; // 28g carbo/100g arroz
  let feijaoGramas = (carboFeijao / 23) * 100; // 23g carbo/100g feijão
  
  const proteinaArroz = (arrozGramas / 100) * 2.7;
  const proteinaFeijao = (feijaoGramas / 100) * 9;
  const gorduraArroz = (arrozGramas / 100) * 0.3;
  const gorduraFeijao = (feijaoGramas / 100) * 0.5;

  // Passo 2: Calcular frango para completar a proteína EXATA
  const proteinaRestante = targetProtein - proteinaOvos - proteinaArroz - proteinaFeijao;
  // Não arredondar ainda - manter precisão
  let frangoGramas = (proteinaRestante / 31) * 100; // 31g proteína/100g
  const gorduraFrango = (frangoGramas / 100) * 3.6;

  // Passo 3: Calcular azeite para completar a gordura EXATA
  // Considerar TODAS as fontes de gordura: ovos, frango, arroz, feijão
  const gorduraAcumulada = gorduraOvos + gorduraFrango + gorduraArroz + gorduraFeijao;
  const gorduraRestante = targetFat - gorduraAcumulada;
  // Não arredondar ainda - manter precisão
  let azeiteML = (gorduraRestante / 100) * 100; // 100g gordura/100ml
  const gorduraAzeite = (azeiteML / 100) * 100;

  // VALIDAÇÃO ANTES DO ARREDONDAMENTO
  let pAntes = proteinaOvos + (frangoGramas/100)*31 + proteinaArroz + proteinaFeijao;
  let cAntes = carboOvos + (arrozGramas/100)*28 + (feijaoGramas/100)*23;
  let gAntes = gorduraOvos + gorduraFrango + gorduraArroz + gorduraFeijao + gorduraAzeite;

  console.log('📊 Antes do arredondamento:');
  console.log(`   P: ${pAntes.toFixed(2)}g | C: ${cAntes.toFixed(2)}g | G: ${gAntes.toFixed(2)}g`);

  // ARREDONDAR para valores práticos
  arrozGramas = Math.round(arrozGramas);
  feijaoGramas = Math.round(feijaoGramas);
  frangoGramas = Math.round(frangoGramas);
  azeiteML = Math.round(azeiteML);

  // VALIDAÇÃO APÓS ARREDONDAMENTO: Calcular macros finais
  const pFinal = proteinaOvos + (frangoGramas/100)*31 + (arrozGramas/100)*2.7 + (feijaoGramas/100)*9;
  const cFinal = carboOvos + (arrozGramas/100)*28 + (feijaoGramas/100)*23;
  const gFinal = gorduraOvos + (frangoGramas/100)*3.6 + (arrozGramas/100)*0.3 + (feijaoGramas/100)*0.5 + (azeiteML/100)*100;
  const calFinal = (pFinal*4) + (cFinal*4) + (gFinal*9);

  console.log('🎯 Quantidades calculadas para ' + weight + 'kg:');
  console.log(`   Ovos: ${ovosTotal} unidades`);
  console.log(`   Frango: ${frangoGramas}g`);
  console.log(`   Arroz: ${arrozGramas}g`);
  console.log(`   Feijão: ${feijaoGramas}g`);
  console.log(`   Azeite: ${azeiteML}ml`);
  console.log('');
  console.log('📊 VALIDAÇÃO DOS MACROS (após arredondamento):');
  console.log(`   ✅ Proteína: ${pFinal.toFixed(1)}g (alvo: ${targetProtein}g) - Erro: ${(pFinal - targetProtein).toFixed(1)}g`);
  console.log(`   ✅ Carboidrato: ${cFinal.toFixed(1)}g (alvo: ${Math.round(targetCarbs)}g) - Erro: ${(cFinal - targetCarbs).toFixed(1)}g`);
  console.log(`   ✅ Gordura: ${gFinal.toFixed(1)}g (alvo: ${targetFat}g) - Erro: ${(gFinal - targetFat).toFixed(1)}g`);
  console.log(`   ✅ Calorias: ${Math.round(calFinal)} kcal (alvo: ${targetCalories} kcal)`);
  console.log('');

  // DISTRIBUIÇÃO EXATA POR REFEIÇÃO COM AJUSTE FINO
  // Dividir pelas 4 refeições e ajustar o último valor para compensar arredondamento
  const arrozPorRefeicao = Math.floor(arrozGramas / 4);
  const feijaoPorRefeicao = Math.floor(feijaoGramas / 4);
  const azeitePorRefeicao = Math.floor(azeiteML / 4);
  const frangoPorRefeicao = Math.floor(frangoGramas / 2);
  
  // Calcular restos para distribuir no jantar (última refeição)
  const restoArroz = arrozGramas - (arrozPorRefeicao * 4);
  const restoFeijao = feijaoGramas - (feijaoPorRefeicao * 4);
  const restoAzeite = azeiteML - (azeitePorRefeicao * 4);
  const restoFrango = frangoGramas - (frangoPorRefeicao * 2);

  console.log('📦 Distribuição base por refeição:');
  console.log(`   Arroz: ${arrozPorRefeicao}g × 4 = ${arrozPorRefeicao * 4}g (resto: ${restoArroz}g)`);
  console.log(`   Feijão: ${feijaoPorRefeicao}g × 4 = ${feijaoPorRefeicao * 4}g (resto: ${restoFeijao}g)`);
  console.log(`   Azeite: ${azeitePorRefeicao}ml × 4 = ${azeitePorRefeicao * 4}ml (resto: ${restoAzeite}ml)`);
  console.log(`   Frango: ${frangoPorRefeicao}g × 2 = ${frangoPorRefeicao * 2}g (resto: ${restoFrango}g)`);
  console.log('');

  const distribuicao = {
    'Café da Manhã': {
      frango: 0,
      arroz: arrozPorRefeicao,
      feijao: feijaoPorRefeicao,
      ovo: 3,
      azeite: azeitePorRefeicao
    },
    'Almoço': {
      frango: frangoPorRefeicao,
      arroz: arrozPorRefeicao,
      feijao: feijaoPorRefeicao,
      ovo: 0,
      azeite: azeitePorRefeicao
    },
    'Lanche da Tarde': {
      frango: 0,
      arroz: arrozPorRefeicao,
      feijao: feijaoPorRefeicao,
      ovo: 3,
      azeite: azeitePorRefeicao
    },
    'Jantar': {
      frango: frangoPorRefeicao + restoFrango, // Adicionar resto do frango
      arroz: arrozPorRefeicao + restoArroz,    // Adicionar resto do arroz
      feijao: feijaoPorRefeicao + restoFeijao, // Adicionar resto do feijão
      ovo: 0,
      azeite: azeitePorRefeicao + restoAzeite  // Adicionar resto do azeite
    }
  };
  // Criar refeições
  for (let i = 0; i < refeicoesPorDia; i++) {
    const nomeRefeicao = mealNames[i];
    const dist = distribuicao[nomeRefeicao];

    const meal = {
      nome: nomeRefeicao,
      horario: horariosResolvidos[i] || `${String(7 + (i * 3)).padStart(2, '0')}:00`,
      alimentos: []
    };

    console.log(`✅ ${nomeRefeicao}:`);

    // ORDEM FIXA: Arroz → Feijão → Azeite → Proteína (Ovo ou Frango)

    // 1. Adicionar arroz (sempre)
    if (dist.arroz > 0) {
      meal.alimentos.push({
        id: 'arroz_branco',
        nome: FOOD_DATABASE['arroz_branco'].nome,
        porcao: dist.arroz,
        unidade: 'g',
        nutrition: arroz
      });
      console.log(`   - Arroz: ${dist.arroz}g`);
    }

    // 2. Adicionar feijão (sempre)
    if (dist.feijao > 0) {
      meal.alimentos.push({
        id: 'feijao',
        nome: FOOD_DATABASE['feijao'].nome,
        porcao: dist.feijao,
        unidade: 'g',
        nutrition: feijao
      });
      console.log(`   - Feijão: ${dist.feijao}g`);
    }

    // 3. Adicionar azeite (sempre)
    if (dist.azeite > 0) {
      meal.alimentos.push({
        id: 'azeite',
        nome: FOOD_DATABASE['azeite'].nome,
        porcao: dist.azeite,
        unidade: 'ml',
        nutrition: azeite
      });
      console.log(`   - Azeite: ${dist.azeite}ml (${Math.round(dist.azeite/15)} colher(es))`);
    }

    // 4. Adicionar proteína (ovo OU frango)
    if (dist.ovo > 0) {
      meal.alimentos.push({
        id: 'ovo',
        nome: FOOD_DATABASE['ovo'].nome,
        porcao: dist.ovo,
        unidade: 'unidade',
        nutrition: ovo
      });
      console.log(`   - Ovos: ${dist.ovo} unidade(s)`);
    }

    if (dist.frango > 0) {
      meal.alimentos.push({
        id: 'frango_peito',
        nome: FOOD_DATABASE['frango_peito'].nome,
        porcao: dist.frango,
        unidade: 'g',
        nutrition: frango
      });
      console.log(`   - Frango: ${dist.frango}g`);
    }

    // 5. SUPLEMENTOS GROWTH (não contam nos macros)
    if (nomeRefeicao === 'Café da Manhã') {
      // Creatina Growth - 3g
      meal.alimentos.push({
        id: 'creatina_growth',
        nome: 'Creatina Growth',
        porcao: 3,
        unidade: 'g',
        nutrition: { proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, acucares: 0, calcio: 0, ferro: 0, magnesio: 0, fosforo: 0, potassio: 0, zinco: 0, vitaminaA: 0, vitaminaC: 0, vitaminaD: 0, vitaminaE: 0, vitaminaB12: 0, folato: 0, gorduraSaturada: 0, colesterol: 0 },
        isSuplemento: true
      });
      console.log(`   - ⭐ Creatina Growth: 3g`);

      // Multivitamínico Growth - 1 cápsula
      meal.alimentos.push({
        id: 'multivitaminico_growth',
        nome: 'Multivitamínico Growth',
        porcao: 1,
        unidade: 'cápsula',
        nutrition: { proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, acucares: 0, calcio: 0, ferro: 0, magnesio: 0, fosforo: 0, potassio: 0, zinco: 0, vitaminaA: 0, vitaminaC: 0, vitaminaD: 0, vitaminaE: 0, vitaminaB12: 0, folato: 0, gorduraSaturada: 0, colesterol: 0 },
        isSuplemento: true
      });
      console.log(`   - ⭐ Multivitamínico Growth: 1 cápsula`);

      // Ômega-3 Growth - 2 cápsulas
      meal.alimentos.push({
        id: 'omega3_growth',
        nome: 'Ômega-3 Growth',
        porcao: 2,
        unidade: 'cápsulas',
        nutrition: { proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, acucares: 0, calcio: 0, ferro: 0, magnesio: 0, fosforo: 0, potassio: 0, zinco: 0, vitaminaA: 0, vitaminaC: 0, vitaminaD: 0, vitaminaE: 0, vitaminaB12: 0, folato: 0, gorduraSaturada: 0, colesterol: 0 },
        isSuplemento: true
      });
      console.log(`   - ⭐ Ômega-3 Growth: 2 cápsulas`);

      // Cálcio + Vitamina D Growth - 1 cápsula
      meal.alimentos.push({
        id: 'calcio_vitd_growth',
        nome: 'Cálcio + Vitamina D Growth',
        porcao: 1,
        unidade: 'cápsula',
        nutrition: { proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, acucares: 0, calcio: 600, ferro: 0, magnesio: 0, fosforo: 0, potassio: 0, zinco: 0, vitaminaA: 0, vitaminaC: 0, vitaminaD: 10, vitaminaE: 0, vitaminaB12: 0, folato: 0, gorduraSaturada: 0, colesterol: 0 },
        isSuplemento: true
      });
      console.log(`   - ⭐ Cálcio + Vitamina D Growth: 1 cápsula`);
    }

    if (nomeRefeicao === 'Jantar') {
      // ZMA Growth - 2 cápsulas
      meal.alimentos.push({
        id: 'zma_growth',
        nome: 'ZMA Growth',
        porcao: 2,
        unidade: 'cápsulas',
        nutrition: { proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0, sodio: 0, acucares: 0, calcio: 0, ferro: 0, magnesio: 450, fosforo: 0, potassio: 0, zinco: 30, vitaminaA: 0, vitaminaC: 0, vitaminaD: 0, vitaminaE: 0, vitaminaB12: 0, folato: 0, gorduraSaturada: 0, colesterol: 0 },
        isSuplemento: true
      });
      console.log(`   - ⭐ ZMA Growth: 2 cápsulas`);
    }

    mealPlan.push(meal);
  }

  // VALIDAÇÃO FINAL
  let totaisReais = {
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
    calorias: 0
  };

  mealPlan.forEach(refeicao => {
    refeicao.alimentos.forEach(alimento => {
      let fator;
      if (alimento.unidade === 'unidade') {
        fator = alimento.porcao; // ovos: quantidade direta
      } else {
        fator = alimento.porcao / 100; // outros: converter para 100g
      }
      
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

