import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiArrowLeft, FiActivity, FiClock, FiTrash2, FiCheck, FiZap, FiPlay, FiPause, FiStopCircle, FiCheckCircle, FiRotateCcw } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const TIPOS_DIVISAO = [
  {
    value: 'ABC',
    label: 'ABC — 3 dias',
    short: '3 dias',
    detalhe: 'A: peito + tríceps · B: costas + bíceps · C: pernas + ombros'
  },
  {
    value: 'ABCD',
    label: 'ABCD — 4 dias',
    short: '4 dias',
    detalhe: 'A: peito + tríceps · B: costas + bíceps · C: só pernas · D: ombros + braços'
  },
  {
    value: 'FULL_BODY',
    label: 'Full body',
    short: 'Corpo inteiro',
    detalhe: 'Peito, costas, pernas, ombros e braços na mesma sessão'
  }
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

function formatarDataRelativa(dataIso) {
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
    month: 'long'
  });
}

function obterUltimoTreinoRelevante(lista) {
  if (!lista?.length) return null;
  const realizados = lista.filter((t) => t.realizado && t.dataRealizacao);
  if (realizados.length) {
    return [...realizados].sort(
      (a, b) => new Date(b.dataRealizacao) - new Date(a.dataRealizacao)
    )[0];
  }
  return [...lista].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

function calcularSugestaoProximo(ultimo) {
  if (!ultimo) return null;

  const tipoDivisao = inferirTipoDivisaoDoGrupamento(ultimo.grupamento, ultimo.titulo);
  if (tipoDivisao === 'FULL_BODY') {
    return {
      tipoDivisao: 'FULL_BODY',
      letraTreino: null,
      tempoDisponivel: ultimo.tempoDisponivel,
      mensagem: 'Hoje pode ser outro full body com o mesmo tempo de sessão.'
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
    mensagem: `Na sequência ${tipoDivisao}, depois do Treino ${letraAtual || '?'} costuma vir o Treino ${proximaLetra}.`
  };
}

const TreinoPage = () => {
  const navigate = useNavigate();

  const [tipoDivisao, setTipoDivisao] = useState('ABC');
  const [letraTreino, setLetraTreino] = useState('A');
  const [tempoDisponivel, setTempoDisponivel] = useState('');
  const [loading, setLoading] = useState(false);
  const [treinoGerado, setTreinoGerado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  
  // Estados para controle do treino ativo
  const [treinoAtivo, setTreinoAtivo] = useState(false);
  const [tempoTreinoDecorrido, setTempoTreinoDecorrido] = useState(0);
  const [progressoExercicios, setProgressoExercicios] = useState({});
  
  // Estados para timer de descanso
  const [descansoAtivo, setDescansoAtivo] = useState(false);
  const [tempoDescansoRestante, setTempoDescansoRestante] = useState(0);
  const [exercicioEmDescanso, setExercicioEmDescanso] = useState(null);
  
  // Estado para prevenir cliques múltiplos
  const [processandoSerie, setProcessandoSerie] = useState(false);
  
  // Estados para modais customizados
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    tipo: 'confirm', // 'confirm' ou 'alert'
    titulo: '',
    mensagem: '',
    onConfirm: null,
    onCancel: null
  });
  
  // Refs para os timers
  const timerTreinoRef = useRef(null);
  const timerDescansoRef = useRef(null);

  useEffect(() => {
    if (tipoDivisao === 'ABC' && letraTreino === 'D') {
      setLetraTreino('A');
    }
  }, [tipoDivisao, letraTreino]);

  const ultimoTreino = useMemo(() => obterUltimoTreinoRelevante(historico), [historico]);
  const sugestaoProximo = useMemo(
    () => calcularSugestaoProximo(ultimoTreino),
    [ultimoTreino]
  );

  const aplicarSugestaoProximo = useCallback(() => {
    if (!sugestaoProximo) return;
    setTipoDivisao(sugestaoProximo.tipoDivisao);
    if (sugestaoProximo.letraTreino) {
      setLetraTreino(sugestaoProximo.letraTreino);
    }
    if (sugestaoProximo.tempoDisponivel) {
      setTempoDisponivel(String(sugestaoProximo.tempoDisponivel));
    }
  }, [sugestaoProximo]);

  useEffect(() => {
    carregarHistorico();
  }, []);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (timerTreinoRef.current) clearInterval(timerTreinoRef.current);
      if (timerDescansoRef.current) clearInterval(timerDescansoRef.current);
    };
  }, []);

  // Fechar modal com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalAberto) {
        if (modalConfig.tipo === 'alert') {
          modalConfig.onConfirm();
        } else {
          modalConfig.onCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAberto, modalConfig]);

  // Timer do treino geral
  useEffect(() => {
    if (treinoAtivo) {
      timerTreinoRef.current = setInterval(() => {
        setTempoTreinoDecorrido(prev => prev + 1);
      }, 1000);
    } else {
      if (timerTreinoRef.current) {
        clearInterval(timerTreinoRef.current);
      }
    }
    return () => {
      if (timerTreinoRef.current) {
        clearInterval(timerTreinoRef.current);
      }
    };
  }, [treinoAtivo]);

  // Timer do descanso
  useEffect(() => {
    if (descansoAtivo && tempoDescansoRestante > 0) {
      timerDescansoRef.current = setInterval(() => {
        setTempoDescansoRestante(prev => {
          if (prev <= 1) {
            setDescansoAtivo(false);
            // Notificação de som (opcional)
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dyvg==');
              audio.play();
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerDescansoRef.current) {
        clearInterval(timerDescansoRef.current);
      }
    }
    return () => {
      if (timerDescansoRef.current) {
        clearInterval(timerDescansoRef.current);
      }
    };
  }, [descansoAtivo, tempoDescansoRestante]);

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const response = await api.getMyWorkouts();
      if (response.success) {
        setHistorico(response.data);
      }
    } catch {
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  };

  // Formatar tempo em MM:SS
  const formatarTempo = useCallback((segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Funções para modais customizados
  const mostrarConfirm = useCallback((titulo, mensagem, onConfirm) => {
    setModalConfig({
      tipo: 'confirm',
      titulo,
      mensagem,
      onConfirm,
      onCancel: () => setModalAberto(false)
    });
    setModalAberto(true);
  }, []);

  const mostrarAlerta = useCallback((titulo, mensagem) => {
    setModalConfig({
      tipo: 'alert',
      titulo,
      mensagem,
      onConfirm: () => setModalAberto(false),
      onCancel: null
    });
    setModalAberto(true);
  }, []);

  // Iniciar treino
  const iniciarTreino = useCallback(() => {
    setTreinoAtivo(true);
    setTempoTreinoDecorrido(0);
    // Inicializar progresso de todos os exercícios
    const progressoInicial = {};
    treinoGerado.exercicios.forEach((_, index) => {
      progressoInicial[index] = {
        seriesCompletadas: 0,
        totalSeries: treinoGerado.exercicios[index].series,
        seriesAntesAtalho: null
      };
    });
    setProgressoExercicios(progressoInicial);
  }, [treinoGerado]);

  // Pausar/Retomar treino
  const togglePausarTreino = useCallback(() => {
    setTreinoAtivo(prev => !prev);
  }, []);

  // Finalizar treino
  const finalizarTreino = useCallback(() => {
    mostrarConfirm(
      'Finalizar Treino',
      'Tem certeza que deseja finalizar o treino? Todo o progresso será perdido.',
      () => {
        setTreinoAtivo(false);
        setDescansoAtivo(false);
        setTempoTreinoDecorrido(0);
        setProgressoExercicios({});
        setExercicioEmDescanso(null);
        setModalAberto(false);
      }
    );
  }, [mostrarConfirm]);

  // Extrair tempo de descanso em segundos do formato "60-90s"
  const extrairTempoDescanso = useCallback((descansoStr) => {
    const match = descansoStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 60;
  }, []);

  // Completar uma série
  const completarSerie = useCallback((exercicioIndex, tempoDescanso) => {
    // Prevenir cliques múltiplos
    if (processandoSerie) return;
    
    setProcessandoSerie(true);
    
    setProgressoExercicios(prev => {
      const novoProgresso = { ...prev };
      if (!novoProgresso[exercicioIndex]) {
        novoProgresso[exercicioIndex] = {
          seriesCompletadas: 0,
          totalSeries: treinoGerado.exercicios[exercicioIndex].series,
          seriesAntesAtalho: null
        };
      }
      
      const seriesAtuais = novoProgresso[exercicioIndex].seriesCompletadas;
      const totalSeries = novoProgresso[exercicioIndex].totalSeries;
      
      // Incrementar séries completadas
      if (seriesAtuais < totalSeries) {
        novoProgresso[exercicioIndex] = {
          ...novoProgresso[exercicioIndex],
          seriesCompletadas: seriesAtuais + 1,
          seriesAntesAtalho: null
        };
        
        // Verificar se é o último exercício
        const ehUltimoExercicio = exercicioIndex === treinoGerado.exercicios.length - 1;
        const ehUltimaSerie = seriesAtuais + 1 === totalSeries;
        
        // Iniciar descanso exceto se for a última série do último exercício
        if (!(ehUltimoExercicio && ehUltimaSerie)) {
          const tempoEmSegundos = extrairTempoDescanso(tempoDescanso);
          setTempoDescansoRestante(tempoEmSegundos);
          setDescansoAtivo(true);
          setExercicioEmDescanso(exercicioIndex);
        }
      }
      
      return novoProgresso;
    });
    
    // Liberar após um pequeno delay
    setTimeout(() => {
      setProcessandoSerie(false);
    }, 300);
  }, [treinoGerado, extrairTempoDescanso, processandoSerie]);

  const iniciarDescansoAposExercicio = useCallback((exercicioIndex, tempoDescanso) => {
    const ehUltimoExercicio = exercicioIndex === treinoGerado.exercicios.length - 1;
    if (ehUltimoExercicio) return;

    const tempoEmSegundos = extrairTempoDescanso(tempoDescanso);
    setTempoDescansoRestante(tempoEmSegundos);
    setDescansoAtivo(true);
    setExercicioEmDescanso(exercicioIndex);
  }, [treinoGerado, extrairTempoDescanso]);

  const completarExercicio = useCallback((exercicioIndex, tempoDescanso) => {
    if (processandoSerie || !treinoGerado) return;

    setProcessandoSerie(true);

    setProgressoExercicios((prev) => {
      const novoProgresso = { ...prev };
      const totalSeries = treinoGerado.exercicios[exercicioIndex].series;
      const atual = novoProgresso[exercicioIndex] || {
        seriesCompletadas: 0,
        totalSeries,
        seriesAntesAtalho: null
      };

      if (atual.seriesCompletadas >= atual.totalSeries) {
        return prev;
      }

      novoProgresso[exercicioIndex] = {
        ...atual,
        seriesAntesAtalho: atual.seriesCompletadas,
        seriesCompletadas: atual.totalSeries
      };

      return novoProgresso;
    });

    iniciarDescansoAposExercicio(exercicioIndex, tempoDescanso);

    setTimeout(() => {
      setProcessandoSerie(false);
    }, 300);
  }, [treinoGerado, processandoSerie, iniciarDescansoAposExercicio]);

  const desfazerExercicioCompleto = useCallback((exercicioIndex) => {
    if (processandoSerie) return;

    setProgressoExercicios((prev) => {
      const atual = prev[exercicioIndex];
      if (!atual || atual.seriesAntesAtalho == null) {
        return prev;
      }

      return {
        ...prev,
        [exercicioIndex]: {
          ...atual,
          seriesCompletadas: atual.seriesAntesAtalho,
          seriesAntesAtalho: null
        }
      };
    });

    if (exercicioEmDescanso === exercicioIndex) {
      setDescansoAtivo(false);
      setTempoDescansoRestante(0);
      setExercicioEmDescanso(null);
    }
  }, [processandoSerie, exercicioEmDescanso]);

  // Pular descanso
  const pularDescanso = useCallback(() => {
    setDescansoAtivo(false);
    setTempoDescansoRestante(0);
    setExercicioEmDescanso(null);
  }, []);

  const handleGerarTreino = async () => {
    if (!tempoDisponivel || tempoDisponivel < 30 || tempoDisponivel > 120) {
      mostrarAlerta('Tempo Inválido', 'Por favor, insira um tempo válido entre 30 e 120 minutos.');
      return;
    }

    if (tipoDivisao !== 'FULL_BODY' && !letraTreino) {
      mostrarAlerta('Treino', 'Escolha qual treino (A, B, C ou D) deseja gerar.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tempoDisponivel: parseInt(tempoDisponivel, 10),
        tipoDivisao
      };
      if (tipoDivisao !== 'FULL_BODY') {
        payload.letraTreino = letraTreino;
      }

      const response = await api.generateWorkout(payload);

      if (response.success) {
        setTreinoGerado(response.data);
        carregarHistorico();
      }
    } catch {
      mostrarAlerta('Erro', 'Erro ao gerar treino. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarRealizado = async (id) => {
    try {
      const response = await api.completeWorkout(id);
      if (response.success) {
        carregarHistorico();
        if (treinoGerado && treinoGerado._id === id) {
          setTreinoGerado(response.data);
        }
        mostrarAlerta('Parabéns! 🎉', 'Treino marcado como realizado! Você pode ver seu progresso no Dashboard.');
      }
    } catch {
      mostrarAlerta('Erro', 'Erro ao marcar treino como realizado. Tente novamente.');
    }
  };

  const handleDeletarTreino = async (id) => {
    mostrarConfirm(
      'Deletar Treino',
      'Deseja realmente deletar este treino? Esta ação não pode ser desfeita.',
      async () => {
        try {
          const response = await api.deleteWorkout(id);
          if (response.success) {
            carregarHistorico();
            if (treinoGerado && treinoGerado._id === id) {
              setTreinoGerado(null);
            }
            setModalAberto(false);
            mostrarAlerta('Sucesso', 'Treino deletado com sucesso!');
          }
        } catch {
          setModalAberto(false);
          mostrarAlerta('Erro', 'Erro ao deletar treino. Tente novamente.');
        }
      }
    );
  };

  const handleLimparHistorico = async () => {
    mostrarConfirm(
      'Limpar Histórico',
      'Deseja realmente limpar todo o histórico de treinos? Todos os treinos serão permanentemente deletados.',
      async () => {
        try {
          const response = await api.clearWorkoutHistory();
          if (response.success) {
            setHistorico([]);
            setTreinoGerado(null);
            setModalAberto(false);
            mostrarAlerta('Sucesso', 'Histórico limpo com sucesso!');
          }
        } catch {
          setModalAberto(false);
          mostrarAlerta('Erro', 'Erro ao limpar histórico. Tente novamente.');
        }
      }
    );
  };

  const handleVisualizarTreino = (treino) => {
    setTreinoGerado(treino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container className="custom-scroll">
      {/* Modal Customizado */}
      <AnimatePresence>
        {modalAberto && (
          <ModalOverlay
            as={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => modalConfig.tipo === 'alert' ? modalConfig.onConfirm() : modalConfig.onCancel()}
          >
            <ModalContainer
              as={motion.div}
              initial={{ opacity: 0, scale: 0.8, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitulo>{modalConfig.titulo}</ModalTitulo>
              </ModalHeader>
              <ModalBody>
                <ModalMensagem>{modalConfig.mensagem}</ModalMensagem>
              </ModalBody>
              <ModalFooter>
                {modalConfig.tipo === 'confirm' ? (
                  <>
                    <ModalButton
                      color="#6c757d"
                      onClick={modalConfig.onCancel}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancelar
                    </ModalButton>
                    <ModalButton
                      color="var(--accent)"
                      onClick={modalConfig.onConfirm}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Confirmar
                    </ModalButton>
                  </>
                ) : (
                  <ModalButton
                    color="var(--accent)"
                    onClick={modalConfig.onConfirm}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ width: '100%' }}
                  >
                    OK
                  </ModalButton>
                )}
              </ModalFooter>
            </ModalContainer>
          </ModalOverlay>
        )}
      </AnimatePresence>

      <Header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo>HealGym</Logo>
        </motion.div>
        <BackButton onClick={() => navigate('/dashboard')}>
          <FiArrowLeft />
          Início
        </BackButton>
      </Header>

      <MainContent>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ width: '100%' }}
        >
          <PageTitle>Sistema de Treinos</PageTitle>
          <PageSubtitle>
            Escolha a divisão (ABC, ABCD ou full body), o treino do dia quando aplicável e o tempo disponível.
          </PageSubtitle>

          <ContentContainer>
            <GerarTreinoSection
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SectionTitle>
                <FiZap />
                Gerar Novo Treino
              </SectionTitle>

          <FormContainer>
            {!loadingHistorico && ultimoTreino && (
              <UltimoTreinoSugestaoCard
                as={motion.div}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <UltimoTreinoSugestaoTitulo>
                  {ultimoTreino.realizado ? '💡 Lembrete do seu último treino' : '💡 Seu último treino gerado'}
                </UltimoTreinoSugestaoTitulo>
                <UltimoTreinoSugestaoTexto>
                  {ultimoTreino.realizado ? (
                    <>
                      <strong>{formatarDataRelativa(ultimoTreino.dataRealizacao)}</strong> você treinou{' '}
                      <strong>{ultimoTreino.titulo}</strong>
                    </>
                  ) : (
                    <>
                      <strong>{formatarDataRelativa(ultimoTreino.createdAt)}</strong> você gerou{' '}
                      <strong>{ultimoTreino.titulo}</strong>
                      {!ultimoTreino.realizado && ' (ainda não marcado como realizado)'}
                    </>
                  )}
                  {' — '}
                  {ultimoTreino.tempoDisponivel} min · {ultimoTreino.exercicios?.length ?? 0} exercícios
                </UltimoTreinoSugestaoTexto>
                {sugestaoProximo && (
                  <UltimoTreinoSugestaoDica>{sugestaoProximo.mensagem}</UltimoTreinoSugestaoDica>
                )}
                {sugestaoProximo && (
                  <AplicarSugestaoButton
                    type="button"
                    onClick={aplicarSugestaoProximo}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Usar sugestão
                    {sugestaoProximo.tipoDivisao === 'FULL_BODY'
                      ? ' (full body)'
                      : ` (Treino ${sugestaoProximo.letraTreino}, ${sugestaoProximo.tempoDisponivel} min)`}
                  </AplicarSugestaoButton>
                )}
              </UltimoTreinoSugestaoCard>
            )}

            <TreinoDoDiaCard>
              <TreinoDoDiaLabel>Plano de treino</TreinoDoDiaLabel>
              <DivisaoTipoRow>
                {TIPOS_DIVISAO.map((tipo) => (
                  <TipoDivisaoChip
                    key={tipo.value}
                    type="button"
                    $active={tipoDivisao === tipo.value}
                    onClick={() => setTipoDivisao(tipo.value)}
                  >
                    {tipo.label}
                  </TipoDivisaoChip>
                ))}
              </DivisaoTipoRow>
              <DivisaoDetalhe>
                {TIPOS_DIVISAO.find((t) => t.value === tipoDivisao)?.detalhe}
              </DivisaoDetalhe>
              {tipoDivisao !== 'FULL_BODY' && (
                <>
                  <LetraTreinoLabel>Qual treino você quer gerar agora?</LetraTreinoLabel>
                  <LetraTreinoRow>
                    {(tipoDivisao === 'ABC' ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D']).map((L) => (
                      <LetraTreinoChip
                        key={L}
                        type="button"
                        $active={letraTreino === L}
                        onClick={() => setLetraTreino(L)}
                      >
                        Treino {L}
                      </LetraTreinoChip>
                    ))}
                  </LetraTreinoRow>
                </>
              )}
            </TreinoDoDiaCard>

            <InputGroup>
              <Label>
                <FiClock />
                Tempo Disponível (minutos)
              </Label>
              <Input
                type="number"
                min="30"
                max="120"
                value={tempoDisponivel}
                onChange={(e) => setTempoDisponivel(e.target.value)}
                placeholder="Entre 30 e 120 minutos"
              />
              <InputHint>30 min = treino rápido | 45-60 min = ideal | 75-120 min = avançado</InputHint>
            </InputGroup>

            <GerarButton
              onClick={handleGerarTreino}
              disabled={loading || !tempoDisponivel}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Gerando...' : 'Gerar Treino Perfeito'}
            </GerarButton>
          </FormContainer>
        </GerarTreinoSection>

        <AnimatePresence mode="wait">
          {treinoGerado && (
            <TreinoDisplay
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <TreinoHeader>
                <TreinoTitulo>{treinoGerado.titulo}</TreinoTitulo>
                <TreinoMetaInfo>
                  <MetaTag>
                    <FiClock />
                    {treinoGerado.tempoDisponivel} min
                  </MetaTag>
                  <MetaTag>
                    <FiActivity />
                    {treinoGerado.exercicios.length} exercícios
                  </MetaTag>
                </TreinoMetaInfo>
                <TreinoObjetivo>{treinoGerado.objetivo}</TreinoObjetivo>
                
                {/* Timer do Treino */}
                {!treinoGerado.realizado && (
                  <TimerSection>
                    {!treinoAtivo && tempoTreinoDecorrido === 0 ? (
                      <IniciarTreinoButton
                        onClick={iniciarTreino}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiPlay />
                        Iniciar Treino
                      </IniciarTreinoButton>
                    ) : (
                      <TimerContainer>
                        <TimerDisplay>
                          <TimerIcon treinoAtivo={treinoAtivo}>
                            <FiClock />
                          </TimerIcon>
                          <TimerTexto>
                            <TimerLabel>Tempo de Treino</TimerLabel>
                            <TimerValor>{formatarTempo(tempoTreinoDecorrido)}</TimerValor>
                          </TimerTexto>
                        </TimerDisplay>
                        <TimerControles>
                          <TimerButton
                            color="#ffd93d"
                            onClick={togglePausarTreino}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {treinoAtivo ? <FiPause /> : <FiPlay />}
                            {treinoAtivo ? 'Pausar' : 'Retomar'}
                          </TimerButton>
                          <TimerButton
                            color="#ff6b6b"
                            onClick={finalizarTreino}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FiStopCircle />
                            Finalizar
                          </TimerButton>
                        </TimerControles>
                      </TimerContainer>
                    )}
                  </TimerSection>
                )}

                {/* Timer de Descanso */}
                <AnimatePresence>
                  {descansoAtivo && (
                    <DescansoTimer
                      as={motion.div}
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DescansoContent>
                        <DescansoIcone>⏱️</DescansoIcone>
                        <DescansoInfo>
                          <DescansoLabel>Descanso entre Séries</DescansoLabel>
                          <DescansoValor urgente={tempoDescansoRestante <= 10}>
                            {formatarTempo(tempoDescansoRestante)}
                          </DescansoValor>
                        </DescansoInfo>
                        <PularDescansoButton
                          onClick={pularDescanso}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Pular
                        </PularDescansoButton>
                      </DescansoContent>
                      <DescansoProgressBar>
                        <DescansoProgress 
                          progresso={(tempoDescansoRestante / extrairTempoDescanso(treinoGerado.exercicios[exercicioEmDescanso]?.descanso || '60s')) * 100}
                        />
                      </DescansoProgressBar>
                    </DescansoTimer>
                  )}
                </AnimatePresence>
                
                <ActionButtons>
                  {!treinoGerado.realizado && (
                    <ActionButton
                      color="#4ecdc4"
                      onClick={() => handleMarcarRealizado(treinoGerado._id)}
                    >
                      <FiCheck />
                      Marcar como Realizado
                    </ActionButton>
                  )}
                  <ActionButton
                    color="#ff6b6b"
                    onClick={() => handleDeletarTreino(treinoGerado._id)}
                  >
                    <FiTrash2 />
                    Deletar
                  </ActionButton>
                </ActionButtons>

                {treinoGerado.realizado && (
                  <RealizadoBadge>
                    <FiCheck />
                    Treino Realizado em {new Date(treinoGerado.dataRealizacao).toLocaleDateString('pt-BR')}
                  </RealizadoBadge>
                )}
              </TreinoHeader>

              <ExerciciosList>
                {treinoGerado.exercicios.map((exercicio, index) => {
                  const progresso = progressoExercicios[index] || {
                    seriesCompletadas: 0,
                    totalSeries: exercicio.series,
                    seriesAntesAtalho: null
                  };
                  const serieCompleta = progresso.seriesCompletadas >= progresso.totalSeries;
                  const concluidoViaAtalho = serieCompleta && progresso.seriesAntesAtalho != null;
                  const emDescanso = descansoAtivo && exercicioEmDescanso === index;
                  
                  return (
                    <ExercicioCard 
                      key={index}
                      completo={serieCompleta}
                      emDescanso={emDescanso}
                    >
                      <ExercicioNumero completo={serieCompleta}>
                        {serieCompleta ? <FiCheckCircle /> : index + 1}
                      </ExercicioNumero>
                      <ExercicioInfo>
                        <ExercicioHeader>
                          <div>
                            <ExercicioNome>{exercicio.nome}</ExercicioNome>
                            <PorcaoMuscular>{exercicio.porcaoMuscular}</PorcaoMuscular>
                          </div>
                          {treinoAtivo && !treinoGerado.realizado && (
                            <ExercicioBotoes>
                              {concluidoViaAtalho ? (
                                <DesfazerExercicioButton
                                  type="button"
                                  onClick={() => desfazerExercicioCompleto(index)}
                                  disabled={processandoSerie}
                                  whileHover={!processandoSerie ? { scale: 1.05 } : {}}
                                  whileTap={!processandoSerie ? { scale: 0.95 } : {}}
                                >
                                  <FiRotateCcw />
                                  Voltar séries ({progresso.seriesAntesAtalho}/{progresso.totalSeries})
                                </DesfazerExercicioButton>
                              ) : serieCompleta ? (
                                <CompletarSerieButton
                                  type="button"
                                  disabled
                                  completo
                                >
                                  <FiCheckCircle />
                                  Completo!
                                </CompletarSerieButton>
                              ) : (
                                <>
                                  <CompletarSerieButton
                                    type="button"
                                    onClick={() => completarSerie(index, exercicio.descanso)}
                                    disabled={!treinoAtivo || processandoSerie}
                                    completo={false}
                                    whileHover={treinoAtivo && !processandoSerie ? { scale: 1.05 } : {}}
                                    whileTap={treinoAtivo && !processandoSerie ? { scale: 0.95 } : {}}
                                  >
                                    <FiCheckCircle />
                                    {processandoSerie ? 'Processando...' : 'Série Completa'}
                                  </CompletarSerieButton>
                                  <CompletarExercicioButton
                                    type="button"
                                    onClick={() => completarExercicio(index, exercicio.descanso)}
                                    disabled={!treinoAtivo || processandoSerie}
                                    whileHover={treinoAtivo && !processandoSerie ? { scale: 1.05 } : {}}
                                    whileTap={treinoAtivo && !processandoSerie ? { scale: 0.95 } : {}}
                                  >
                                    <FiCheck />
                                    Exercício Completo
                                  </CompletarExercicioButton>
                                </>
                              )}
                            </ExercicioBotoes>
                          )}
                        </ExercicioHeader>
                        
                        {/* Progress Bar das Séries */}
                        {treinoAtivo && !treinoGerado.realizado && (
                          <SeriesProgress>
                            <SeriesProgressInfo>
                              <SeriesProgressLabel>
                                Séries: {progresso.seriesCompletadas} / {progresso.totalSeries}
                              </SeriesProgressLabel>
                              <SeriesProgressPercentual>
                                {Math.round((progresso.seriesCompletadas / progresso.totalSeries) * 100)}%
                              </SeriesProgressPercentual>
                            </SeriesProgressInfo>
                            <SeriesProgressBar>
                              <SeriesProgressFill 
                                progresso={(progresso.seriesCompletadas / progresso.totalSeries) * 100}
                                as={motion.div}
                                initial={{ width: 0 }}
                                animate={{ width: `${(progresso.seriesCompletadas / progresso.totalSeries) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </SeriesProgressBar>
                          </SeriesProgress>
                        )}
                        
                        <ExercicioDetalhes>
                          <Detalhe>
                            <strong>Séries:</strong> {exercicio.series}
                          </Detalhe>
                          <Detalhe>
                            <strong>Repetições:</strong> {exercicio.repeticoes}
                          </Detalhe>
                          <Detalhe>
                            <strong>Descanso:</strong> {exercicio.descanso}
                          </Detalhe>
                        </ExercicioDetalhes>
                        <Tecnica>
                          <strong>Técnica:</strong> {exercicio.tecnica}
                        </Tecnica>
                        <Equipamentos>
                          <strong>Equipamento:</strong> {exercicio.equipamento.join(', ')}
                        </Equipamentos>
                      </ExercicioInfo>
                    </ExercicioCard>
                  );
                })}
              </ExerciciosList>

              <ResumoSection>
                <ResumoTitulo>Resumo de Cobertura Muscular</ResumoTitulo>
                <ResumoTexto>{treinoGerado.resumo}</ResumoTexto>
              </ResumoSection>
            </TreinoDisplay>
          )}
        </AnimatePresence>

        <HistoricoSection
          as={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <HistoricoHeader>
            <SectionTitle>
              <FiActivity />
              Histórico de Treinos
            </SectionTitle>
            {historico.length > 0 && (
              <LimparButton onClick={handleLimparHistorico}>
                <FiTrash2 />
                Limpar Histórico
              </LimparButton>
            )}
          </HistoricoHeader>

          {loadingHistorico ? (
            <LoadingContainer>
              <LoadingSpinner />
            </LoadingContainer>
          ) : historico.length === 0 ? (
            <EmptyState>
              <FiActivity size={48} />
              <EmptyText>Nenhum treino gerado ainda</EmptyText>
              <EmptySubtext>Gere seu primeiro treino acima!</EmptySubtext>
            </EmptyState>
          ) : (
            <HistoricoGrid>
              {historico.map((treino) => (
                <HistoricoCard
                  key={treino._id}
                  onClick={() => handleVisualizarTreino(treino)}
                  realizado={treino.realizado}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {treino.realizado && (
                    <RealizadoIcon>
                      <FiCheck />
                    </RealizadoIcon>
                  )}
                  <HistoricoTitulo>{treino.titulo}</HistoricoTitulo>
                  <HistoricoInfo>
                    <HistoricoDetalhe>
                      <FiClock />
                      {treino.tempoDisponivel} min
                    </HistoricoDetalhe>
                    <HistoricoDetalhe>
                      <FiActivity />
                      {treino.exercicios.length} exercícios
                    </HistoricoDetalhe>
                  </HistoricoInfo>
                  <HistoricoData>
                    {new Date(treino.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </HistoricoData>
                </HistoricoCard>
              ))}
            </HistoricoGrid>
          )}
        </HistoricoSection>
      </ContentContainer>
        </motion.div>
      </MainContent>
    </Container>
  );
};

// ==================== STYLED COMPONENTS ====================

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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: default;
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

const MainContent = styled.div`
  padding: 2rem;
  max-width: 1400px;
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
  user-select: none;
`;

const PageSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 2rem;
  cursor: default;
  user-select: none;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const GerarTreinoSection = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--white);
  font-size: 1.8rem;
  margin-bottom: 2rem;
  font-weight: 700;
  cursor: default;
  user-select: none;

  svg {
    color: var(--accent);
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;

  svg {
    color: var(--accent);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  color: var(--white);
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: 'Cormorant', serif;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 10px rgba(198, 169, 100, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type=number] {
    -moz-appearance: textfield;
  }
`;

const InputHint = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-style: italic;
  cursor: default;
  user-select: none;
`;

const UltimoTreinoSugestaoCard = styled.div`
  background: rgba(78, 205, 196, 0.08);
  border: 1px solid rgba(78, 205, 196, 0.35);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
`;

const UltimoTreinoSugestaoTitulo = styled.div`
  color: #4ecdc4;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.65rem;
`;

const UltimoTreinoSugestaoTexto = styled.p`
  color: var(--white);
  font-size: 0.95rem;
  line-height: 1.55;
  margin: 0 0 0.75rem 0;

  strong {
    color: var(--accent);
    font-weight: 600;
  }
`;

const UltimoTreinoSugestaoDica = styled.p`
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  padding-left: 0.75rem;
  border-left: 3px solid rgba(198, 169, 100, 0.5);
`;

const AplicarSugestaoButton = styled(motion.button)`
  background: rgba(198, 169, 100, 0.15);
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  width: 100%;

  @media (min-width: 480px) {
    width: auto;
  }

  &:hover {
    background: rgba(198, 169, 100, 0.25);
  }
`;

const TreinoDoDiaCard = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 2px solid var(--accent);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  cursor: default;
  user-select: none;
`;

const TreinoDoDiaLabel = styled.div`
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
  cursor: default;
  user-select: none;
`;

const DivisaoTipoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
`;

const TipoDivisaoChip = styled.button`
  background: ${(p) => (p.$active ? 'rgba(198, 169, 100, 0.35)' : 'rgba(255, 255, 255, 0.06)')};
  border: 1px solid ${(p) => (p.$active ? 'var(--accent)' : 'rgba(198, 169, 100, 0.35)')};
  color: var(--white);
  padding: 0.55rem 0.85rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    border-color: var(--accent);
    background: rgba(198, 169, 100, 0.15);
  }
`;

const DivisaoDetalhe = styled.p`
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0 0 1.25rem 0;
`;

const LetraTreinoLabel = styled.div`
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.65rem;
`;

const LetraTreinoRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: center;
`;

const LetraTreinoChip = styled.button`
  background: ${(p) => (p.$active ? 'linear-gradient(135deg, var(--accent) 0%, #d4a574 100%)' : 'rgba(255, 255, 255, 0.06)')};
  color: ${(p) => (p.$active ? 'var(--background, #0a0a0a)' : 'var(--white)')};
  border: 1px solid ${(p) => (p.$active ? 'var(--accent)' : 'rgba(198, 169, 100, 0.35)')};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover {
    border-color: var(--accent);
  }
`;

const GerarButton = styled(motion.button)`
  background: var(--gold-gradient);
  color: var(--background);
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  font-family: 'Cormorant', serif;

  &:hover:not(:disabled) {
    box-shadow: 0 5px 15px rgba(198, 169, 100, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TreinoDisplay = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const TreinoHeader = styled.div`
  border-bottom: 3px solid #f0f0f0;
  padding-bottom: 2rem;
  margin-bottom: 2rem;
`;

const TreinoTitulo = styled.h2`
  color: var(--white);
  font-size: 2.2rem;
  margin-bottom: 1rem;
  font-weight: 800;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: default;
  user-select: none;
`;

const TreinoMetaInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  cursor: default;
  user-select: none;
`;

const MetaTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: default;
  user-select: none;

  svg {
    color: var(--accent);
  }
`;

const TreinoObjetivo = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  cursor: default;
  user-select: none;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.color};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const RealizadoBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #4ecdc4;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  margin-top: 1rem;
  width: fit-content;
  cursor: default;
  user-select: none;

  svg {
    font-size: 1.2rem;
  }
`;

const ExerciciosList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ExercicioCard = styled.div`
  display: flex;
  gap: 1.5rem;
  background: ${props => props.completo ? 'rgba(78, 205, 196, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.completo ? '#4ecdc4' : 'rgba(198, 169, 100, 0.1)'};
  border-left: 4px solid ${props => props.completo ? '#4ecdc4' : props.emDescanso ? '#ffd93d' : 'var(--accent)'};
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  ${props => props.emDescanso && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 217, 61, 0.1) 50%, 
        transparent 100%
      );
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `}

  &:hover {
    background: ${props => props.completo ? 'rgba(78, 205, 196, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
    transform: translateX(5px);
  }
`;

const ExercicioNumero = styled.div`
  background: ${props => props.completo 
    ? 'linear-gradient(135deg, #4ecdc4 0%, #44a3a0 100%)' 
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.completo ? '1.8rem' : '1.5rem'};
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.3s ease;
  
  ${props => props.completo && `
    animation: pulseComplete 2s infinite;
    
    @keyframes pulseComplete {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `}
`;

const ExercicioInfo = styled.div`
  flex: 1;
`;

const ExercicioNome = styled.h3`
  color: var(--white);
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const PorcaoMuscular = styled.div`
  color: var(--accent);
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 1rem;
  text-transform: capitalize;
`;

const ExercicioDetalhes = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Detalhe = styled.div`
  color: var(--text-secondary);
  font-size: 0.95rem;

  strong {
    color: var(--white);
    margin-right: 0.25rem;
  }
`;

const Tecnica = styled.div`
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 8px;

  strong {
    color: var(--white);
    margin-right: 0.5rem;
  }
`;

const Equipamentos = styled.div`
  color: #999;
  font-size: 0.9rem;
  font-style: italic;

  strong {
    color: #666;
    margin-right: 0.25rem;
  }
`;

const ResumoSection = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
`;

const ResumoTitulo = styled.h3`
  color: var(--accent);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ResumoTexto = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.8;
  white-space: pre-line;
`;

const HistoricoSection = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const HistoricoHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const LimparButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ff5252;
    transform: translateY(-2px);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 3rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, rgba(255, 255, 255, 0.65));

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
    color: var(--accent);
  }
`;

const EmptyText = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--white, #f5f5f5);
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: var(--text-secondary, rgba(255, 255, 255, 0.55));
`;

const HistoricoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const HistoricoCard = styled(motion.div)`
  background: ${(props) =>
    props.realizado
      ? 'rgba(78, 205, 196, 0.12)'
      : 'rgba(255, 255, 255, 0.04)'};
  border: 1px solid
    ${(props) =>
      props.realizado
        ? 'rgba(78, 205, 196, 0.45)'
        : 'rgba(198, 169, 100, 0.25)'};
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: var(--accent);
    background: rgba(198, 169, 100, 0.1);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    transform: translateY(-2px);
  }
`;

const RealizadoIcon = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #4ecdc4;
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const HistoricoTitulo = styled.h4`
  color: var(--white, #f5f5f5);
  font-size: 1.2rem;
  margin-bottom: 1rem;
  margin-right: 2.5rem;
  font-weight: 700;
  line-height: 1.35;
`;

const HistoricoInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
`;

const HistoricoDetalhe = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-size: 0.9rem;

  svg {
    color: var(--accent);
    flex-shrink: 0;
  }
`;

const HistoricoData = styled.div`
  color: var(--text-secondary, rgba(255, 255, 255, 0.55));
  font-size: 0.85rem;
  font-style: italic;
`;

// ==================== TIMER COMPONENTS ====================

const TimerSection = styled.div`
  margin: 2rem 0;
`;

const IniciarTreinoButton = styled(motion.button)`
  width: 100%;
  background: var(--gold-gradient);
  color: var(--background);
  border: none;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(198, 169, 100, 0.3);
  
  svg {
    font-size: 1.8rem;
  }

  &:hover {
    box-shadow: 0 12px 32px rgba(198, 169, 100, 0.5);
  }
`;

const TimerContainer = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 2px solid var(--accent);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TimerDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
`;

const TimerIcon = styled.div`
  font-size: 3rem;
  color: var(--accent);
  
  ${props => props.treinoAtivo && `
    animation: pulse 2s infinite;
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  `}
`;

const TimerTexto = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const TimerLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const TimerValor = styled.div`
  color: var(--white);
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
`;

const TimerControles = styled.div`
  display: flex;
  gap: 1rem;
`;

const TimerButton = styled(motion.button)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: ${props => props.color};
  color: var(--background);
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    font-size: 1.2rem;
  }

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const DescansoTimer = styled.div`
  background: linear-gradient(135deg, rgba(255, 217, 61, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%);
  border: 2px solid #ffd93d;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  box-shadow: 0 8px 24px rgba(255, 217, 61, 0.3);
  position: relative;
  overflow: hidden;
`;

const DescansoContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
`;

const DescansoIcone = styled.div`
  font-size: 3rem;
  animation: rotate 2s linear infinite;
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const DescansoInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DescansoLabel = styled.div`
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const DescansoValor = styled.div`
  color: ${props => props.urgente ? '#ff6b6b' : '#ffd93d'};
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  
  ${props => props.urgente && `
    animation: blink 1s infinite;
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

const PularDescansoButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.9);
  color: var(--background);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: white;
    transform: translateY(-2px);
  }
`;

const DescansoProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  margin-top: 1rem;
  overflow: hidden;
`;

const DescansoProgress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ffd93d 0%, #ffc107 100%);
  width: ${props => props.progresso}%;
  transition: width 1s linear;
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(255, 217, 61, 0.5);
`;

// ==================== EXERCICIO PROGRESS COMPONENTS ====================

const ExercicioHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ExercicioBotoes = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (min-width: 520px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
`;

const CompletarSerieButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.completo ? '#4ecdc4' : 'var(--gold-gradient)'};
  color: ${props => props.completo ? 'white' : 'var(--background)'};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: all 0.3s ease;
  white-space: nowrap;

  svg {
    font-size: 1.2rem;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(198, 169, 100, 0.4);
  }
`;

const CompletarExercicioButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(78, 205, 196, 0.15);
  color: #4ecdc4;
  border: 1px solid rgba(78, 205, 196, 0.55);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: inherit;

  svg {
    font-size: 1.1rem;
  }

  &:hover:not(:disabled) {
    background: rgba(78, 205, 196, 0.25);
    box-shadow: 0 4px 12px rgba(78, 205, 196, 0.25);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DesfazerExercicioButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 217, 61, 0.12);
  color: #ffd93d;
  border: 1px solid rgba(255, 217, 61, 0.45);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: inherit;

  svg {
    font-size: 1.1rem;
  }

  &:hover:not(:disabled) {
    background: rgba(255, 217, 61, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SeriesProgress = styled.div`
  margin-bottom: 1rem;
`;

const SeriesProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const SeriesProgressLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 600;
`;

const SeriesProgressPercentual = styled.div`
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 700;
`;

const SeriesProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const SeriesProgressFill = styled.div`
  height: 100%;
  background: var(--gold-gradient);
  width: ${props => props.progresso}%;
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(198, 169, 100, 0.5);
`;

// ==================== MODAL COMPONENTS ====================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  cursor: default;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%);
  border: 2px solid var(--accent);
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(198, 169, 100, 0.3);
  overflow: hidden;
  cursor: default;
`;

const ModalHeader = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border-bottom: 1px solid var(--accent);
  padding: 1.5rem 2rem;
  cursor: default;
`;

const ModalTitulo = styled.h2`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: default;
`;

const ModalBody = styled.div`
  padding: 2rem;
  cursor: default;
`;

const ModalMensagem = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  cursor: default;
`;

const ModalFooter = styled.div`
  padding: 1.5rem 2rem;
  border-top: 1px solid rgba(198, 169, 100, 0.2);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  cursor: default;
`;

const ModalButton = styled(motion.button)`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.color};
  color: ${props => props.color === '#6c757d' ? 'white' : 'var(--background)'};
  min-width: 120px;

  &:hover {
    filter: brightness(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

export default TreinoPage;
