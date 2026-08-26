import express from 'express';
import Workout, { WORKOUT_GROUPS } from '../models/Workout.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Base de dados de exercícios por equipamento e porção muscular
const exerciseDatabase = {
  PEITO: {
    superior: [
      {
        nome: 'Supino Inclinado com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Descer controlado até o peito, empurrar explosivo',
      },
      {
        nome: 'Supino Inclinado com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Amplitude completa, halteres se tocam no topo',
      },
      {
        nome: 'Crucifixo Inclinado com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Cotovelos levemente flexionados, máximo alongamento',
      },
    ],
    medio: [
      {
        nome: 'Supino Reto com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Barra na linha do mamilo, escápulas retraídas',
      },
      {
        nome: 'Supino Reto com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Rotação neutra, descer até linha do peito',
      },
      {
        nome: 'Flexão com Pés Elevados',
        equipamento: ['banco'],
        tecnica: 'Corpo alinhado, descer até quase tocar o chão',
      },
    ],
    inferior: [
      {
        nome: 'Supino Declinado com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Foco na porção inferior, explosão na subida',
      },
      {
        nome: 'Supino Declinado com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Amplitude completa, contração no topo',
      },
      {
        nome: 'Mergulho entre Bancos',
        equipamento: ['banco'],
        tecnica: 'Tronco inclinado à frente, descer controlado',
      },
    ],
    interno: [
      {
        nome: 'Crucifixo Reto com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Apertar no topo por 1 segundo',
      },
      {
        nome: 'Cross Over na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Mãos cruzam na frente, contração máxima',
      },
      {
        nome: 'Press Pegada Fechada com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Halteres juntos durante todo movimento',
      },
    ],
    externo: [
      {
        nome: 'Supino com Halteres Abertura Ampla',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Halteres descem além da linha do corpo',
      },
      {
        nome: 'Abertura Inclinada Amplitude Máxima',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Máximo alongamento, cotovelos travados',
      },
    ],
    estiramento: [
      {
        nome: 'Pullover com Halter',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Braços quase retos, máximo alongamento posterior',
      },
      {
        nome: 'Pullover Inclinado com Halter',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Banco a 30°, alongamento controlado',
      },
    ],
  },
  COSTAS: {
    lats_largura: [
      {
        nome: 'Puxada Frontal Pegada Aberta',
        equipamento: ['polia_alta'],
        tecnica: 'Puxar até linha do peito, cotovelos para trás',
      },
      {
        nome: 'Remada Curvada Pegada Aberta',
        equipamento: ['barra'],
        tecnica: 'Torso a 45°, puxar até abdômen',
      },
      {
        nome: 'Pulldown com Pegada Supinada',
        equipamento: ['polia_alta'],
        tecnica: 'Pegada invertida, contração máxima',
      },
    ],
    lats_espessura: [
      {
        nome: 'Remada Curvada com Barra',
        equipamento: ['barra'],
        tecnica: 'Pegada pronada, puxar para linha do umbigo',
      },
      {
        nome: 'Remada Unilateral com Halter',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Joelho e mão no banco, puxar até cintura',
      },
      {
        nome: 'Remada Cavalinho com Barra',
        equipamento: ['barra'],
        tecnica: 'Pegada neutra simulada, tronco paralelo ao chão',
      },
    ],
    romboides: [
      {
        nome: 'Remada na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Puxar até abdômen, escápulas juntas',
      },
      {
        nome: 'Remada Invertida',
        equipamento: ['barra'],
        tecnica: 'Corpo suspenso, puxar peito até a barra',
      },
      {
        nome: 'Remada Alta com Barra',
        equipamento: ['barra'],
        tecnica: 'Puxar até linha do peito, cotovelos altos',
      },
    ],
    trapezio_medio: [
      {
        nome: 'Remada Alta na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Puxar até peito, apertar escápulas',
      },
      {
        nome: 'Crucifixo Inverso com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Tronco apoiado, abrir até alinhar com corpo',
      },
    ],
    trapezio_inferior: [
      {
        nome: 'Pulldown Reto Braços Estendidos',
        equipamento: ['polia_alta'],
        tecnica: 'Braços retos, puxar até quadril',
      },
      {
        nome: 'Remada Y com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Banco inclinado, braços em Y',
      },
    ],
    deltoide_posterior: [
      {
        nome: 'Crucifixo Inverso Inclinado',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Tronco a 45°, abrir lateralmente',
      },
      {
        nome: 'Face Pull na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Puxar para face, rotação externa no final',
      },
    ],
    lombar: [
      {
        nome: 'Levantamento Terra Romeno',
        equipamento: ['barra'],
        tecnica: 'Joelhos levemente flexionados, descer controlado',
      },
      {
        nome: 'Good Morning com Barra',
        equipamento: ['barra'],
        tecnica: 'Barra nas costas, flexionar quadril mantendo costas retas',
      },
      {
        nome: 'Hiperextensão Isométrica',
        equipamento: ['banco'],
        tecnica: 'Deitado no banco, segurar posição de prancha inversa',
      },
    ],
  },
  OMBROS: {
    anterior: [
      {
        nome: 'Desenvolvimento com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Subir explosivo, descer controlado até queixo',
      },
      {
        nome: 'Desenvolvimento com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Rotação neutra, empurrar verticalmente',
      },
      {
        nome: 'Elevação Frontal com Barra',
        equipamento: ['barra'],
        tecnica: 'Subir até altura dos olhos, controlar descida',
      },
      {
        nome: 'Elevação Frontal Alternada com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Um braço por vez, evitar balanço',
      },
    ],
    lateral: [
      {
        nome: 'Elevação Lateral com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Cotovelos levemente flexionados, subir até altura dos ombros',
      },
      {
        nome: 'Elevação Lateral na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Puxar lateralmente, tensão constante',
      },
      {
        nome: 'Desenvolvimento Arnold',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Rotação durante movimento, amplitude completa',
      },
    ],
    posterior: [
      {
        nome: 'Crucifixo Inverso com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Tronco inclinado, abrir até alinhar com corpo',
      },
      {
        nome: 'Face Pull na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Puxar para face, rotação externa máxima',
      },
      {
        nome: 'Elevação Lateral Curvado',
        equipamento: ['halteres'],
        tecnica: 'Tronco paralelo ao chão, elevar lateralmente',
      },
    ],
    manguito: [
      {
        nome: 'Rotação Externa na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Cotovelo colado ao corpo, rotação externa lenta',
      },
      {
        nome: 'Rotação L com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Deitado de lado, rotação do antebraço',
      },
    ],
  },
  TRICEPS: {
    longa: [
      {
        nome: 'Tríceps Testa com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Cotovelos fixos, descer até testa',
      },
      {
        nome: 'Tríceps Francês com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Cotovelos apontados para cima, alongamento máximo',
      },
      {
        nome: 'Extensão Overhead na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Costas para polia, estender acima da cabeça',
      },
    ],
    medial: [
      {
        nome: 'Tríceps Pegada Invertida na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Pegada supinada, cotovelos colados',
      },
      {
        nome: 'Tríceps Kickback com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Tronco paralelo, extensão completa atrás',
      },
    ],
    lateral: [
      {
        nome: 'Tríceps Pulley na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Cotovelos fixos, extensão completa',
      },
      {
        nome: 'Tríceps Corda na Polia Alta',
        equipamento: ['polia_alta'],
        tecnica: 'Abrir corda no final, contração máxima',
      },
      {
        nome: 'Mergulho entre Bancos',
        equipamento: ['banco'],
        tecnica: 'Tronco reto, foco nos tríceps',
      },
    ],
  },
  BICEPS: {
    longa: [
      {
        nome: 'Rosca Direta com Barra',
        equipamento: ['barra'],
        tecnica: 'Pegada supinada, cotovelos fixos',
      },
      {
        nome: 'Rosca Inclinada com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Banco a 45°, máximo alongamento',
      },
      {
        nome: 'Rosca na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Tensão constante, contração no topo',
      },
    ],
    curta: [
      {
        nome: 'Rosca Scott com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Braços apoiados, isolamento total',
      },
      {
        nome: 'Rosca Concentrada com Halter',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Cotovelo apoiado na coxa interna',
      },
      {
        nome: 'Rosca Alternada com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Supinação durante movimento',
      },
    ],
    braquial: [
      {
        nome: 'Rosca Martelo com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Pegada neutra, movimento controlado',
      },
      {
        nome: 'Rosca Inversa com Barra',
        equipamento: ['barra'],
        tecnica: 'Pegada pronada, foco no braquial',
      },
    ],
    braquiorradial: [
      {
        nome: 'Rosca Inversa na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Pegada pronada, antebraço ativo',
      },
      {
        nome: 'Rosca Martelo Cruzada',
        equipamento: ['halteres'],
        tecnica: 'Cruzar na frente do corpo',
      },
    ],
  },
  PERNAS: {
    quadriceps_completo: [
      {
        nome: 'Agachamento com Barra',
        equipamento: ['barra'],
        tecnica: 'Descer até paralelo, subir explosivo',
      },
      {
        nome: 'Agachamento Frontal com Barra',
        equipamento: ['barra'],
        tecnica: 'Barra na frente, tronco ereto',
      },
      {
        nome: 'Afundo com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Passo longo, descer até joelho quase tocar',
      },
    ],
    vasto_medial: [
      {
        nome: 'Afundo Búlgaro com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Pé traseiro elevado, descer profundo',
      },
      {
        nome: 'Sissy Squat',
        equipamento: ['banco'],
        tecnica: 'Segurar no banco, inclinar para trás',
      },
    ],
    vasto_lateral: [
      {
        nome: 'Agachamento Sumô com Halter',
        equipamento: ['halteres'],
        tecnica: 'Pés bem afastados, halter entre pernas',
      },
      {
        nome: 'Passada Lateral com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Passo lateral, agachar no lado ativo',
      },
    ],
    reto_femoral: [
      {
        nome: 'Agachamento Hack Invertido',
        equipamento: ['barra'],
        tecnica: 'Barra atrás das pernas, subir na ponta dos pés',
      },
      {
        nome: 'Elevação de Quadril com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Costas no banco, barra no quadril',
      },
    ],
    posteriores: [
      {
        nome: 'Levantamento Terra Romeno',
        equipamento: ['barra'],
        tecnica: 'Joelhos levemente flexionados, descer até canela',
      },
      {
        nome: 'Stiff com Halteres',
        equipamento: ['halteres'],
        tecnica: 'Pernas quase retas, alongamento máximo',
      },
      {
        nome: 'Flexão Nórdica',
        equipamento: ['banco'],
        tecnica: 'Pés fixos, descer controlado usando posteriores',
      },
    ],
    gluteo_maximo: [
      {
        nome: 'Hip Thrust com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Costas no banco, empurrar quadril para cima',
      },
      {
        nome: 'Agachamento Sumô Profundo',
        equipamento: ['barra'],
        tecnica: 'Pés afastados, descer máximo possível',
      },
      {
        nome: 'Ponte de Glúteo Unilateral',
        equipamento: ['banco'],
        tecnica: 'Uma perna por vez, contração no topo',
      },
    ],
    gluteo_medio: [
      {
        nome: 'Abdução na Polia Baixa',
        equipamento: ['polia_baixa'],
        tecnica: 'Lateral para polia, abrir perna lateralmente',
      },
      {
        nome: 'Agachamento com Banda Simulado',
        equipamento: ['halteres'],
        tecnica: 'Forçar joelhos para fora durante agachamento',
      },
    ],
    gastrocnemio: [
      {
        nome: 'Panturrilha em Pé com Barra',
        equipamento: ['barra'],
        tecnica: 'Barra nas costas, subir na ponta dos pés',
      },
      {
        nome: 'Panturrilha no Banco',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Pé no banco, halter na mão, subir',
      },
    ],
    soleo: [
      {
        nome: 'Panturrilha Sentado com Halteres',
        equipamento: ['banco', 'halteres'],
        tecnica: 'Halteres nos joelhos, subir na ponta dos pés',
      },
      {
        nome: 'Panturrilha Sentado com Barra',
        equipamento: ['banco', 'barra'],
        tecnica: 'Barra nos joelhos, amplitude completa',
      },
    ],
  },
};

function selecionarExercicios(grupamento, tempoDisponivel) {
  const exerciciosSelecionados = [];
  let seriesPadrao;
  let repeticoesPadrao;
  let descansoPadrao;

  // Ajustar volume baseado no tempo
  if (tempoDisponivel <= 30) {
    seriesPadrao = 3;
    repeticoesPadrao = '8-12';
    descansoPadrao = '45-60s';
  } else if (tempoDisponivel <= 60) {
    seriesPadrao = 4;
    repeticoesPadrao = '8-12';
    descansoPadrao = '60-90s';
  } else {
    seriesPadrao = 4;
    repeticoesPadrao = '6-12 (pirâmide)';
    descansoPadrao = '90-120s';
  }

  const database = exerciseDatabase[grupamento];
  if (!database) return exerciciosSelecionados;

  // Selecionar 1 exercício de cada porção muscular
  for (const [porcao, exercicios] of Object.entries(database)) {
    if (exercicios.length > 0) {
      // Para treinos mais longos, pode selecionar 2 exercícios da mesma porção
      const numExercicios = tempoDisponivel >= 75 && exercicios.length > 1 ? 2 : 1;

      for (let i = 0; i < numExercicios && i < exercicios.length; i++) {
        const exercicio = exercicios[i];
        let series = seriesPadrao;
        let repeticoes = repeticoesPadrao;
        let descanso = descansoPadrao;

        // Ajustes específicos para técnicas avançadas em treinos longos
        if (tempoDisponivel >= 75 && i === 1) {
          series = 3;
          repeticoes = '10-12 + drop set';
          exercicio.tecnica += ' | Drop set na última série';
        }

        exerciciosSelecionados.push({
          nome: exercicio.nome,
          porcaoMuscular: porcao.replace(/_/g, ' ').toUpperCase(),
          series,
          repeticoes,
          descanso,
          tecnica: exercicio.tecnica,
          equipamento: exercicio.equipamento,
        });
      }
    }
  }

  return exerciciosSelecionados;
}

/**
 * Full body compacto: um exercício por grande grupo (+ extras se houver tempo).
 */
function selecionarFullBody(tempoDisponivel) {
  let seriesPadrao = 3;
  let repeticoesPadrao = '8-12';
  let descansoPadrao = '60-90s';
  if (tempoDisponivel <= 45) {
    seriesPadrao = 2;
    repeticoesPadrao = '10-15';
    descansoPadrao = '45-60s';
  } else if (tempoDisponivel >= 75) {
    seriesPadrao = 4;
    repeticoesPadrao = '6-12 (pirâmide)';
    descansoPadrao = '60-90s';
  }

  const nucleo = [
    { g: 'PEITO', p: 'superior', i: 0 },
    { g: 'COSTAS', p: 'lats_largura', i: 0 },
    { g: 'PERNAS', p: 'quadriceps_completo', i: 0 },
    { g: 'OMBROS', p: 'anterior', i: 0 },
    { g: 'TRICEPS', p: 'lateral', i: 0 },
    { g: 'BICEPS', p: 'longa', i: 0 },
  ];

  const extras = [
    { g: 'PEITO', p: 'medio', i: 0 },
    { g: 'COSTAS', p: 'lats_espessura', i: 0 },
    { g: 'PERNAS', p: 'posteriores', i: 0 },
  ];

  const picks =
    tempoDisponivel >= 60 ? [...nucleo, ...extras.slice(0, tempoDisponivel >= 75 ? 3 : 2)] : nucleo;

  const lista = [];
  for (const { g, p, i } of picks) {
    const db = exerciseDatabase[g];
    if (!db || !db[p] || !db[p][i]) continue;
    const ex = db[p][i];
    lista.push({
      nome: ex.nome,
      porcaoMuscular: `${g} ${p.replace(/_/g, ' ').toUpperCase()}`,
      series: seriesPadrao,
      repeticoes: repeticoesPadrao,
      descanso: descansoPadrao,
      tecnica: ex.tecnica,
      equipamento: ex.equipamento,
    });
  }
  return lista;
}

function gerarMetadados(grupamento, letraTreino = null) {
  const metadata = {
    PEITO: {
      titulo: 'Treino A — Peito Completo',
      objetivo:
        'Hipertrofia de todas as porções do peitoral (superior, médio, inferior, interno, externo) com ênfase em amplitude e contração máxima.',
    },
    COSTAS: {
      titulo: 'Treino B — Costas Completas',
      objetivo:
        'Desenvolvimento completo das costas focando em largura, espessura, rombóides, trapézio e deltoide posterior para criar o shape em V.',
    },
    OMBROS: {
      titulo: 'Treino C — Ombros 3D',
      objetivo:
        'Hipertrofia das três porções do deltoide (anterior, lateral, posterior) para criar ombros esféricos e proporcionais.',
    },
    TRICEPS: {
      titulo: 'Treino D — Tríceps Completo',
      objetivo:
        'Desenvolvimento das três cabeças do tríceps (longa, medial, lateral) para máximo volume e definição dos braços.',
    },
    BICEPS: {
      titulo: 'Treino E — Bíceps e Antebraços',
      objetivo:
        'Hipertrofia completa dos bíceps (cabeça longa e curta), braquial e braquiorradial para braços volumosos e detalhados.',
    },
    PERNAS: {
      titulo: 'Treino F — Pernas Completas',
      objetivo:
        'Desenvolvimento total das pernas: quadríceps (4 porções), posteriores, glúteos (3 porções) e panturrilhas (gastrocnêmio + sóleo).',
    },
    PEITO_TRICEPS: {
      titulo: 'Treino A — Peito e Tríceps',
      objetivo:
        'Hipertrofia do peitoral completo combinado com desenvolvimento total dos tríceps em treino push.',
    },
    COSTAS_BICEPS: {
      titulo: 'Treino B — Costas e Bíceps',
      objetivo:
        'Desenvolvimento completo das costas com ênfase em largura e espessura combinado com hipertrofia total dos bíceps em treino pull.',
    },
    PERNAS_OMBROS: {
      titulo: 'Treino C — Pernas e Ombros',
      objetivo:
        'Treino de pernas completo com foco em quadríceps, posteriores e glúteos, finalizado com ombros 3D para sessão de corpo inteiro.',
    },
    OMBROS_BRACOS: {
      titulo: 'Treino D — Ombros e Braços',
      objetivo:
        'Ombros em todas as angulações combinados com tríceps e bíceps para finalizar a semana com braços completos.',
    },
    FULL_BODY: {
      titulo: 'Treino Full Body',
      objetivo:
        'Estímulo global do corpo em uma única sessão: peito, costas, pernas, ombros e braços com volume moderado por grupo.',
    },
  };

  const base = metadata[grupamento] || { titulo: 'Treino', objetivo: 'Hipertrofia muscular' };
  if (letraTreino && /^[A-D]$/.test(letraTreino) && base.titulo.match(/^Treino [A-Z](?= —)/)) {
    return {
      ...base,
      titulo: base.titulo.replace(/^Treino [A-Z](?= —)/, `Treino ${letraTreino}`),
    };
  }
  return base;
}

function gerarResumo(grupamento, exercicios) {
  const porcoesAtendidas = [...new Set(exercicios.map((e) => e.porcaoMuscular))];

  let resumo = `Este treino cobriu ${porcoesAtendidas.length} porções musculares distintas:\n\n`;

  porcoesAtendidas.forEach((porcao) => {
    const exerciciosDaPorcao = exercicios.filter((e) => e.porcaoMuscular === porcao);
    resumo += `✓ ${porcao}: ${exerciciosDaPorcao.map((e) => e.nome).join(', ')}\n`;
  });

  const labelGrupo =
    grupamento === 'FULL_BODY' ? 'corpo inteiro (full body)' : grupamento.replace(/_/g, ' ');
  resumo += `\nTodas as subdivisões anatômicas do grupamento ${labelGrupo} foram trabalhadas de forma completa e equilibrada.`;

  return resumo;
}

/**
 * Resolve grupamento interno a partir da escolha do usuário (divisão + letra) ou modo legado.
 */
function resolveGrupamentoGeracao(body) {
  const { grupamento: grupamentoLegado, tipoDivisao, letraTreino } = body;

  if (tipoDivisao === 'FULL_BODY') {
    return { grupamento: 'FULL_BODY', letra: null };
  }

  if (tipoDivisao === 'ABC') {
    const map = { A: 'PEITO_TRICEPS', B: 'COSTAS_BICEPS', C: 'PERNAS_OMBROS' };
    const g = map[letraTreino];
    if (!g) {
      return { error: 'Para divisão ABC, informe letraTreino: A, B ou C' };
    }
    return { grupamento: g, letra: letraTreino };
  }

  if (tipoDivisao === 'ABCD') {
    const map = { A: 'PEITO_TRICEPS', B: 'COSTAS_BICEPS', C: 'PERNAS', D: 'OMBROS_BRACOS' };
    const g = map[letraTreino];
    if (!g) {
      return { error: 'Para divisão ABCD, informe letraTreino: A, B, C ou D' };
    }
    return { grupamento: g, letra: letraTreino };
  }

  if (grupamentoLegado) {
    return { grupamento: grupamentoLegado, letra: null };
  }

  return {
    error:
      'Informe tipoDivisao (ABC, ABCD ou FULL_BODY) e letraTreino quando aplicável, ou grupamento (modo legado)',
  };
}

// POST /api/workouts/generate - Gerar novo treino
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { tempoDisponivel } = req.body;

    if (!tempoDisponivel || tempoDisponivel < 30 || tempoDisponivel > 120) {
      return res
        .status(400)
        .json({ message: 'Tempo disponível deve estar entre 30 e 120 minutos' });
    }

    const resolved = resolveGrupamentoGeracao(req.body);
    if (resolved.error) {
      return res.status(400).json({ message: resolved.error });
    }

    const { grupamento, letra: letraTreino } = resolved;

    if (!WORKOUT_GROUPS.includes(grupamento)) {
      return res.status(400).json({ message: 'Grupamento muscular inválido' });
    }

    // Gerar metadados (ajusta letra A–D no título quando vier de divisão ABCD/ABC)
    const { titulo, objetivo } = gerarMetadados(grupamento, letraTreino);

    let exercicios = [];

    if (grupamento === 'FULL_BODY') {
      exercicios = selecionarFullBody(tempoDisponivel);
    } else if (grupamento === 'PEITO_TRICEPS') {
      const exerciciosPeito = selecionarExercicios('PEITO', Math.floor(tempoDisponivel * 0.6));
      const exerciciosTriceps = selecionarExercicios('TRICEPS', Math.ceil(tempoDisponivel * 0.4));
      exercicios = [...exerciciosPeito, ...exerciciosTriceps];
    } else if (grupamento === 'COSTAS_BICEPS') {
      const exerciciosCostas = selecionarExercicios('COSTAS', Math.floor(tempoDisponivel * 0.65));
      const exerciciosBiceps = selecionarExercicios('BICEPS', Math.ceil(tempoDisponivel * 0.35));
      exercicios = [...exerciciosCostas, ...exerciciosBiceps];
    } else if (grupamento === 'PERNAS_OMBROS') {
      const exerciciosPernas = selecionarExercicios('PERNAS', Math.floor(tempoDisponivel * 0.7));
      const exerciciosOmbros = selecionarExercicios('OMBROS', Math.ceil(tempoDisponivel * 0.3));
      exercicios = [...exerciciosPernas, ...exerciciosOmbros];
    } else if (grupamento === 'OMBROS_BRACOS') {
      const exerciciosOmbros = selecionarExercicios('OMBROS', Math.floor(tempoDisponivel * 0.35));
      const exerciciosTriceps = selecionarExercicios('TRICEPS', Math.ceil(tempoDisponivel * 0.32));
      const exerciciosBiceps = selecionarExercicios('BICEPS', Math.ceil(tempoDisponivel * 0.33));
      exercicios = [...exerciciosOmbros, ...exerciciosTriceps, ...exerciciosBiceps];
    } else {
      exercicios = selecionarExercicios(grupamento, tempoDisponivel);
    }

    const resumo = gerarResumo(grupamento, exercicios);

    const workout = await Workout.create({
      user: req.user._id,
      titulo,
      grupamento,
      objetivo,
      tempoDisponivel,
      exercicios,
      resumo,
    });

    res.status(201).json({
      success: true,
      data: workout,
    });
  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    res.status(500).json({
      message: 'Erro ao gerar treino',
      error: error.message,
    });
  }
});

// GET /api/workouts/my-workouts - Buscar histórico de treinos do usuário
router.get('/my-workouts', authenticate, async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      count: workouts.length,
      data: workouts,
    });
  } catch (error) {
    console.error('Erro ao buscar treinos:', error);
    res.status(500).json({
      message: 'Erro ao buscar treinos',
      error: error.message,
    });
  }
});

// GET /api/workouts/:id - Buscar treino específico
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ message: 'Treino não encontrado' });
    }

    res.json({
      success: true,
      data: workout,
    });
  } catch (error) {
    console.error('Erro ao buscar treino:', error);
    res.status(500).json({
      message: 'Erro ao buscar treino',
      error: error.message,
    });
  }
});

// PATCH /api/workouts/:id/complete - Marcar treino como realizado
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ message: 'Treino não encontrado' });
    }

    await workout.marcarComoRealizado();

    res.json({
      success: true,
      data: workout,
    });
  } catch (error) {
    console.error('Erro ao marcar treino como realizado:', error);
    res.status(500).json({
      message: 'Erro ao marcar treino como realizado',
      error: error.message,
    });
  }
});

// DELETE /api/workouts/:id - Deletar um treino
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!workout) {
      return res.status(404).json({ message: 'Treino não encontrado' });
    }

    await workout.deleteOne();

    res.json({
      success: true,
      message: 'Treino deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar treino:', error);
    res.status(500).json({
      message: 'Erro ao deletar treino',
      error: error.message,
    });
  }
});

// DELETE /api/workouts - Limpar todo histórico
router.delete('/', authenticate, async (req, res) => {
  try {
    await Workout.deleteMany({ user: req.user._id });

    res.json({
      success: true,
      message: 'Histórico de treinos limpo com sucesso',
    });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({
      message: 'Erro ao limpar histórico de treinos',
      error: error.message,
    });
  }
});

export default router;
