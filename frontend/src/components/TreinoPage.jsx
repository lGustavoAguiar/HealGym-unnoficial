import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiActivity, FiClock, FiTrash2, FiCheck, FiZap } from 'react-icons/fi';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const TreinoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('TreinoPage renderizando...', { user });
  
  // Função para detectar o grupamento muscular do dia
  const getGrupamentoDoDia = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, ..., 6 = sábado
    
    const cronograma = {
      1: 'PEITO_TRICEPS',  // Segunda
      2: 'COSTAS_BICEPS',  // Terça
      3: 'PERNAS_OMBROS',  // Quarta
      4: 'PEITO_TRICEPS',  // Quinta
      5: 'COSTAS_BICEPS',  // Sexta
      6: 'PERNAS_OMBROS'   // Sábado
    };
    
    return cronograma[dayOfWeek] || 'PEITO_TRICEPS'; // Default para segunda se for domingo
  };

  const [tempoDisponivel, setTempoDisponivel] = useState('');
  const [grupamento] = useState(getGrupamentoDoDia()); // Definido automaticamente
  const [loading, setLoading] = useState(false);
  const [treinoGerado, setTreinoGerado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const grupamentos = [
    { value: 'PEITO', label: 'Peito Completo', icon: '💪', color: '#ff6b6b' },
    { value: 'COSTAS', label: 'Costas Completas', icon: '🔥', color: '#4ecdc4' },
    { value: 'OMBROS', label: 'Ombros 3D', icon: '⚡', color: '#ffd93d' },
    { value: 'TRICEPS', label: 'Tríceps Completo', icon: '💥', color: '#a8e6cf' },
    { value: 'BICEPS', label: 'Bíceps e Antebraços', icon: '🎯', color: '#c7ceea' },
    { value: 'PERNAS', label: 'Pernas Completas', icon: '🦵', color: '#ff8787' },
    { value: 'PEITO_TRICEPS', label: 'Peito + Tríceps', icon: '🔥💪', color: '#95e1d3' },
    { value: 'COSTAS_BICEPS', label: 'Costas + Bíceps', icon: '💪🎯', color: '#f38181' },
    { value: 'PERNAS_OMBROS', label: 'Pernas + Ombros', icon: '🦵⚡', color: '#aa96da' }
  ];

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const response = await api.getMyWorkouts();
      if (response.success) {
        setHistorico(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleGerarTreino = async () => {
    if (!tempoDisponivel || tempoDisponivel < 30 || tempoDisponivel > 90) {
      alert('Por favor, insira um tempo válido entre 30 e 90 minutos');
      return;
    }

    setLoading(true);
    try {
      const response = await api.generateWorkout({
        grupamento,
        tempoDisponivel: parseInt(tempoDisponivel)
      });

      if (response.success) {
        setTreinoGerado(response.data);
        carregarHistorico();
      }
    } catch (error) {
      console.error('Erro ao gerar treino:', error);
      alert('Erro ao gerar treino. Tente novamente.');
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
      }
    } catch (error) {
      console.error('Erro ao marcar treino:', error);
    }
  };

  const handleDeletarTreino = async (id) => {
    if (!window.confirm('Deseja realmente deletar este treino?')) return;

    try {
      const response = await api.deleteWorkout(id);
      if (response.success) {
        carregarHistorico();
        if (treinoGerado && treinoGerado._id === id) {
          setTreinoGerado(null);
        }
      }
    } catch (error) {
      console.error('Erro ao deletar treino:', error);
    }
  };

  const handleLimparHistorico = async () => {
    if (!window.confirm('Deseja realmente limpar todo o histórico de treinos?')) return;

    try {
      const response = await api.clearWorkoutHistory();
      if (response.success) {
        setHistorico([]);
        setTreinoGerado(null);
      }
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  const handleVisualizarTreino = (treino) => {
    setTreinoGerado(treino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Container className="custom-scroll">
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
          Voltar ao Dashboard
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
            Gere treinos personalizados baseados no tempo disponível e grupo muscular
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
            <TreinoDoDiaCard>
              <TreinoDoDiaLabel>Treino do Dia</TreinoDoDiaLabel>
              <TreinoDoDiaGrupo>
                <GrupamentoIconLarge>
                  {grupamentos.find(g => g.value === grupamento)?.icon}
                </GrupamentoIconLarge>
                <TreinoDoDiaNome>
                  {grupamentos.find(g => g.value === grupamento)?.label}
                </TreinoDoDiaNome>
              </TreinoDoDiaGrupo>
            </TreinoDoDiaCard>

            <InputGroup>
              <Label>
                <FiClock />
                Tempo Disponível (minutos)
              </Label>
              <Input
                type="number"
                min="30"
                max="90"
                value={tempoDisponivel}
                onChange={(e) => setTempoDisponivel(e.target.value)}
                placeholder="Entre 30 e 90 minutos"
              />
              <InputHint>30 min = treino rápido | 45-60 min = ideal | 75-90 min = avançado</InputHint>
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
                {treinoGerado.exercicios.map((exercicio, index) => (
                  <ExercicioCard key={index}>
                    <ExercicioNumero>{index + 1}</ExercicioNumero>
                    <ExercicioInfo>
                      <ExercicioNome>{exercicio.nome}</ExercicioNome>
                      <PorcaoMuscular>{exercicio.porcaoMuscular}</PorcaoMuscular>
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
                ))}
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
`;

const PageSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 2rem;
  cursor: default;
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
`;

const GrupamentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
`;

const GrupamentoCard = styled.div`
  background: ${props => props.selected ? props.color : 'white'};
  border: 3px solid ${props => props.selected ? props.color : '#e0e0e0'};
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  color: ${props => props.selected ? 'white' : '#333'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
    border-color: ${props => props.color};
  }
`;

const GrupamentoIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`;

const GrupamentoLabel = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
`;

const TreinoDoDiaCard = styled.div`
  background: rgba(198, 169, 100, 0.1);
  border: 2px solid var(--accent);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const TreinoDoDiaLabel = styled.div`
  color: var(--accent);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
`;

const TreinoDoDiaGrupo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const GrupamentoIconLarge = styled.div`
  font-size: 3rem;
`;

const TreinoDoDiaNome = styled.h3`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
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
`;

const TreinoMetaInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
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

  svg {
    color: var(--accent);
  }
`;

const TreinoObjetivo = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
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
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-left: 4px solid var(--accent);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateX(5px);
  }
`;

const ExercicioNumero = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  flex-shrink: 0;
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
  color: var(--text-secondary);

  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const EmptyText = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const EmptySubtext = styled.p`
  font-size: 1rem;
  color: #bbb;
`;

const HistoricoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const HistoricoCard = styled(motion.div)`
  background: ${props => props.realizado ? '#e8f8f5' : '#f9f9f9'};
  border: 2px solid ${props => props.realizado ? '#4ecdc4' : '#e0e0e0'};
  border-radius: 15px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
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
  color: var(--white);
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const HistoricoInfo = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const HistoricoDetalhe = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;

  svg {
    color: #667eea;
  }
`;

const HistoricoData = styled.div`
  color: #999;
  font-size: 0.85rem;
  font-style: italic;
`;

export default TreinoPage;
