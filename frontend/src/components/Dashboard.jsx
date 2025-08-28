import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser, FiActivity, FiHeart, FiTrendingUp, FiTarget } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const calculateIMC = (weight, height) => {
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getIMCClassification = (imc) => {
    if (!imc) return null;
    const imcValue = parseFloat(imc);
    if (imcValue < 18.5) return { text: 'Abaixo do peso', color: '#3b82f6' };
    if (imcValue < 25) return { text: 'Peso normal', color: '#10b981' };
    if (imcValue < 30) return { text: 'Sobrepeso', color: '#f59e0b' };
    if (imcValue < 35) return { text: 'Obesidade grau I', color: '#ef4444' };
    if (imcValue < 40) return { text: 'Obesidade grau II', color: '#dc2626' };
    return { text: 'Obesidade grau III', color: '#991b1b' };
  };

  const calculateIdealWeight = (height, gender) => {
    if (!height || !gender) return null;
    const baseWeight = height - 100;
    return gender === 'masculino' ? 
      Math.round(baseWeight * 0.9) : 
      Math.round(baseWeight * 0.85);
  };



  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileEdit = () => {
    navigate('/edit-profile');
  };

  const handleTreinoClick = () => {
    navigate('/treino');
  };

  const handleDietaClick = () => {
    navigate('/dieta');
  };
  const age = calculateAge(user?.profile?.dateOfBirth);
  const tmb = calculateTMB(user?.profile?.weight, user?.profile?.height, age, user?.profile?.gender);
  const imc = calculateIMC(user?.profile?.weight, user?.profile?.height);
  const imcClass = getIMCClassification(imc);
  const idealWeight = calculateIdealWeight(user?.profile?.height, user?.profile?.gender);

  return (
    <Container className="custom-scroll">
      <Header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo>HealGym</Logo>
          <UserSection>
            <WelcomeText>Olá, {user?.name?.split(' ')[0] || 'Usuário'}!</WelcomeText>
            <ProfileButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProfileEdit}
              title="Editar Perfil"
            >
              <FiUser />
            </ProfileButton>
            <LogoutButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
            >
              <FiLogOut />
              Sair
            </LogoutButton>
          </UserSection>
        </motion.div>
      </Header>

      <MainContent>
        <HealthPanel>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >


            {user?.profile ? (
              <>
                <MetricCard>
                  <MetricIcon>
                    <FiHeart />
                  </MetricIcon>
                  <MetricContent>
                    <MetricLabel>Taxa Metabólica Basal</MetricLabel>
                    <MetricValue>{tmb ? `${tmb} kcal/dia` : 'Calculando...'}</MetricValue>
                    <MetricDescription>Calorias queimadas em repouso</MetricDescription>
                  </MetricContent>
                </MetricCard>



                <MetricCard>
                  <MetricIcon>
                    <FiTarget />
                  </MetricIcon>
                  <MetricContent>
                    <MetricLabel>Índice de Massa Corporal</MetricLabel>
                    <MetricValue>{imc ? `${imc} kg/m²` : 'Calculando...'}</MetricValue>
                    {imcClass && (
                      <IMCStatus color={imcClass.color}>
                        {imcClass.text}
                      </IMCStatus>
                    )}
                  </MetricContent>
                </MetricCard>

                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Idade</InfoLabel>
                    <InfoValue>{age ? `${age} anos` : 'N/A'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Sexo</InfoLabel>
                    <InfoValue>{user.profile.gender === 'masculino' ? 'Masculino' : 'Feminino'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Altura</InfoLabel>
                    <InfoValue>{user.profile.height ? `${user.profile.height} cm` : 'N/A'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Peso Atual</InfoLabel>
                    <InfoValue>{user.profile.weight ? `${user.profile.weight} kg` : 'N/A'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Peso Ideal</InfoLabel>
                    <InfoValue>{idealWeight ? `${idealWeight} kg` : 'N/A'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Biotipo</InfoLabel>
                    <InfoValue>
                      {user.profile.bodyType === 'ectomorfo' && 'Ectomorfo'}
                      {user.profile.bodyType === 'mesomorfo' && 'Mesomorfo'}
                      {user.profile.bodyType === 'endomorfo' && 'Endomorfo'}
                    </InfoValue>
                  </InfoItem>
                </InfoGrid>


              </>
            ) : (
              <EmptyState>
                <EmptyStateText>Complete seu perfil para ver suas métricas de saúde</EmptyStateText>
                <CompleteProfileButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleProfileEdit}
                >
                  Completar Perfil
                </CompleteProfileButton>
              </EmptyState>
            )}
          </motion.div>
        </HealthPanel>

        <MainArea>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <WelcomeCard>
              <WelcomeTitle>Bem-vindo ao HealGym!</WelcomeTitle>
              <WelcomeDescription>
                Seu aplicativo completo para treino e dieta personalizada.
              </WelcomeDescription>
              <FeaturesList>
                <FeatureItem
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleTreinoClick}
                >
                  🏋️ Treino
                </FeatureItem>
                <FeatureItem
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDietaClick}
                >
                  🥗 Dieta
                </FeatureItem>
              </FeaturesList>
            </WelcomeCard>
          </motion.div>
        </MainArea>
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
    justify-content: space-between;
    align-items: center;
    width: 100%;
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

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const WelcomeText = styled.span`
  color: var(--text-secondary);
  font-size: 1.1rem;
  font-weight: 500;
`;

const ProfileButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 0.75rem;
  border-radius: 50%;
  width: 45px;
  height: 45px;
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

const LogoutButton = styled(motion.button)`
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
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  padding: 2rem;
  min-height: calc(100vh - 120px);

  @media (max-width: 1200px) {
    grid-template-columns: 350px 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const HealthPanel = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  height: fit-content;
  max-height: calc(100vh - 160px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--accent);
    border-radius: 3px;
  }
`;

const MetricCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(198, 169, 100, 0.3);
    transform: translateY(-2px);
  }
`;

const MetricIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gold-gradient);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;

  svg {
    color: var(--background);
    font-size: 1.2rem;
  }
`;

const MetricContent = styled.div`
  flex: 1;
`;

const MetricLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
`;

const MetricValue = styled.div`
  color: var(--white);
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const MetricDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  opacity: 0.8;
`;

const IMCStatus = styled.div`
  color: ${props => props.color};
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => `${props.color}20`};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
  margin-top: 0.25rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const InfoItem = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(198, 169, 100, 0.1);
  border-radius: 6px;
  padding: 0.75rem;
  text-align: center;
  cursor: default;
`;

const InfoLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
  font-weight: 500;
`;

const InfoValue = styled.div`
  color: var(--white);
  font-size: 1rem;
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 1rem;
`;

const EmptyStateText = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const CompleteProfileButton = styled(motion.button)`
  background: var(--gold-gradient);
  color: var(--background);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 15px rgba(198, 169, 100, 0.4);
  }
`;

const MainArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WelcomeCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const WelcomeTitle = styled.h1`
  color: var(--white);
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: default;
  text-align: center;
`;

const WelcomeDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  cursor: default;
  text-align: center;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
`;

const FeatureItem = styled(motion.div)`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 8px;
  padding: 1rem;
  color: var(--white);
  font-size: 1rem;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
    border-color: var(--accent);
    box-shadow: 0 4px 15px rgba(198, 169, 100, 0.3);
  }
`;

export default Dashboard;
