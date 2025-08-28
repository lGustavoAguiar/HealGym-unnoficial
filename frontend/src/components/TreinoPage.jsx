import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiActivity, FiClock } from 'react-icons/fi';

const TreinoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tempoDisponivel, setTempoDisponivel] = useState('');
  const [erroTempo, setErroTempo] = useState('');
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [treinoIniciado, setTreinoIniciado] = useState(false);
  const [exercicioAtual, setExercicioAtual] = useState({ segmento: 0, exercicio: 0, serie: 1 });
  const [emDescanso, setEmDescanso] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [treinoJaRealizado, setTreinoJaRealizado] = useState(false);

  // Refs para scroll automático
  const cronogramaRef = useRef(null);
  const planoTreinoRef = useRef(null);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleTempoChange = (e) => {
    const tempo = e.target.value;
    setTempoDisponivel(tempo);
    
    if (tempo && (parseInt(tempo) < 30 || parseInt(tempo) > 90)) {
      setErroTempo('O tempo deve estar entre 30 e 90 minutos');
    } else {
      setErroTempo('');
      
      // Scroll suave para o cronograma quando tempo válido é inserido
      if (tempo && parseInt(tempo) >= 30 && parseInt(tempo) <= 90) {
        setTimeout(() => {
          cronogramaRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 300); // Pequeno delay para permitir que o cronograma apareça
      }
    }
  };

  const treinosSplit = {
    treinoA: {
      nome: 'Treino A',
      grupos: 'Peito e Tríceps',
      segmentos: [
        {
          nome: 'Peitoral Superior',
          exercicios: ['Supino Inclinado', 'Crucifixo Inclinado', 'Flexão Inclinada']
        },
        {
          nome: 'Peitoral Médio',
          exercicios: ['Supino Reto', 'Crucifixo Reto', 'Flexão']
        },
        {
          nome: 'Peitoral Inferior',
          exercicios: ['Supino Declinado', 'Mergulho', 'Crucifixo Declinado']
        },
        {
          nome: 'Tríceps Cabeça Longa',
          exercicios: ['Tríceps Francês', 'Mergulho', 'Extensão Atrás da Cabeça']
        },
        {
          nome: 'Tríceps Cabeça Lateral',
          exercicios: ['Tríceps Pulley', 'Tríceps Corda', 'Kickback']
        },
        {
          nome: 'Tríceps Cabeça Medial',
          exercicios: ['Tríceps Pegada Fechada', 'Flexão Diamante', 'Extensão Unilateral']
        }
      ]
    },
    treinoB: {
      nome: 'Treino B',
      grupos: 'Costas e Bíceps',
      segmentos: [
        {
          nome: 'Latíssimo do Dorso',
          exercicios: ['Puxada Frontal', 'Puxada Atrás', 'Pull-over']
        },
        {
          nome: 'Trapézio',
          exercicios: ['Remada Alta', 'Encolhimento', 'Face Pull']
        },
        {
          nome: 'Romboides',
          exercicios: ['Remada Curvada', 'Remada Cavalinho', 'Remada Unilateral']
        },
        {
          nome: 'Bíceps Longo',
          exercicios: ['Rosca Direta', 'Rosca Martelo', 'Rosca Concentrada']
        },
        {
          nome: 'Bíceps Curto',
          exercicios: ['Rosca Scott', 'Rosca Inclinada', 'Rosca 21']
        },
        {
          nome: 'Braquial',
          exercicios: ['Rosca Inversa', 'Rosca Martelo Cruzada', 'Flexão Isométrica']
        }
      ]
    },
    treinoC: {
      nome: 'Treino C',
      grupos: 'Pernas e Ombros',
      segmentos: [
        {
          nome: 'Quadríceps',
          exercicios: ['Agachamento', 'Leg Press', 'Cadeira Extensora']
        },
        {
          nome: 'Isquiotibiais',
          exercicios: ['Stiff', 'Cadeira Flexora', 'Afundo Reverso']
        },
        {
          nome: 'Glúteos',
          exercicios: ['Hip Thrust', 'Agachamento Búlgaro', 'Elevação Pélvica']
        },
        {
          nome: 'Panturrilha',
          exercicios: ['Panturrilha em Pé', 'Panturrilha Sentado', 'Panturrilha no Leg']
        },
        {
          nome: 'Deltóide Anterior',
          exercicios: ['Desenvolvimento Frontal', 'Elevação Frontal', 'Arnolds']
        },
        {
          nome: 'Deltóide Lateral',
          exercicios: ['Elevação Lateral', 'Desenvolvimento Militar', 'Elevação Lateral Inclinada']
        },
        {
          nome: 'Deltóide Posterior',
          exercicios: ['Crucifixo Inverso', 'Face Pull', 'Elevação Posterior']
        }
      ]
    }
  };

  const cronogramaSemanal = [
    { dia: 'Segunda-feira', treino: 'treinoA', abrev: 'SEG' },
    { dia: 'Terça-feira', treino: 'treinoB', abrev: 'TER' },
    { dia: 'Quarta-feira', treino: 'treinoC', abrev: 'QUA' },
    { dia: 'Quinta-feira', treino: 'treinoA', abrev: 'QUI' },
    { dia: 'Sexta-feira', treino: 'treinoB', abrev: 'SEX' },
    { dia: 'Sábado', treino: 'treinoC', abrev: 'SAB' }
  ];

  const gerarTreinoCompleto = (tempo, tipoTreino) => {
    if (!tempo || tempo < 30 || tempo > 90 || !tipoTreino) return null;

    const treinoSelecionado = treinosSplit[tipoTreino];
    let exerciciosPorSegmento, series, repeticoes, descanso;

    if (tempo <= 45) {
      exerciciosPorSegmento = 1;
      series = 3;
      repeticoes = '10-12';
      descanso = '45-60s';
    } else if (tempo <= 60) {
      exerciciosPorSegmento = 1;
      series = 4;
      repeticoes = '8-12';
      descanso = '60-90s';
    } else {
      exerciciosPorSegmento = 2;
      series = 4;
      repeticoes = '8-15';
      descanso = '60-90s';
    }

    const treinoGerado = {
      nome: treinoSelecionado.nome,
      grupos: treinoSelecionado.grupos,
      tempo: tempo,
      segmentos: treinoSelecionado.segmentos.map(segmento => ({
        nome: segmento.nome,
        exercicios: segmento.exercicios.slice(0, exerciciosPorSegmento).map(exercicio => ({
          nome: exercicio,
          series: series,
          repeticoes: repeticoes,
          descanso: descanso
        }))
      }))
    };

    return treinoGerado;
  };

  const handleDiaClick = (diaInfo) => {
    setDiaSelecionado(diaInfo);
    
    // Scroll suave para o final da página quando um dia é selecionado
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 300); // Pequeno delay para permitir que o plano apareça
  };

  const iniciarTreino = () => {
    setTreinoIniciado(true);
    setExercicioAtual({ segmento: 0, exercicio: 0, serie: 1 });
  };

  const finalizarSerie = () => {
    const treino = gerarTreinoCompleto(parseInt(tempoDisponivel), diaSelecionado.treino);
    const exercicioInfo = treino.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio];
    
    // Se ainda não é a última série, inicia o descanso
    if (exercicioAtual.serie < exercicioInfo.series) {
      iniciarDescanso();
    } else {
      // Se é a última série, vai para o próximo exercício
      proximoExercicio();
    }
  };

  const iniciarDescanso = () => {
    const treino = gerarTreinoCompleto(parseInt(tempoDisponivel), diaSelecionado.treino);
    const exercicioInfo = treino.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio];
    const tempoDescanso = parseInt(exercicioInfo.descanso.split('-')[0]);
    
    setEmDescanso(true);
    setTempoRestante(tempoDescanso);
    
    // Incrementa a série imediatamente ao iniciar o descanso
    setExercicioAtual(prev => ({ ...prev, serie: prev.serie + 1 }));
    
    const id = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setEmDescanso(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setIntervalId(id);
  };

  const proximoExercicio = () => {
    const treino = gerarTreinoCompleto(parseInt(tempoDisponivel), diaSelecionado.treino);
    
    if (exercicioAtual.exercicio + 1 < treino.segmentos[exercicioAtual.segmento].exercicios.length) {
      setExercicioAtual(prev => ({ segmento: prev.segmento, exercicio: prev.exercicio + 1, serie: 1 }));
    } else if (exercicioAtual.segmento + 1 < treino.segmentos.length) {
      setExercicioAtual(prev => ({ segmento: prev.segmento + 1, exercicio: 0, serie: 1 }));
    } else {
      finalizarTreino();
    }
  };

  const finalizarTreino = () => {
    // Salvar treino realizado no localStorage
    const treinoRealizado = {
      data: new Date().toISOString(),
      dia: getDiaAtual(),
      treino: diaSelecionado?.treino,
      duracao: parseInt(tempoDisponivel)
    };

    const treinosExistentes = JSON.parse(localStorage.getItem('treinosRealizados') || '[]');
    treinosExistentes.push(treinoRealizado);
    localStorage.setItem('treinosRealizados', JSON.stringify(treinosExistentes));

    // Reset do estado
    setTreinoIniciado(false);
    setExercicioAtual({ segmento: 0, exercicio: 0, serie: 1 });
    setEmDescanso(false);
    setTempoRestante(0);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Mostrar mensagem de sucesso customizada e atualizar estado
    setShowSuccessMessage(true);
    setTreinoJaRealizado(true);
    
    // Esconder mensagem após 5 segundos
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  // Função para obter o dia atual da semana (1 = segunda, 7 = domingo)
  const getDiaAtual = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 7 : dayOfWeek; // Converte domingo (0) para 7
  };

  // Função para obter o treino do dia atual
  const getTreinoDoDia = () => {
    const diaAtual = getDiaAtual();
    
    // Domingo é dia de descanso
    if (diaAtual === 7) {
      return null;
    }

    const cronogramaSemanal = [
      { dia: 'Segunda-feira', treino: 'treinoA', abrev: 'SEG', dayOfWeek: 1 },
      { dia: 'Terça-feira', treino: 'treinoB', abrev: 'TER', dayOfWeek: 2 },
      { dia: 'Quarta-feira', treino: 'treinoC', abrev: 'QUA', dayOfWeek: 3 },
      { dia: 'Quinta-feira', treino: 'treinoA', abrev: 'QUI', dayOfWeek: 4 },
      { dia: 'Sexta-feira', treino: 'treinoB', abrev: 'SEX', dayOfWeek: 5 },
      { dia: 'Sábado', treino: 'treinoC', abrev: 'SAB', dayOfWeek: 6 }
    ];

    return cronogramaSemanal.find(dia => dia.dayOfWeek === diaAtual);
  };

  // Função para verificar se o treino de hoje já foi realizado
  const verificarTreinoRealizado = () => {
    const today = new Date();
    const todayString = today.toDateString();
    
    const treinosExistentes = JSON.parse(localStorage.getItem('treinosRealizados') || '[]');
    return treinosExistentes.some(treino => {
      const treinoDate = new Date(treino.data);
      return treinoDate.toDateString() === todayString;
    });
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Verificar se o treino já foi realizado hoje ao carregar a página
  useEffect(() => {
    const jaRealizado = verificarTreinoRealizado();
    setTreinoJaRealizado(jaRealizado);
  }, []);

  // Automaticamente selecionar o treino do dia atual quando o tempo for definido
  useEffect(() => {
    if (tempoDisponivel && !erroTempo && parseInt(tempoDisponivel) >= 30 && parseInt(tempoDisponivel) <= 90) {
      const treinoDoDia = getTreinoDoDia();
      if (treinoDoDia) {
        setDiaSelecionado(treinoDoDia);
      }
    }
  }, [tempoDisponivel, erroTempo]);

  const treinoDodia = diaSelecionado ? gerarTreinoCompleto(parseInt(tempoDisponivel), diaSelecionado.treino) : null;
  const diaAtual = getDiaAtual();
  const isDomingoDescanso = diaAtual === 7;

  return (
    <Container className="custom-scroll">
      <Header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <BackButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToDashboard}
          >
            <FiArrowLeft />
            Voltar
          </BackButton>
          <Logo>HealGym</Logo>
        </motion.div>
      </Header>

      <MainContent>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <PageTitle>Seu Plano de Treino</PageTitle>
          <PageSubtitle>
            Treinamento personalizado baseado no seu perfil e objetivos
          </PageSubtitle>

          <WorkoutCard>
            <WorkoutHeader>
              <WorkoutIcon>
                <FiActivity />
              </WorkoutIcon>
              <WorkoutTitle>Treino Personalizado</WorkoutTitle>
            </WorkoutHeader>

            <TimeSection>
              <TimeIcon>
                <FiClock />
              </TimeIcon>
              <TimeContent>
                <TimeLabel>Quanto tempo você tem disponível para treinar?</TimeLabel>
                <TimeInput
                  type="number"
                  value={tempoDisponivel}
                  onChange={handleTempoChange}
                  placeholder="Digite em minutos"
                  min="30"
                  max="90"
                />
                <TimeHint>Entre 30 minutos e 90 minutos (1h30)</TimeHint>
                {erroTempo && <ErrorMessage>{erroTempo}</ErrorMessage>}
              </TimeContent>
            </TimeSection>

            {tempoDisponivel && !erroTempo && parseInt(tempoDisponivel) >= 30 && parseInt(tempoDisponivel) <= 90 && (
              <WeeklySchedule ref={cronogramaRef}>
                {isDomingoDescanso ? (
                  <RestDayMessage>
                    <RestDayTitle>🌅 Domingo - Dia de Descanso</RestDayTitle>
                    <RestDayDescription>
                      Hoje é seu dia de recuperação! Aproveite para relaxar, fazer alongamentos leves ou uma caminhada.
                      Volte amanhã para continuar seu treino.
                    </RestDayDescription>
                    <RestDayTip>
                      💡 <strong>Dica:</strong> O descanso é fundamental para o crescimento muscular e recuperação.
                    </RestDayTip>
                  </RestDayMessage>
                ) : (
                  <>
                    <ScheduleTitle>Treino de Hoje</ScheduleTitle>
                    {diaSelecionado && (
                      <TodayWorkoutCard>
                        <TodayWorkoutHeader>
                          <TodayWorkoutDay>{diaSelecionado.dia}</TodayWorkoutDay>
                          <TodayWorkoutBadge>HOJE</TodayWorkoutBadge>
                        </TodayWorkoutHeader>
                        <TodayWorkoutInfo>
                          <TrainingType>{treinosSplit[diaSelecionado.treino].nome}</TrainingType>
                          <MuscleGroups>{treinosSplit[diaSelecionado.treino].grupos}</MuscleGroups>
                        </TodayWorkoutInfo>
                      </TodayWorkoutCard>
                    )}
                    <ScheduleHint>Este é o seu treino programado para hoje</ScheduleHint>
                  </>
                )}
              </WeeklySchedule>
            )}

            {treinoDodia && !treinoIniciado && !treinoJaRealizado && (
              <WorkoutPlan ref={planoTreinoRef}>
                <PlanHeader>
                  <PlanTitle>{diaSelecionado.dia} - {treinoDodia.nome}: {treinoDodia.grupos}</PlanTitle>
                  <PlanTime>{treinoDodia.tempo} minutos</PlanTime>
                </PlanHeader>

                <SegmentsList>
                  {treinoDodia.segmentos.map((segmento, index) => (
                    <SegmentCard key={index}>
                      <SegmentTitle>{segmento.nome}</SegmentTitle>
                      <ExercisesList>
                        {segmento.exercicios.map((exercicio, exIndex) => (
                          <ExerciseItem key={exIndex}>
                            <ExerciseName>{exercicio.nome}</ExerciseName>
                            <ExerciseDetails>
                              {exercicio.series} séries × {exercicio.repeticoes} rep
                              <ExerciseRest>Descanso: {exercicio.descanso}</ExerciseRest>
                            </ExerciseDetails>
                          </ExerciseItem>
                        ))}
                      </ExercisesList>
                    </SegmentCard>
                  ))}
                </SegmentsList>

                <StartWorkoutButton
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={iniciarTreino}
                >
                  Começar Treino
                </StartWorkoutButton>
              </WorkoutPlan>
            )}

            {treinoJaRealizado && !isDomingoDescanso && (
              <CompletedWorkoutMessage>
                <CompletedWorkoutTitle>✅ Treino de Hoje Concluído!</CompletedWorkoutTitle>
                <CompletedWorkoutDescription>
                  Parabéns! Você já realizou seu treino de hoje. Descanse bem e volte amanhã para continuar sua jornada fitness.
                </CompletedWorkoutDescription>
                <CompletedWorkoutTip>
                  💡 <strong>Dica:</strong> Mantenha-se hidratado e faça uma boa alimentação para otimizar sua recuperação.
                </CompletedWorkoutTip>
              </CompletedWorkoutMessage>
            )}

            {treinoIniciado && treinoDodia && (
              <WorkoutExecution>
                <ExecutionHeader>
                  <ExecutionTitle>
                    {treinoDodia.segmentos[exercicioAtual.segmento].nome}
                  </ExecutionTitle>
                  <ExecutionProgress>
                    {emDescanso 
                      ? `Série ${exercicioAtual.serie - 1} concluída - Próxima: ${exercicioAtual.serie} de ${treinoDodia.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio].series}`
                      : `Série ${exercicioAtual.serie} de ${treinoDodia.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio].series}`
                    }
                  </ExecutionProgress>
                </ExecutionHeader>

                <CurrentExercise>
                  <ExerciseName>
                    {treinoDodia.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio].nome}
                  </ExerciseName>
                  <ExerciseInfo>
                    {treinoDodia.segmentos[exercicioAtual.segmento].exercicios[exercicioAtual.exercicio].repeticoes} repetições
                  </ExerciseInfo>
                </CurrentExercise>

                {emDescanso ? (
                  <RestTimer>
                    <RestTitle>Descanso</RestTitle>
                    <Timer>{formatarTempo(tempoRestante)}</Timer>
                    <RestMessage>Prepare-se para a próxima série!</RestMessage>
                  </RestTimer>
                ) : (
                  <ExerciseControls>
                    <FinishSetButton
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={finalizarSerie}
                    >
                      Finalizar Série
                    </FinishSetButton>
                  </ExerciseControls>
                )}

                <WorkoutActions>
                  <StopWorkoutButton
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={finalizarTreino}
                  >
                    Parar Treino
                  </StopWorkoutButton>
                </WorkoutActions>
              </WorkoutExecution>
            )}
          </WorkoutCard>
        </motion.div>
      </MainContent>

      {/* Mensagem de sucesso customizada */}
      {showSuccessMessage && (
        <SuccessMessage
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
        >
          <SuccessIcon>🎉</SuccessIcon>
          <SuccessTitle>Parabéns!</SuccessTitle>
          <SuccessDescription>Treino finalizado com sucesso!</SuccessDescription>
        </SuccessMessage>
      )}
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

const WorkoutCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const WorkoutHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const WorkoutIcon = styled.div`
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

const WorkoutTitle = styled.h2`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 600;
  cursor: default;
`;

const TimeSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 2rem;
`;

const TimeIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 12px;
  width: 50px;
  height: 50px;
  flex-shrink: 0;

  svg {
    color: var(--background);
    font-size: 1.5rem;
  }
`;

const TimeContent = styled.div`
  flex: 1;
`;

const TimeLabel = styled.label`
  color: var(--white);
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: block;
`;

const TimeInput = styled.input`
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

const TimeHint = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 4px;
  font-weight: 500;
`;

const WeeklySchedule = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(198, 169, 100, 0.2);
`;

const ScheduleTitle = styled.h3`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const DayCard = styled(motion.div)`
  background: ${props => props.isSelected ? 'rgba(198, 169, 100, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${props => props.isSelected ? 'var(--accent)' : 'rgba(198, 169, 100, 0.1)'};
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(198, 169, 100, 0.08);
    border-color: var(--accent);
  }
`;

const DayName = styled.div`
  color: var(--accent);
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const TrainingType = styled.div`
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const MuscleGroups = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.3;
`;

const ScheduleHint = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: center;
  font-style: italic;
  margin-top: 1rem;
`;

const WorkoutPlan = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(198, 169, 100, 0.2);
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const PlanTitle = styled.h3`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const PlanTime = styled.div`
  color: var(--accent);
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: '⏱️';
  }
`;

const SegmentsList = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SegmentCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
`;

const SegmentTitle = styled.h4`
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:before {
    content: '💪';
  }
`;

const ExercisesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const ExerciseItem = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(198, 169, 100, 0.05);
  border-radius: 8px;
  padding: 1rem;
`;

const ExerciseName = styled.div`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const ExerciseDetails = styled.div`
  color: var(--text-secondary);
  font-size: 0.95rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ExerciseRest = styled.span`
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 500;
`;

const StartWorkoutButton = styled(motion.button)`
  width: 100%;
  padding: 1rem 2rem;
  background: var(--gold-gradient);
  border: none;
  border-radius: 8px;
  color: var(--background);
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Cormorant', serif;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(198, 169, 100, 0.3);
  }
`;

const WorkoutExecution = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 12px;
  text-align: center;
`;

const ExecutionHeader = styled.div`
  margin-bottom: 2rem;
`;

const ExecutionTitle = styled.h3`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ExecutionProgress = styled.div`
  color: var(--text-secondary);
  font-size: 1.1rem;
  font-weight: 500;
`;

const CurrentExercise = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ExerciseInfo = styled.div`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-top: 0.5rem;
`;

const RestTimer = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 1px solid rgba(198, 169, 100, 0.3);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const RestTitle = styled.h4`
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const Timer = styled.div`
  color: var(--white);
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
`;

const RestMessage = styled.div`
  color: var(--text-secondary);
  font-size: 1rem;
  font-style: italic;
`;

const ExerciseControls = styled.div`
  margin-bottom: 2rem;
`;

const FinishSetButton = styled(motion.button)`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  font-family: 'Cormorant', serif;
  padding: 1.5rem 3rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
  }
`;

const WorkoutActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const StopWorkoutButton = styled(motion.button)`
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Cormorant', serif;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
  }
`;

const RestDayMessage = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 12px;
`;

const RestDayTitle = styled.h3`
  color: var(--white);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const RestDayDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const RestDayTip = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 1rem;
  
  strong {
    color: var(--accent);
  }
`;

const TodayWorkoutCard = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 2px solid var(--accent);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  position: relative;
`;

const TodayWorkoutHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const TodayWorkoutDay = styled.h4`
  color: var(--white);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const TodayWorkoutBadge = styled.div`
  background: var(--accent);
  color: var(--background);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  letter-spacing: 0.5px;
`;

const TodayWorkoutInfo = styled.div`
  text-align: center;
`;

const CompletedWorkoutMessage = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  margin-top: 2rem;
`;

const CompletedWorkoutTitle = styled.h3`
  color: #4CAF50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
`;

const CompletedWorkoutDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const CompletedWorkoutTip = styled.div`
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 1rem;
  
  strong {
    color: #4CAF50;
  }
`;

const SuccessMessage = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--card-bg);
  border: 2px solid #4CAF50;
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  z-index: 1000;
  min-width: 300px;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const SuccessTitle = styled.h2`
  color: #4CAF50;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
`;

const SuccessDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
`;

export default TreinoPage;
