import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiTarget, FiTrendingUp, FiClock } from 'react-icons/fi';

const DietaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateTMB = (weight, height, age, gender) => {
    if (!weight || !height || !age || !gender) return null;
    
    if (gender === 'masculino') {
      return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
    } else {
      return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const age = calculateAge(user?.profile?.dateOfBirth);
  const tmb = calculateTMB(user?.profile?.weight, user?.profile?.height, age, user?.profile?.gender);

  const getDietRecommendations = (bodyType) => {
    switch (bodyType) {
      case 'ectomorfo':
        return {
          objetivo: 'Ganho de Massa Muscular',
          calorias: tmb ? Math.round(tmb * 1.3) : 'Calculando...',
          macros: { carboidratos: '50%', proteinas: '25%', gorduras: '25%' },
          dicas: [
            'Consuma carboidratos complexos',
            'Faça refeições frequentes (6-7 por dia)',
            'Inclua gorduras saudáveis',
            'Hidrate-se bem durante o treino'
          ]
        };
      case 'mesomorfo':
        return {
          objetivo: 'Manutenção e Definição',
          calorias: tmb ? Math.round(tmb * 1.2) : 'Calculando...',
          macros: { carboidratos: '40%', proteinas: '30%', gorduras: '30%' },
          dicas: [
            'Mantenha dieta balanceada',
            'Varie as fontes de proteína',
            'Consuma frutas e vegetais',
            'Controle as porções'
          ]
        };
      case 'endomorfo':
        return {
          objetivo: 'Perda de Gordura',
          calorias: tmb ? Math.round(tmb * 1.1) : 'Calculando...',
          macros: { carboidratos: '30%', proteinas: '40%', gorduras: '30%' },
          dicas: [
            'Reduza carboidratos simples',
            'Aumente o consumo de proteínas',
            'Prefira vegetais de folhas verdes',
            'Beba bastante água'
          ]
        };
      default:
        return {
          objetivo: 'Dieta Balanceada',
          calorias: tmb || 'Calculando...',
          macros: { carboidratos: '40%', proteinas: '30%', gorduras: '30%' },
          dicas: ['Complete seu perfil para recomendações personalizadas']
        };
    }
  };

  const dietPlan = getDietRecommendations(user?.profile?.bodyType);

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
          <PageTitle>Seu Plano Nutricional</PageTitle>
          <PageSubtitle>
            Dieta personalizada baseada no seu biotipo e objetivos
          </PageSubtitle>

          <DietCard>
            <DietHeader>
              <DietIcon>
                <FiTarget />
              </DietIcon>
              <DietTitle>Plano Nutricional Personalizado</DietTitle>
            </DietHeader>

            <DietInfo>
              <InfoItem>
                <InfoIcon><FiTrendingUp /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Objetivo Principal</InfoLabel>
                  <InfoValue>{dietPlan.objetivo}</InfoValue>
                </InfoContent>
              </InfoItem>

              <InfoItem>
                <InfoIcon><FiClock /></InfoIcon>
                <InfoContent>
                  <InfoLabel>Calorias Diárias</InfoLabel>
                  <InfoValue>{dietPlan.calorias} kcal</InfoValue>
                </InfoContent>
              </InfoItem>
            </DietInfo>

            <MacrosSection>
              <MacrosTitle>Distribuição de Macronutrientes</MacrosTitle>
              <MacrosGrid>
                <MacroItem>
                  <MacroLabel>Carboidratos</MacroLabel>
                  <MacroValue>{dietPlan.macros.carboidratos}</MacroValue>
                </MacroItem>
                <MacroItem>
                  <MacroLabel>Proteínas</MacroLabel>
                  <MacroValue>{dietPlan.macros.proteinas}</MacroValue>
                </MacroItem>
                <MacroItem>
                  <MacroLabel>Gorduras</MacroLabel>
                  <MacroValue>{dietPlan.macros.gorduras}</MacroValue>
                </MacroItem>
              </MacrosGrid>
            </MacrosSection>


          </DietCard>
        </motion.div>
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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

export default DietaPage;
