export const TIPOS_DIVISAO = [
  {
    value: 'ABC',
    label: 'ABC — 3 dias',
    detalhe: 'A: peito + tríceps · B: costas + bíceps · C: pernas + ombros',
  },
  {
    value: 'ABCD',
    label: 'ABCD — 4 dias',
    detalhe: 'A: peito + tríceps · B: costas + bíceps · C: só pernas · D: ombros + braços',
  },
  {
    value: 'FULL_BODY',
    label: 'Full body',
    detalhe: 'Peito, costas, pernas, ombros e braços na mesma sessão',
  },
];

const ORDEM_LETRAS_ABC = ['A', 'B', 'C'];
const ORDEM_LETRAS_ABCD = ['A', 'B', 'C', 'D'];

function inferirLetraDoTitulo(titulo) {
  const match = titulo?.match(/^Treino ([A-D])(?:\s|—|-)/);
  return match ? match[1] : null;
}

function inferirTipoDivisaoDoGrupamento(grupamento, titulo = '') {
  if (grupamento === 'FULL_BODY' || titulo.includes('Full Body')) return 'FULL_BODY';
  if (grupamento === 'OMBROS_BRACOS' || titulo.includes('Ombros e Braços')) return 'ABCD';
  if (grupamento === 'PERNAS_OMBROS' || titulo.includes('Pernas e Ombros')) return 'ABC';
  if (grupamento === 'PERNAS' || titulo.includes('Pernas Completas')) return 'ABCD';
  return 'ABC';
}

export function formatarDataRelativa(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  const hoje = new Date();
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diffDias = Math.round((inicioHoje - inicioData) / 86400000);

  if (diffDias === 0) return 'hoje';
  if (diffDias === 1) return 'ontem';
  if (diffDias > 1 && diffDias < 7) return `há ${diffDias} dias`;
  return data.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function obterUltimoTreinoRelevante(lista) {
  if (!lista?.length) return null;
  const realizados = lista.filter((t) => t.realizado && t.dataRealizacao);
  if (realizados.length) {
    return [...realizados].sort(
      (a, b) => new Date(b.dataRealizacao) - new Date(a.dataRealizacao),
    )[0];
  }
  return [...lista].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

export function calcularSugestaoProximo(ultimo) {
  if (!ultimo) return null;

  const tipoDivisao = inferirTipoDivisaoDoGrupamento(ultimo.grupamento, ultimo.titulo);
  if (tipoDivisao === 'FULL_BODY') {
    return {
      tipoDivisao: 'FULL_BODY',
      letraTreino: null,
      tempoDisponivel: ultimo.tempoDisponivel,
      mensagem: 'Hoje pode ser outro full body com o mesmo tempo de sessão.',
    };
  }

  const letraAtual = inferirLetraDoTitulo(ultimo.titulo);
  const ordem = tipoDivisao === 'ABCD' ? ORDEM_LETRAS_ABCD : ORDEM_LETRAS_ABC;
  const idx = letraAtual ? ordem.indexOf(letraAtual) : -1;
  const proximaLetra = idx >= 0 ? ordem[(idx + 1) % ordem.length] : ordem[0];

  return {
    tipoDivisao,
    letraTreino: proximaLetra,
    tempoDisponivel: ultimo.tempoDisponivel,
    mensagem: `Na sequência ${tipoDivisao}, depois do Treino ${letraAtual || '?'} costuma vir o Treino ${proximaLetra}.`,
  };
}
