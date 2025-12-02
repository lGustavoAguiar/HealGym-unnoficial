/**
 * Função auxiliar para gerar plano de refeições com cálculo preciso de macros
 * Usa APENAS: Frango, Arroz, Feijão, Ovo, Azeite
 */
async function generateMealPlan(targetCalories, targetProtein, targetCarbs, targetFat, weight, refeicoesPorDia, preferencias) {
  const mealPlan = [];
  const mealNames = ['Café da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar'];

  // Buscar informações nutricionais dos alimentos (valores por 100g ou unidade)
  const frango = await fetchNutritionData(FOOD_DATABASE['frango_peito'].fdcId);
  const arroz = await fetchNutritionData(FOOD_DATABASE['arroz_branco'].fdcId);
  const feijao = await fetchNutritionData(FOOD_DATABASE['feijao'].fdcId);
  const ovo = await fetchNutritionData(FOOD_DATABASE['ovo'].fdcId);
  const azeite = await fetchNutritionData(FOOD_DATABASE['azeite'].fdcId);

  console.log('📊 Valores nutricionais:');
  console.log(`   Frango (100g): P:${frango.proteinas}g C:${frango.carboidratos}g G:${frango.gorduras}g`);
  console.log(`   Arroz (100g): P:${arroz.proteinas}g C:${arroz.carboidratos}g G:${arroz.gorduras}g`);
  console.log(`   Feijão (100g): P:${feijao.proteinas}g C:${feijao.carboidratos}g G:${feijao.gorduras}g`);
  console.log(`   Ovo (unidade): P:${ovo.proteinas}g C:${ovo.carboidratos}g G:${ovo.gorduras}g`);
  console.log(`   Azeite (100ml): P:${azeite.proteinas}g C:${azeite.carboidratos}g G:${azeite.gorduras}g`);
  console.log('');

  // CALCULAR QUANTIDADES TOTAIS DIÁRIAS
  // Proteína: 60% frango + 40% ovo
  const proteinaDoFrango = targetProtein * 0.60;
  const proteinaDoOvo = targetProtein * 0.40;
  const frangoTotalGramas = (proteinaDoFrango / frango.proteinas) * 100;
  const ovosTotal = Math.round(proteinaDoOvo / ovo.proteinas);

  // Carboidratos: 60% arroz + 40% feijão
  const carboDoArroz = targetCarbs * 0.60;
  const carboDoFeijao = targetCarbs * 0.40;
  const arrozTotalGramas = (carboDoArroz / arroz.carboidratos) * 100;
  const feijaoTotalGramas = (carboDoFeijao / feijao.carboidratos) * 100;

  // Gordura: calcular quanto vem do frango/ovo, resto do azeite
  const gorduraDoFrango = (frangoTotalGramas / 100) * frango.gorduras;
  const gorduraDoOvo = ovosTotal * ovo.gorduras;
  const gorduraRestante = Math.max(0, targetFat - gorduraDoFrango - gorduraDoOvo);
  const azeiteColheres = Math.max(1, Math.round(gorduraRestante / 13.5)); // 1 colher ≈ 13.5g gordura

  console.log('🎯 Quantidades totais diárias:');
  console.log(`   Frango: ${Math.round(frangoTotalGramas)}g → P:${Math.round(proteinaDoFrango)}g`);
  console.log(`   Ovos: ${ovosTotal} unidades → P:${Math.round(proteinaDoOvo)}g`);
  console.log(`   Arroz: ${Math.round(arrozTotalGramas)}g → C:${Math.round(carboDoArroz)}g`);
  console.log(`   Feijão: ${Math.round(feijaoTotalGramas)}g → C:${Math.round(carboDoFeijao)}g`);
  console.log(`   Azeite: ${azeiteColheres} colher(es) → G:${Math.round(gorduraRestante)}g`);
  console.log('');

  // DISTRIBUIR entre as 4 refeições
  const distribuicao = {
    'Café da Manhã': {
      frango: 0,
      arroz: 0,
      feijao: 0,
      ovo: Math.round(ovosTotal * 0.50), // 50% dos ovos
      azeite: 0
    },
    'Almoço': {
      frango: Math.round(frangoTotalGramas * 0.50), // 50% do frango
      arroz: Math.round(arrozTotalGramas * 0.50),   // 50% do arroz
      feijao: Math.round(feijaoTotalGramas * 0.50), // 50% do feijão
      ovo: 0,
      azeite: Math.ceil(azeiteColheres * 0.50)      // 50% do azeite
    },
    'Lanche da Tarde': {
      frango: 0,
      arroz: 0,
      feijao: 0,
      ovo: Math.round(ovosTotal * 0.50), // 50% dos ovos
      azeite: 0
    },
    'Jantar': {
      frango: Math.round(frangoTotalGramas * 0.50), // 50% do frango
      arroz: Math.round(arrozTotalGramas * 0.50),   // 50% do arroz
      feijao: Math.round(feijaoTotalGramas * 0.50), // 50% do feijão
      ovo: 0,
      azeite: Math.floor(azeiteColheres * 0.50)     // 50% do azeite
    }
  };

  // Criar refeições
  for (let i = 0; i < refeicoesPorDia; i++) {
    const nomeRefeicao = mealNames[i];
    const dist = distribuicao[nomeRefeicao];

    const meal = {
      nome: nomeRefeicao,
      horario: `${7 + (i * 3)}:00`,
      alimentos: []
    };

    console.log(`✅ ${nomeRefeicao}:`);

    // Adicionar frango (se houver)
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

    // Adicionar arroz (se houver)
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

    // Adicionar feijão (se houver)
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

    // Adicionar ovo (se houver)
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

    // Adicionar azeite (se houver)
    if (dist.azeite > 0) {
      meal.alimentos.push({
        id: 'azeite',
        nome: FOOD_DATABASE['azeite'].nome,
        porcao: dist.azeite * 15, // converter colheres para ml
        unidade: 'ml',
        nutrition: azeite
      });
      console.log(`   - Azeite: ${dist.azeite} colher(es) (${dist.azeite * 15}ml)`);
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
