import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  console.log('🏠 Dashboard - User:', user);
  console.log('🏠 Dashboard - User profile:', user?.profile);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileEdit = () => {
    console.log('🔧 Navegando para edit-profile, user atual:', user);
    navigate('/edit-profile');
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
          <UserSection>
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
  padding: 2rem 0.5rem 2rem 3rem;
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
  margin-right: 1rem;
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

export default Dashboard;
