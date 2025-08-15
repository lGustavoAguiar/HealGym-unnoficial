import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiActivity, FiTarget, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { GiMuscleUp } from 'react-icons/gi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Container>
      <Header>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Logo>HealGym</Logo>
          <UserSection>
            <WelcomeText>Bem-vindo, {user?.name || 'Usuário'}!</WelcomeText>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HeroSection>
            <HeroTitle>Pronto para treinar?</HeroTitle>
            <HeroSubtitle>
              Seu progresso começa aqui. Acesse suas funcionalidades personalizadas.
            </HeroSubtitle>
          </HeroSection>
        </motion.div>

        <QuickActions>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <SectionTitle>Acesso Rápido</SectionTitle>
            <ActionsGrid>
              <ActionCard
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActionIcon>
                  <GiMuscleUp />
                </ActionIcon>
                <ActionTitle>Meus Treinos</ActionTitle>
                <ActionDescription>
                  Acesse seus treinos personalizados
                </ActionDescription>
              </ActionCard>

              <ActionCard
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActionIcon>
                  <FiActivity />
                </ActionIcon>
                <ActionTitle>Progresso</ActionTitle>
                <ActionDescription>
                  Acompanhe sua evolução
                </ActionDescription>
              </ActionCard>

              <ActionCard
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActionIcon>
                  <FiTarget />
                </ActionIcon>
                <ActionTitle>Objetivos</ActionTitle>
                <ActionDescription>
                  Defina e monitore suas metas
                </ActionDescription>
              </ActionCard>

              <ActionCard
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ActionIcon>
                  <FiCalendar />
                </ActionIcon>
                <ActionTitle>Agenda</ActionTitle>
                <ActionDescription>
                  Organize seus treinos
                </ActionDescription>
              </ActionCard>
            </ActionsGrid>
          </motion.div>
        </QuickActions>

        <StatsSection>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <SectionTitle>Estatísticas</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <FiTrendingUp />
                </StatIcon>
                <StatValue>0</StatValue>
                <StatLabel>Treinos Realizados</StatLabel>
              </StatCard>

              <StatCard>
                <StatIcon>
                  <FiTarget />
                </StatIcon>
                <StatValue>0</StatValue>
                <StatLabel>Objetivos Atingidos</StatLabel>
              </StatCard>

              <StatCard>
                <StatIcon>
                  <FiActivity />
                </StatIcon>
                <StatValue>0 min</StatValue>
                <StatLabel>Tempo Total</StatLabel>
              </StatCard>
            </StatsGrid>
          </motion.div>
        </StatsSection>
      </MainContent>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%);
  color: var(--text);
`;

const Header = styled.header`
  padding: 2rem;
  border-bottom: 1px solid rgba(198, 169, 100, 0.2);
  
  > div {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const Logo = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: 2rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const WelcomeText = styled.span`
  font-size: 1.1rem;
  color: var(--text-secondary);
`;

const LogoutButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  border-radius: 8px;
  font-family: 'Marcellus', serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--accent);
    color: var(--primary);
  }
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 2rem;
`;

const HeroSection = styled.section`
  text-align: center;
  margin-bottom: 4rem;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 1rem;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const QuickActions = styled.section`
  margin-bottom: 4rem;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--accent);
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
`;

const ActionCard = styled(motion.div)`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent);
    box-shadow: 0 10px 30px rgba(198, 169, 100, 0.1);
  }
`;

const ActionIcon = styled.div`
  font-size: 3rem;
  color: var(--accent);
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const ActionTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--text);
`;

const ActionDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const StatsSection = styled.section`
  margin-bottom: 4rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
`;

const StatCard = styled.div`
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(198, 169, 100, 0.2);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  color: var(--accent);
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

export default Dashboard;
