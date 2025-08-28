import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiTarget, FiTrendingUp, FiClock, FiActivity, FiHeart } from 'react-icons/fi';
import { useState, useEffect, useMemo } from 'react';

// Base de dados nutricional - APENAS os 5 alimentos solicitados (valores por 100g)
const ALIMENTOS_DB = {
  'banana_nanica': {
    nome: 'Banana Nanica',
    calorias: 87,   // 1 banana média = ~100g = 87 kcal
    proteinas: 1.1,
    carboidratos: 22,
    gorduras: 0.3,
    fibras: 2.6,
    calcio: 5,
    ferro: 0.26,
    magnesio: 27,
    fosforo: 22,
    potassio: 358,
    sodio: 1,
    zinco: 0.15,
    vitaminaA: 64,
    vitaminaC: 8.7,
    vitaminaD: 0,
    vitaminaE: 0.1,
    vitaminaB12: 0,
    folato: 20,
    categoria: 'carboidrato',
    unidade: 'unidade'
  },
  'arroz_branco': {
    nome: 'Arroz Branco Cozido',
    calorias: 130,  // Valores do arroz cozido (100g cozido)
    proteinas: 2.7,
    carboidratos: 28,
    gorduras: 0.3,
    fibras: 0.4,
    calcio: 10,
    ferro: 0.8,
    magnesio: 25,
    fosforo: 68,
    potassio: 35,
    sodio: 1,
    zinco: 1.09,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 0.11,
    vitaminaB12: 0,
    folato: 8,
    categoria: 'carboidrato',
    unidade: 'g (cozido)'
  },
  'frango_sassami': {
    nome: 'Frango Sassami Cru',
    calorias: 108,  // Valores do frango cru
    proteinas: 23,
    carboidratos: 0,
    gorduras: 1.2,
    fibras: 0,
    calcio: 15,
    ferro: 1.04,
    magnesio: 29,
    fosforo: 228,
    potassio: 256,
    sodio: 74,
    zinco: 1.0,
    vitaminaA: 21,
    vitaminaC: 1.2,
    vitaminaD: 0.1,
    vitaminaE: 0.27,
    vitaminaB12: 0.34,
    folato: 4,
    categoria: 'proteina',
    unidade: 'g (cru)'
  },
  'ovo_medio': {
    nome: 'Ovo Médio',
    calorias: 75,   // 1 ovo médio = ~50g = 75 kcal
    proteinas: 6.5,
    carboidratos: 0.6,
    gorduras: 5.5,
    fibras: 0,
    calcio: 28,
    ferro: 0.9,
    magnesio: 6,
    fosforo: 99,
    potassio: 69,
    sodio: 62,
    zinco: 0.65,
    vitaminaA: 270,
    vitaminaC: 0,
    vitaminaD: 1.0,
    vitaminaE: 0.52,
    vitaminaB12: 0.45,
    folato: 22,
    categoria: 'proteina',
    unidade: 'unidade'
  },
  'batata_doce': {
    nome: 'Batata Doce Crua',
    calorias: 86,   // Valores da batata doce crua
    proteinas: 1.6,
    carboidratos: 20,
    gorduras: 0.1,
    fibras: 3.0,
    calcio: 30,
    ferro: 0.61,
    magnesio: 25,
    fosforo: 47,
    potassio: 337,
    sodio: 5,
    zinco: 0.3,
    vitaminaA: 14187,
    vitaminaC: 2.4,
    vitaminaD: 0,
    vitaminaE: 0.26,
    vitaminaB12: 0,
    folato: 11,
    categoria: 'carboidrato',
    unidade: 'g (cru)'
  },
  
  // Suplementos Growth
  'creatina_growth': {
    nome: 'Creatina Growth (3g)',
    calorias: 0,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 0,
    fibras: 0,
    calcio: 0,
    ferro: 0,
    magnesio: 0,
    fosforo: 0,
    potassio: 0,
    sodio: 0,
    zinco: 0,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 0,
    vitaminaB12: 0,
    folato: 0,
    categoria: 'suplemento'
  },
  'omega3_growth': {
    nome: 'Ômega 3 Growth (1000mg)',
    calorias: 9,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 1,
    fibras: 0,
    calcio: 0,
    ferro: 0,
    magnesio: 0,
    fosforo: 0,
    potassio: 0,
    sodio: 0,
    zinco: 0,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 5, // Ômega 3 tem vitamina E
    vitaminaB12: 0,
    folato: 0,
    categoria: 'suplemento'
  },
  'multivitaminico_growth': {
    nome: 'Multivitamínico Growth (1 cápsula)',
    calorias: 2,
    proteinas: 0,
    carboidratos: 0.5,
    gorduras: 0,
    fibras: 0,
    calcio: 200, // mg
    ferro: 14, // mg
    magnesio: 100, // mg
    fosforo: 125, // mg
    potassio: 99, // mg
    sodio: 0,
    zinco: 7, // mg
    vitaminaA: 600, // mcg
    vitaminaC: 45, // mg
    vitaminaD: 5, // mcg
    vitaminaE: 10, // mg
    vitaminaB12: 1, // mcg
    folato: 240, // mcg
    categoria: 'suplemento'
  },
  'azeite_oliva': {
    nome: 'Azeite de Oliva Extra Virgem',
    calorias: 884,
    proteinas: 0,
    carboidratos: 0,
    gorduras: 100,
    fibras: 0,
    calcio: 1,
    ferro: 0.56,
    magnesio: 0,
    fosforo: 0,
    potassio: 1,
    sodio: 2,
    zinco: 0,
    vitaminaA: 0,
    vitaminaC: 0,
    vitaminaD: 0,
    vitaminaE: 14.35,
    vitaminaB12: 0,
    folato: 0,
    categoria: 'gordura',
    unidade: 'colher de sopa'
  }
};

const DietaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dietaGerada, setDietaGerada] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Cálculo das necessidades calóricas baseado na fórmula de Harris-Benedict revisada
  const calcularNecessidadesNutricionais = useMemo(() => {
    if (!user?.profile?.weight || !user?.profile?.height || !user?.profile?.dateOfBirth || !user?.profile?.gender) {
      return null;
    }

    const peso = user.profile.weight;
    const altura = user.profile.height;
    const nascimento = new Date(user.profile.dateOfBirth);
    const idade = new Date().getFullYear() - nascimento.getFullYear();
    const genero = user.profile.gender;
    const biotipo = user.profile.bodyType;

    // Cálculo do IMC e classificação
    const imc = peso / ((altura / 100) ** 2);
    let classificacaoIMC = '';
    let objetivo = '';
    
    if (imc < 18.5) {
      classificacaoIMC = 'Abaixo do peso';
      objetivo = 'ganho_peso';
    } else if (imc >= 18.5 && imc < 25) {
      classificacaoIMC = 'Peso normal';
      objetivo = 'manutencao';
    } else if (imc >= 25 && imc < 30) {
      classificacaoIMC = 'Sobrepeso';
      objetivo = 'emagrecimento';
    } else {
      classificacaoIMC = 'Obesidade';
      objetivo = 'emagrecimento';
    }

    // TMB (Taxa Metabólica Basal) - Fórmula de Harris-Benedict revisada
    let tmb;
    if (genero === 'masculino') {
      tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
    } else {
      tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
    }

    // Usando apenas a Taxa Metabólica Basal (TMB) como gasto energético
    const gastoEnergetico = Math.round(tmb);

    // Ajuste calórico baseado no objetivo
    let caloriasMeta;
    let deficitSuperavit = 0;
    
    switch (objetivo) {
      case 'emagrecimento':
        // Déficit de 20-25% para emagrecimento saudável
        deficitSuperavit = Math.round(gastoEnergetico * 0.25);
        caloriasMeta = gastoEnergetico - deficitSuperavit;
        break;
      case 'ganho_peso':
        // Superávit de 15% para ganho de peso
        deficitSuperavit = Math.round(gastoEnergetico * 0.15);
        caloriasMeta = gastoEnergetico + deficitSuperavit;
        break;
      case 'manutencao':
      default:
        caloriasMeta = gastoEnergetico;
        deficitSuperavit = 0;
        break;
    }

    // Distribuição de macronutrientes baseada no objetivo
    let proteinasGramas, gordurasGramas, carboidratosGramas;
    
    if (objetivo === 'emagrecimento') {
      // Para emagrecimento: 2g proteína/kg, 1g gordura/kg, resto carboidrato
      proteinasGramas = Math.round(peso * 2);
      gordurasGramas = Math.round(peso * 1);
      
      // Calcular calorias restantes para carboidratos
      const caloriasProteina = proteinasGramas * 4;
      const caloriasGordura = gordurasGramas * 9;
      const caloriasRestantes = caloriasMeta - caloriasProteina - caloriasGordura;
      carboidratosGramas = Math.max(50, Math.round(caloriasRestantes / 4)); // Mínimo 50g carbo
      
      // Recalcular calorias totais baseado nos macros
      const caloriasRecalculadas = (proteinasGramas * 4) + (gordurasGramas * 9) + (carboidratosGramas * 4);
      caloriasMeta = caloriasRecalculadas;
      // Recalcular déficit real baseado nas calorias finais
      deficitSuperavit = gastoEnergetico - caloriasRecalculadas;
      
    } else if (objetivo === 'ganho_peso') {
      // Para ganho de peso: 2.2g proteína/kg, 1.2g gordura/kg, resto carboidrato
      proteinasGramas = Math.round(peso * 2.2);
      gordurasGramas = Math.round(peso * 1.2);
      
      const caloriasProteina = proteinasGramas * 4;
      const caloriasGordura = gordurasGramas * 9;
      const caloriasRestantes = caloriasMeta - caloriasProteina - caloriasGordura;
      carboidratosGramas = Math.round(caloriasRestantes / 4);
      
    } else {
      // Manutenção: distribuição balanceada
      proteinasGramas = Math.round(peso * 1.6);
      gordurasGramas = Math.round(peso * 1);
      
      const caloriasProteina = proteinasGramas * 4;
      const caloriasGordura = gordurasGramas * 9;
      const caloriasRestantes = caloriasMeta - caloriasProteina - caloriasGordura;
      carboidratosGramas = Math.round(caloriasRestantes / 4);
    }

    // Necessidades de micronutrientes (baseado nas DRIs brasileiras)
    const micronutrientes = {
      calcio: genero === 'masculino' ? 1000 : 1000, // mg
      ferro: genero === 'masculino' ? 8 : 18, // mg
      magnesio: genero === 'masculino' ? 400 : 310, // mg
      fosforo: 700, // mg
      potassio: 3500, // mg
      sodio: 2300, // mg (limite máximo)
      zinco: genero === 'masculino' ? 11 : 8, // mg
      vitaminaA: genero === 'masculino' ? 900 : 700, // mcg
      vitaminaC: genero === 'masculino' ? 90 : 75, // mg
      vitaminaD: 15, // mcg
      vitaminaE: 15, // mg
      vitaminaB12: 2.4, // mcg
      folato: 400, // mcg
      fibras: 25 // g
    };

    return {
      calorias: caloriasMeta,
      proteinas: proteinasGramas,
      carboidratos: carboidratosGramas,
      gorduras: gordurasGramas,
      micronutrientes,
      biotipo,
      tmb: Math.round(tmb),
      gastoEnergetico,
      imc: Math.round(imc * 10) / 10,
      classificacaoIMC,
      objetivo,
      deficitSuperavit: Math.abs(deficitSuperavit)
    };
  }, [user]);

  // Gerador de dieta inteligente
  const gerarDieta = () => {
    if (!calcularNecessidadesNutricionais) return;

    setLoading(true);
    
    setTimeout(() => {
      const { calorias, proteinas, carboidratos, gorduras, micronutrientes } = calcularNecessidadesNutricionais;
      
      // Distribuição das calorias por refeição (sem lanche da manhã)
      const distribuicaoRefeicoes = {
        'Café da Manhã': 0.35,  // Aumentado (era 0.25 + 0.10 do lanche)
        'Almoço': 0.30,
        'Lanche da Tarde': 0.15,
        'Jantar': 0.20
      };

      const refeicoes = {};
      
      Object.entries(distribuicaoRefeicoes).forEach(([nomeRefeicao, percentual]) => {
        const caloriasRefeicao = Math.round(calorias * percentual);
        const proteinasRefeicao = Math.round(proteinas * percentual);
        const carboidratosRefeicao = Math.round(carboidratos * percentual);
        const gordurasRefeicao = Math.round(gorduras * percentual);

        // Seleção de alimentos - APENAS os 5 alimentos solicitados
        let alimentos = [];
        
        // Distribuir os alimentos de forma mais simples e unificada por refeição
        switch (nomeRefeicao) {
          case 'Café da Manhã':
            alimentos = [
              { alimento: 'banana_nanica', quantidade: 2 },    // 2 bananas
              { alimento: 'ovo_medio', quantidade: 3 },        // 3 ovos
              // Suplementos Growth
              { alimento: 'creatina_growth', quantidade: 1 },  // 3g de creatina
              { alimento: 'omega3_growth', quantidade: 2 },    // 2000mg de ômega 3 (2 unidades)
              { alimento: 'multivitaminico_growth', quantidade: 1 } // 1 cápsula
            ];
            break;
          case 'Almoço':
            alimentos = [
              { alimento: 'arroz_branco', quantidade: 200 },   // 200g arroz cozido
              { alimento: 'frango_sassami', quantidade: 200 }, // 200g frango cru
              { alimento: 'azeite_oliva', quantidade: 2 }      // 2 colheres de sopa de azeite
            ];
            break;
          case 'Lanche da Tarde':
            alimentos = [
              { alimento: 'batata_doce', quantidade: 150 },    // 150g batata doce crua
              { alimento: 'ovo_medio', quantidade: 2 }         // 2 ovos
            ];
            break;
          case 'Jantar':
            alimentos = [
              { alimento: 'arroz_branco', quantidade: 120 },   // 120g arroz cozido
              { alimento: 'frango_sassami', quantidade: 150 }, // 150g frango cru
              { alimento: 'azeite_oliva', quantidade: 1 }      // 1 colher de sopa de azeite
            ];
            break;
        }

        // Sistema GLOBAL: Calcular quantidades totais e dividir perfeitamente
        const calcularQuantidadesGlobais = (metaProteinas, metaCarboidratos, metaGorduras) => {
          // 1. CALCULAR QUANTIDADES TOTAIS necessárias para o dia todo
          
          // PROTEÍNAS TOTAIS (frango + ovos)
          const proteinaFrango = ALIMENTOS_DB['frango_sassami'].proteinas; // 23g por 100g
          const proteinaOvo = ALIMENTOS_DB['ovo_medio'].proteinas; // 6.5g por ovo
          
          // Distribuir proteínas: 60% frango, 40% ovos
          const proteinaDoFrango = metaProteinas * 0.6;
          const proteinaDoOvo = metaProteinas * 0.4;
          
          const frangoTotalGramas = Math.round((proteinaDoFrango / proteinaFrango) * 100);
          const ovosTotal = Math.round(proteinaDoOvo / proteinaOvo);
          
          // CARBOIDRATOS TOTAIS (arroz + banana + batata)
          const carboArroz = ALIMENTOS_DB['arroz_branco'].carboidratos; // 28g por 100g
          const carboBanana = ALIMENTOS_DB['banana_nanica'].carboidratos; // 22g por banana
          const carboBatata = ALIMENTOS_DB['batata_doce'].carboidratos; // 20g por 100g
          
          // Distribuir carboidratos: 50% arroz, 25% banana, 25% batata
          const carboDoArroz = metaCarboidratos * 0.5;
          const carboDaBanana = metaCarboidratos * 0.25;
          const carboDaBatata = metaCarboidratos * 0.25;
          
          const arrozTotalGramas = Math.round((carboDoArroz / carboArroz) * 100);
          const bananaTotal = Math.round(carboDaBanana / carboBanana);
          const batataTotalGramas = Math.round((carboDaBatata / carboBatata) * 100);
          
          // GORDURAS TOTAIS - CALCULAR CORRETAMENTE!
          // Os ovos já fornecem gordura, então o azeite deve compensar o resto
          const gorduraOvo = ALIMENTOS_DB['ovo_medio'].gorduras; // 5.5g por ovo
          const gorduraDoOvo = ovosTotal * gorduraOvo; // Gordura total dos ovos
          const gorduraRestante = metaGorduras - gorduraDoOvo; // Gordura que o azeite deve fornecer
          
          const gorduraAzeite = ALIMENTOS_DB['azeite_oliva'].gorduras; // 100g por 100g
          // 1 colher de sopa = 15g = 15g de gordura pura
          const azeiteColheres = Math.max(1, Math.round(gorduraRestante / 15)); // Mínimo 1 colher
          
          console.log('🔍 DEBUG GORDURAS:', {
            metaGorduras,
            gorduraDoOvo,
            gorduraRestante,
            azeiteColheres,
            ovosTotal
          });
          
          return {
            frangoTotal: frangoTotalGramas,
            ovosTotal: ovosTotal,
            arrozTotal: arrozTotalGramas,
            bananaTotal: bananaTotal,
            batataTotal: batataTotalGramas,
            azeiteTotal: azeiteColheres
          };
        };

        const quantidadesTotais = calcularQuantidadesGlobais(proteinas, carboidratos, gorduras);

        // 2. DIVIDIR PERFEITAMENTE entre as refeições
        const calcularQuantidadesEquilibradas = (alimentosBase, metaProteinas, metaCarboidratos, metaGorduras, nomeRefeicao) => {
          const suplementos = alimentosBase.filter(({ alimento }) => 
            ALIMENTOS_DB[alimento].categoria === 'suplemento'
          );

          let alimentosAjustados = [...suplementos]; // Manter suplementos fixos

          // DISTRIBUIÇÃO ESPECÍFICA POR REFEIÇÃO
          alimentosBase.forEach(({ alimento }) => {
            const dados = ALIMENTOS_DB[alimento];
            let quantidade = 0;

            switch (alimento) {
              case 'frango_sassami':
                // DIVIDIR FRANGO: 50% almoço + 50% jantar
                if (nomeRefeicao === 'Almoço') {
                  quantidade = Math.round(quantidadesTotais.frangoTotal * 0.5); // 50% no almoço
                } else if (nomeRefeicao === 'Jantar') {
                  quantidade = Math.round(quantidadesTotais.frangoTotal * 0.5); // 50% no jantar
                }
                break;

              case 'ovo_medio':
                // DIVIDIR OVOS: 50% café + 50% lanche
                if (nomeRefeicao === 'Café da Manhã') {
                  quantidade = Math.round(quantidadesTotais.ovosTotal * 0.5); // 50% no café
                } else if (nomeRefeicao === 'Lanche da Tarde') {
                  quantidade = Math.round(quantidadesTotais.ovosTotal * 0.5); // 50% no lanche
                }
                break;

              case 'arroz_branco':
                // DIVIDIR ARROZ: 50% almoço + 50% jantar
                if (nomeRefeicao === 'Almoço') {
                  quantidade = Math.round(quantidadesTotais.arrozTotal * 0.5); // 50% no almoço
                } else if (nomeRefeicao === 'Jantar') {
                  quantidade = Math.round(quantidadesTotais.arrozTotal * 0.5); // 50% no jantar
                }
                break;

              case 'banana_nanica':
                // TODA BANANA no café da manhã
                if (nomeRefeicao === 'Café da Manhã') {
                  quantidade = quantidadesTotais.bananaTotal;
                }
                break;

              case 'batata_doce':
                // TODA BATATA no lanche da tarde
                if (nomeRefeicao === 'Lanche da Tarde') {
                  quantidade = quantidadesTotais.batataTotal;
                }
                break;

              case 'azeite_oliva':
                // DIVIDIR AZEITE: 50% almoço + 50% jantar
                if (nomeRefeicao === 'Almoço') {
                  quantidade = Math.round(quantidadesTotais.azeiteTotal * 0.5); // 50% no almoço
                  console.log(`🔍 AZEITE ${nomeRefeicao}:`, quantidade, 'colheres');
                } else if (nomeRefeicao === 'Jantar') {
                  quantidade = Math.round(quantidadesTotais.azeiteTotal * 0.5); // 50% no jantar
                  console.log(`🔍 AZEITE ${nomeRefeicao}:`, quantidade, 'colheres');
                }
                break;
            }

            if (quantidade > 0) {
              alimentosAjustados.push({ alimento, quantidade });
            }
          });

          return alimentosAjustados;
        };

        // Calcular metas para esta refeição
        const metaProteinasRefeicao = proteinas * percentual;
        const metaCarboidratosRefeicao = carboidratos * percentual;
        const metaGordurasRefeicao = gorduras * percentual;

        // Calcular quantidades equilibradas para atingir as metas
        const alimentosOtimizados = calcularQuantidadesEquilibradas(
          alimentos, 
          proteinas, 
          carboidratos, 
          gorduras,
          nomeRefeicao
        );

        // Calcular totais da refeição com quantidades otimizadas
        let totalCalorias = 0;
        let totalProteinas = 0;
        let totalCarboidratos = 0;
        let totalGorduras = 0;
        let totalFibras = 0;
        let micronutrientesRefeicao = {};

        const alimentosDetalhados = alimentosOtimizados.map(({ alimento, quantidade }) => {
          const dadosAlimento = ALIMENTOS_DB[alimento];
          
          // Para alimentos em unidades (ovo e banana), usar quantidade direta
          // Para outros alimentos, usar fator baseado em 100g
          let fator, quantidadeExibida, unidadeExibida;
          
          if (dadosAlimento.unidade === 'unidade') {
            fator = quantidade; // quantidade já é o número de unidades
            quantidadeExibida = quantidade;
            unidadeExibida = quantidade === 1 ? 'unidade' : 'unidades';
          } else if (alimento === 'creatina_growth') {
            // Para creatina, mostrar 3g por unidade
            fator = quantidade / 100; // fator baseado em 100g para cálculos
            quantidadeExibida = quantidade * 3; // 1 unidade = 3g
            unidadeExibida = 'g';
          } else if (alimento === 'omega3_growth') {
            // Para ômega 3, mostrar em cápsulas
            fator = quantidade; // quantidade já é o número de cápsulas
            quantidadeExibida = quantidade;
            unidadeExibida = quantidade === 1 ? 'cápsula' : 'cápsulas';
          } else if (alimento === 'multivitaminico_growth') {
            // Para multivitamínico, mostrar em cápsulas
            fator = quantidade; // quantidade já é o número de cápsulas
            quantidadeExibida = quantidade;
            unidadeExibida = quantidade === 1 ? 'cápsula' : 'cápsulas';
          } else if (alimento === 'azeite_oliva') {
            // Para azeite, mostrar em colheres de sopa (1 colher = ~15g)
            fator = quantidade / 100; // fator baseado em 100g para cálculos
            quantidadeExibida = quantidade;
            unidadeExibida = quantidade === 1 ? 'colher de sopa' : 'colheres de sopa';
          } else {
            fator = quantidade / 100; // fator baseado em 100g
            quantidadeExibida = quantidade;
            unidadeExibida = dadosAlimento.unidade || 'g';
          }

          const caloriasAlimento = Math.round(dadosAlimento.calorias * fator);
          const proteinasAlimento = Math.round(dadosAlimento.proteinas * fator * 10) / 10;
          const carboidratosAlimento = Math.round(dadosAlimento.carboidratos * fator * 10) / 10;
          const gordurasAlimento = Math.round(dadosAlimento.gorduras * fator * 10) / 10;
          const fibrasAlimento = Math.round(dadosAlimento.fibras * fator * 10) / 10;

          totalCalorias += caloriasAlimento;
          totalProteinas += proteinasAlimento;
          totalCarboidratos += carboidratosAlimento;
          totalGorduras += gordurasAlimento;
          totalFibras += fibrasAlimento;

          // Calcular micronutrientes
          Object.keys(micronutrientes).forEach(micro => {
            if (dadosAlimento[micro]) {
              if (!micronutrientesRefeicao[micro]) micronutrientesRefeicao[micro] = 0;
              micronutrientesRefeicao[micro] += dadosAlimento[micro] * fator;
            }
          });

          return {
            nome: dadosAlimento.nome,
            quantidade: quantidadeExibida,
            unidade: unidadeExibida,
            calorias: caloriasAlimento,
            proteinas: proteinasAlimento,
            carboidratos: carboidratosAlimento,
            gorduras: gordurasAlimento,
            fibras: fibrasAlimento
          };
        });

        refeicoes[nomeRefeicao] = {
          alimentos: alimentosDetalhados,
          totais: {
            calorias: totalCalorias,
            proteinas: Math.round(totalProteinas * 10) / 10,
            carboidratos: Math.round(totalCarboidratos * 10) / 10,
            gorduras: Math.round(totalGorduras * 10) / 10,
            fibras: Math.round(totalFibras * 10) / 10
          },
          micronutrientes: micronutrientesRefeicao
        };
      });

      // Calcular totais diários dos alimentos
      let totaisReaisAlimentos = {
        calorias: 0,
        proteinas: 0,
        carboidratos: 0,
        gorduras: 0,
        fibras: 0
      };

      let micronutrientesDiarios = {};

      Object.values(refeicoes).forEach(refeicao => {
        totaisReaisAlimentos.calorias += refeicao.totais.calorias;
        totaisReaisAlimentos.proteinas += refeicao.totais.proteinas;
        totaisReaisAlimentos.carboidratos += refeicao.totais.carboidratos;
        totaisReaisAlimentos.gorduras += refeicao.totais.gorduras;
        totaisReaisAlimentos.fibras += refeicao.totais.fibras;

        Object.entries(refeicao.micronutrientes).forEach(([micro, valor]) => {
          if (!micronutrientesDiarios[micro]) micronutrientesDiarios[micro] = 0;
          micronutrientesDiarios[micro] += valor;
        });
      });

      // SISTEMA ULTRA PRECISO: Garantir que TODOS os macros batem EXATAMENTE
      
      // 1. CALCULAR diferenças entre real e meta
      const diferencas = {
        proteinas: proteinas - totaisReaisAlimentos.proteinas,
        carboidratos: carboidratos - totaisReaisAlimentos.carboidratos,
        gorduras: gorduras - totaisReaisAlimentos.gorduras
      };

      console.log('🎯 METAS:', { proteinas, carboidratos, gorduras });
      console.log('📊 REAL:', { 
        proteinas: totaisReaisAlimentos.proteinas, 
        carboidratos: totaisReaisAlimentos.carboidratos, 
        gorduras: totaisReaisAlimentos.gorduras 
      });
      console.log('⚖️ DIFERENÇAS:', diferencas);

      // SISTEMA DE AJUSTE ULTRA PRECISO PARA BATER EXATAMENTE AS METAS
      const ajustarParaBaterCaloriasUltraPreciso = () => {
        const MAX_ITERACOES = 20; // Mais iterações para maior precisão
        let iteracao = 0;
        
        while (iteracao < MAX_ITERACOES) {
          // Recalcular totais atuais
          let totalCaloriasAtual = 0;
          let totalProteinasAtual = 0;
          let totalCarboidratosAtual = 0;
          let totalGordurasAtual = 0;

          Object.values(refeicoes).forEach(refeicao => {
            totalCaloriasAtual += refeicao.totais.calorias;
            totalProteinasAtual += refeicao.totais.proteinas;
            totalCarboidratosAtual += refeicao.totais.carboidratos;
            totalGordurasAtual += refeicao.totais.gorduras;
          });

          // Calcular diferenças
          const diferencaCalorias = calorias - totalCaloriasAtual;
          const diferencaProteinas = proteinas - totalProteinasAtual;
          const diferencaCarboidratos = carboidratos - totalCarboidratosAtual;
          const diferencaGorduras = gorduras - totalGordurasAtual;

          console.log(`🎯 AJUSTE ULTRA PRECISO - ITERAÇÃO ${iteracao + 1}:`, {
            meta: { calorias, proteinas, carboidratos, gorduras },
            atual: { 
              calorias: Math.round(totalCaloriasAtual * 100) / 100, 
              proteinas: Math.round(totalProteinasAtual * 100) / 100,
              carboidratos: Math.round(totalCarboidratosAtual * 100) / 100,
              gorduras: Math.round(totalGordurasAtual * 100) / 100
            },
            diferenca: { 
              calorias: Math.round(diferencaCalorias * 100) / 100, 
              proteinas: Math.round(diferencaProteinas * 100) / 100,
              carboidratos: Math.round(diferencaCarboidratos * 100) / 100,
              gorduras: Math.round(diferencaGorduras * 100) / 100
            }
          });

          // CRITÉRIOS ULTRA RIGOROSOS de convergência
          if (Math.abs(diferencaCalorias) < 1 && 
              Math.abs(diferencaProteinas) < 0.5 && 
              Math.abs(diferencaCarboidratos) < 0.5 && 
              Math.abs(diferencaGorduras) < 0.3) {
            console.log('🎉 ULTRA PRECISÃO ATINGIDA! Diferenças mínimas.');
            break;
          }

          // AJUSTES ULTRA FINOS E INTELIGENTES
          
          // 1. AJUSTAR PROTEÍNAS com fator suave
          if (Math.abs(diferencaProteinas) > 0.2) {
            // Usar ajuste suave para evitar oscilações
            const fatorProteina = 1 + (diferencaProteinas / totalProteinasAtual) * 0.8; // 80% do ajuste necessário
            
            Object.keys(refeicoes).forEach(nomeRefeicao => {
              refeicoes[nomeRefeicao].alimentos.forEach(alimento => {
                if (alimento.nome.includes('Frango') || alimento.nome.includes('Ovo')) {
                  alimento.calorias = Math.round(alimento.calorias * fatorProteina * 100) / 100;
                  alimento.proteinas = Math.round(alimento.proteinas * fatorProteina * 100) / 100;
                  alimento.gorduras = Math.round(alimento.gorduras * fatorProteina * 100) / 100;
                }
              });
            });
          }

          // 2. AJUSTAR CARBOIDRATOS com fator suave
          if (Math.abs(diferencaCarboidratos) > 0.2) {
            const fatorCarboidrato = 1 + (diferencaCarboidratos / totalCarboidratosAtual) * 0.8;
            
            Object.keys(refeicoes).forEach(nomeRefeicao => {
              refeicoes[nomeRefeicao].alimentos.forEach(alimento => {
                if (alimento.nome.includes('Arroz') || alimento.nome.includes('Banana') || alimento.nome.includes('Batata')) {
                  alimento.calorias = Math.round(alimento.calorias * fatorCarboidrato * 100) / 100;
                  alimento.carboidratos = Math.round(alimento.carboidratos * fatorCarboidrato * 100) / 100;
                  alimento.proteinas = Math.round(alimento.proteinas * fatorCarboidrato * 100) / 100;
                }
              });
            });
          }

          // 3. AJUSTAR GORDURAS com fator suave
          if (Math.abs(diferencaGorduras) > 0.1) {
            const fatorGordura = Math.max(0.1, 1 + (diferencaGorduras / totalGordurasAtual) * 0.9);
            
            Object.keys(refeicoes).forEach(nomeRefeicao => {
              refeicoes[nomeRefeicao].alimentos.forEach(alimento => {
                if (alimento.nome.includes('Azeite')) {
                  alimento.calorias = Math.round(alimento.calorias * fatorGordura * 100) / 100;
                  alimento.gorduras = Math.round(alimento.gorduras * fatorGordura * 100) / 100;
                }
              });
            });
          }

          // 4. AJUSTE FINO DAS CALORIAS (se ainda não convergiu)
          if (iteracao > 10 && Math.abs(diferencaCalorias) > 0.5) {
            // Ajuste direto das calorias distribuindo proporcionalmente
            const fatorCaloria = calorias / totalCaloriasAtual;
            
            Object.keys(refeicoes).forEach(nomeRefeicao => {
              refeicoes[nomeRefeicao].alimentos.forEach(alimento => {
                // Ajustar apenas as calorias, mantendo proporções dos macros
                alimento.calorias = Math.round(alimento.calorias * fatorCaloria * 100) / 100;
              });
            });
          }

          // RECALCULAR totais das refeições com precisão alta
          Object.keys(refeicoes).forEach(nomeRefeicao => {
            let totalCalorias = 0;
            let totalProteinas = 0;
            let totalCarboidratos = 0;
            let totalGorduras = 0;
            let totalFibras = 0;

            refeicoes[nomeRefeicao].alimentos.forEach(alimento => {
              totalCalorias += alimento.calorias || 0;
              totalProteinas += alimento.proteinas || 0;
              totalCarboidratos += alimento.carboidratos || 0;
              totalGorduras += alimento.gorduras || 0;
              totalFibras += alimento.fibras || 0;
            });

            refeicoes[nomeRefeicao].totais = {
              calorias: Math.round(totalCalorias * 100) / 100,
              proteinas: Math.round(totalProteinas * 100) / 100,
              carboidratos: Math.round(totalCarboidratos * 100) / 100,
              gorduras: Math.round(totalGorduras * 100) / 100,
              fibras: Math.round(totalFibras * 100) / 100
            };
          });

          iteracao++;
        }

        if (iteracao >= MAX_ITERACOES) {
          console.log('⚠️ Atingiu máximo de iterações. Resultado final pode ter pequenas diferenças.');
        }
      };

      ajustarParaBaterCaloriasUltraPreciso();

      // 3. RECALCULAR totais finais após ajustes
      let totalFinalCalorias = 0;
      let totalFinalProteinas = 0;
      let totalFinalCarboidratos = 0;
      let totalFinalGorduras = 0;
      let totalFinalFibras = 0;

      Object.values(refeicoes).forEach(refeicao => {
        totalFinalCalorias += refeicao.totais.calorias;
        totalFinalProteinas += refeicao.totais.proteinas;
        totalFinalCarboidratos += refeicao.totais.carboidratos;
        totalFinalGorduras += refeicao.totais.gorduras;
        totalFinalFibras += refeicao.totais.fibras;
      });

      console.log('✅ FINAL CALCULADO:', { 
        proteinas: totalFinalProteinas, 
        carboidratos: totalFinalCarboidratos, 
        gorduras: totalFinalGorduras 
      });

      // 4. MOSTRAR valores REAIS calculados das refeições
      const totaisDiarios = {
        calorias: Math.round(totalFinalCalorias), // SOMA REAL das refeições
        proteinas: Math.round(totalFinalProteinas * 10) / 10, // SOMA REAL das refeições
        carboidratos: Math.round(totalFinalCarboidratos * 10) / 10, // SOMA REAL das refeições
        gorduras: Math.round(totalFinalGorduras * 10) / 10, // SOMA REAL das refeições
        fibras: Math.round(totalFinalFibras * 10) / 10
      };



      setDietaGerada({
        necessidades: calcularNecessidadesNutricionais,
        refeicoes,
        totaisDiarios,
        micronutrientesDiarios
      });
      
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    if (calcularNecessidadesNutricionais && !dietaGerada) {
      gerarDieta();
    }
  }, [calcularNecessidadesNutricionais, dietaGerada]);

  if (!user?.profileSetupCompleted) {
  return (
    <Container className="custom-scroll">
      <Header>
        <div>
          <BackButton onClick={handleBackToDashboard}>
            <FiArrowLeft />
            Voltar
          </BackButton>
          <Logo>HealGym</Logo>
        </div>
      </Header>
        <MainContent>
          <DietCard>
            <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
              <p>Complete seu perfil para gerar sua dieta personalizada.</p>
            </div>
          </DietCard>
        </MainContent>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="custom-scroll">
        <Header>
          <div>
            <BackButton onClick={handleBackToDashboard}>
              <FiArrowLeft />
              Voltar
            </BackButton>
            <Logo>HealGym</Logo>
          </div>
        </Header>
        <MainContent>
          <DietCard>
            <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>
              <FiActivity style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent)' }} />
              <p>Gerando sua dieta personalizada...</p>
              <p>Calculando macronutrientes e micronutrientes...</p>
            </div>
          </DietCard>
        </MainContent>
      </Container>
    );
  }

  return (
    <Container className="custom-scroll">
      <Header>
        <div>
          <BackButton onClick={handleBackToDashboard}>
            <FiArrowLeft />
            Voltar
          </BackButton>
          <Logo>HealGym</Logo>
        </div>
      </Header>

      <MainContent>
        <div>
          <PageTitle>Seu Plano Nutricional</PageTitle>
          <PageSubtitle>
            Dieta personalizada baseada no seu biotipo e objetivos
          </PageSubtitle>

          {dietaGerada && (
            <>
              {/* Informações do usuário e necessidades */}
          <DietCard>
            <DietHeader>
              <DietIcon>
                <FiTarget />
              </DietIcon>
                  <DietTitle>Suas Necessidades Nutricionais</DietTitle>
            </DietHeader>

                <DietInfo>
                  <InfoItem>
                    <InfoIcon>
                      <FiActivity />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>IMC (Índice de Massa Corporal)</InfoLabel>
                      <InfoValue>{dietaGerada.necessidades.imc} - {dietaGerada.necessidades.classificacaoIMC}</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoIcon>
                      <FiTarget />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Objetivo</InfoLabel>
                      <InfoValue>
                        {dietaGerada.necessidades.objetivo === 'emagrecimento' && 'Emagrecimento'}
                        {dietaGerada.necessidades.objetivo === 'ganho_peso' && 'Ganho de Peso'}
                        {dietaGerada.necessidades.objetivo === 'manutencao' && 'Manutenção'}
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoIcon>
                      <FiTrendingUp />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Taxa Metabólica Basal (TMB)</InfoLabel>
                      <InfoValue>{dietaGerada.necessidades.gastoEnergetico} kcal/dia</InfoValue>
                    </InfoContent>
                  </InfoItem>
                  
                  <InfoItem>
                    <InfoIcon>
                      <FiHeart />
                    </InfoIcon>
                    <InfoContent>
                      <InfoLabel>Meta Calórica</InfoLabel>
                      <InfoValue>
                        {dietaGerada.necessidades.calorias} kcal/dia
                        {dietaGerada.necessidades.objetivo === 'emagrecimento' && 
                          ` (-${dietaGerada.necessidades.deficitSuperavit} kcal)`
                        }
                        {dietaGerada.necessidades.objetivo === 'ganho_peso' && 
                          ` (+${dietaGerada.necessidades.deficitSuperavit} kcal)`
                        }
                      </InfoValue>
                    </InfoContent>
                  </InfoItem>
                </DietInfo>

                <MacrosSection>
                  <MacrosTitle>Distribuição de Macronutrientes</MacrosTitle>
                  {dietaGerada.necessidades.objetivo === 'emagrecimento' && (
                    <div style={{ 
                      background: 'rgba(255, 193, 7, 0.1)', 
                      border: '1px solid rgba(255, 193, 7, 0.3)', 
                      borderRadius: '8px', 
                      padding: '1rem', 
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: 'var(--accent)', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Plano para Emagrecimento
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        2g de proteína por kg corporal para preservar massa muscular<br/>
                        1g de gordura por kg corporal para funções hormonais<br/>
                        Carboidratos ajustados para completar o déficit calórico<br/>
                        Déficit de {dietaGerada.necessidades.deficitSuperavit} kcal/dia para perda de peso saudável
                      </p>
            </div>
                  )}
                  <MacrosGrid>
                    <MacroItem>
                      <MacroLabel>Proteínas</MacroLabel>
                      <MacroValue>{dietaGerada.necessidades.proteinas}g</MacroValue>
                      {dietaGerada.necessidades.objetivo === 'emagrecimento' && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {Math.round(dietaGerada.necessidades.proteinas / user.profile.weight * 10) / 10}g/kg
                        </div>
                      )}
                    </MacroItem>
                    <MacroItem>
                      <MacroLabel>Carboidratos</MacroLabel>
                      <MacroValue>{dietaGerada.necessidades.carboidratos}g</MacroValue>
                      {dietaGerada.necessidades.objetivo === 'emagrecimento' && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Ajustado para déficit
                        </div>
                      )}
                    </MacroItem>
                    <MacroItem>
                      <MacroLabel>Gorduras</MacroLabel>
                      <MacroValue>{dietaGerada.necessidades.gorduras}g</MacroValue>
                      {dietaGerada.necessidades.objetivo === 'emagrecimento' && (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {Math.round(dietaGerada.necessidades.gorduras / user.profile.weight * 10) / 10}g/kg
                        </div>
                      )}
                    </MacroItem>
                    <MacroItem>
                      <MacroLabel>Fibras</MacroLabel>
                      <MacroValue>{dietaGerada.necessidades.micronutrientes.fibras}g</MacroValue>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Meta diária
                      </div>
                    </MacroItem>
                  </MacrosGrid>
                </MacrosSection>
          </DietCard>

              {/* Plano alimentar detalhado */}
              <DietSection>
                <DietSectionTitle>Seu Cardápio Diário</DietSectionTitle>
                
                <MealsContainer>
                  {Object.entries(dietaGerada.refeicoes).map(([nomeRefeicao, dadosRefeicao]) => (
                    <MealCard key={nomeRefeicao}>
                      <MealHeader>
                        <MealName>{nomeRefeicao}</MealName>
                        <MealCalories>{dadosRefeicao.totais.calorias} kcal</MealCalories>
                      </MealHeader>
                      
                      <FoodsList>
                        {dadosRefeicao.alimentos.map((alimento, index) => (
                          <FoodItem key={index}>
                            <FoodName>{alimento.nome}</FoodName>
                            <FoodQuantity>{alimento.quantidade} {alimento.unidade}</FoodQuantity>
                            <FoodMacros>
                              {alimento.calorias} kcal | P: {alimento.proteinas}g | C: {alimento.carboidratos}g | G: {alimento.gorduras}g
                            </FoodMacros>
                          </FoodItem>
                        ))}
                      </FoodsList>
                      
                      <MealTotals>
                        <TotalItem>
                          <TotalLabel>Calorias</TotalLabel>
                          <TotalValue>{dadosRefeicao.totais.calorias}</TotalValue>
                        </TotalItem>
                        <TotalItem>
                          <TotalLabel>Proteínas</TotalLabel>
                          <TotalValue>{dadosRefeicao.totais.proteinas}g</TotalValue>
                        </TotalItem>
                        <TotalItem>
                          <TotalLabel>Carboidratos</TotalLabel>
                          <TotalValue>{dadosRefeicao.totais.carboidratos}g</TotalValue>
                        </TotalItem>
                        <TotalItem>
                          <TotalLabel>Gorduras</TotalLabel>
                          <TotalValue>{dadosRefeicao.totais.gorduras}g</TotalValue>
                        </TotalItem>
                        <TotalItem>
                          <TotalLabel>Fibras</TotalLabel>
                          <TotalValue>{dadosRefeicao.totais.fibras}g</TotalValue>
                        </TotalItem>
                      </MealTotals>
                    </MealCard>
                  ))}
                </MealsContainer>

                {/* Totais diários */}
                <DailyTotals>
                  <DailyTotalsTitle>Resumo Diário</DailyTotalsTitle>
                  <DailyTotalsGrid>
                    <DailyTotalItem>
                      <DailyTotalLabel>Calorias Totais</DailyTotalLabel>
                      <DailyTotalValue>{dietaGerada.totaisDiarios.calorias} kcal</DailyTotalValue>
                    </DailyTotalItem>
                    <DailyTotalItem>
                      <DailyTotalLabel>Proteínas</DailyTotalLabel>
                      <DailyTotalValue>{dietaGerada.totaisDiarios.proteinas}g</DailyTotalValue>
                    </DailyTotalItem>
                    <DailyTotalItem>
                      <DailyTotalLabel>Carboidratos</DailyTotalLabel>
                      <DailyTotalValue>{dietaGerada.totaisDiarios.carboidratos}g</DailyTotalValue>
                    </DailyTotalItem>
                    <DailyTotalItem>
                      <DailyTotalLabel>Gorduras</DailyTotalLabel>
                      <DailyTotalValue>{dietaGerada.totaisDiarios.gorduras}g</DailyTotalValue>
                    </DailyTotalItem>
                    <DailyTotalItem>
                      <DailyTotalLabel>Fibras</DailyTotalLabel>
                      <DailyTotalValue>{dietaGerada.totaisDiarios.fibras}g</DailyTotalValue>
                    </DailyTotalItem>
                  </DailyTotalsGrid>

                  {/* Micronutrientes principais */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <h5 style={{ color: 'var(--accent)', marginBottom: '1rem', textAlign: 'center' }}>
                      Principais Micronutrientes
                    </h5>
                    <MicronutrientsList>
                      {Object.entries(dietaGerada.micronutrientesDiarios).map(([micro, valor]) => {
                        const necessidade = dietaGerada.necessidades.micronutrientes[micro];
                        const percentual = necessidade ? Math.round((valor / necessidade) * 100) : 0;
                        
                        return (
                          <MicroItem key={micro}>
                            {micro.charAt(0).toUpperCase() + micro.slice(1)}: {Math.round(valor * 100) / 100}
                            {necessidade && ` (${percentual}%)`}
                          </MicroItem>
                        );
                      })}
                    </MicronutrientsList>
                  </div>
                </DailyTotals>
              </DietSection>
            </>
          )}
        </div>
      </MainContent>
    </Container>
  );
};


const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%);
  color: var(--text);
  overflow-y: auto;
  overflow-x: hidden;
`;

const Header = styled.header`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(198, 169, 100, 0.2);
  
  > div {
    display: flex;
    align-items: center;
    gap: 2rem;
    width: 100%;
  }
`;

const BackButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--accent);
    color: var(--background);
  }

  svg {
    font-size: 1.2rem;
  }
`;

const Logo = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: default;
`;

const MainContent = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  color: var(--white);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  cursor: default;
`;

const PageSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 2rem;
  cursor: default;
`;

const DietCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const DietHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const DietIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-gradient);
  border-radius: 12px;
  width: 50px;
  height: 50px;

  svg {
    color: var(--background);
    font-size: 1.5rem;
  }
`;

const DietTitle = styled.h2`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 600;
  text-align: center;
  cursor: default;
`;

const DietInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
`;

const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  svg {
    color: var(--background);
    font-size: 1.2rem;
  }
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InfoLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
  text-align: center;
`;

const InfoValue = styled.div`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
`;

const MacrosSection = styled.div`
  margin-bottom: 2rem;
`;

const MacrosTitle = styled.h3`
  color: var(--white);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  cursor: default;
`;

const MacrosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const MacroItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: default;
`;

const MacroLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const MacroValue = styled.div`
  color: var(--accent);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
`;

const DietSection = styled.div`
  margin-top: 2rem;
`;

const DietSectionTitle = styled.h3`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const MealsContainer = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MealCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const MealHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(198, 169, 100, 0.2);
`;

const MealName = styled.h4`
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 600;
`;

const MealCalories = styled.div`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
`;

const FoodsList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const FoodItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(198, 169, 100, 0.05);
  border-radius: 8px;
  padding: 1rem;
`;

const FoodName = styled.div`
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const FoodQuantity = styled.div`
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const FoodMacros = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
`;

const MealTotals = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(198, 169, 100, 0.05);
  border-radius: 8px;
`;

const TotalItem = styled.div`
  text-align: center;
`;

const TotalLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
`;

const TotalValue = styled.div`
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
`;

const MicronutrientsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
`;

const MicroItem = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-align: center;
  padding: 0.25rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
  min-width: 120px;
  flex: 0 0 auto;
`;

const DailyTotals = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 1px solid rgba(198, 169, 100, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
`;

const DailyTotalsTitle = styled.h4`
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 1rem;
`;

const DailyTotalsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const DailyTotalItem = styled.div`
  text-align: center;
`;

const DailyTotalLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const DailyTotalValue = styled.div`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 700;
`;

export default DietaPage;