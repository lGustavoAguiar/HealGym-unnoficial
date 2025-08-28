import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ConfirmDeletePage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const { logout } = useAuth();
  
  const [isConfirming, setIsConfirming] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleConfirmDeletion = async () => {
    setIsConfirming(true);
    setMessage('');

    try {
      const response = await api.confirmAccountDeletion(token);
      
      setMessage(response.message || 'Conta excluída com sucesso!');
      setIsSuccess(true);
      setShowConfirmation(false);
      
      // Fazer logout após 3 segundos
      setTimeout(() => {
        logout();
        navigate('/', { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao confirmar exclusão:', error);
      setMessage(error.message || 'Erro ao confirmar exclusão. O link pode ter expirado.');
      setIsSuccess(false);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <Container>
      <LogoTitle>HealGym</LogoTitle>
      <ContentSection>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <PageTitle>⚠️ Confirmação de Exclusão de Conta</PageTitle>
          <PageSubtitle>
            <div>Esta é sua última chance de reconsiderar</div>
            <div>Esta ação é permanente e irreversível</div>
          </PageSubtitle>
          
          {!message && (
            <WarningContainer>
              <WarningIcon>🚨</WarningIcon>
              <WarningTitle>ATENÇÃO - AÇÃO IRREVERSÍVEL</WarningTitle>
              <WarningText>
                Você está prestes a <strong>EXCLUIR PERMANENTEMENTE</strong> sua conta no HealGym.
                Esta ação resultará na perda completa de:
              </WarningText>
              
              <WarningList>
                <li>🗑️ Todos os seus dados pessoais e de perfil</li>
                <li>🗑️ Histórico completo de treinos e progressos</li>
                <li>🗑️ Configurações e preferências personalizadas</li>
                <li>🗑️ Acesso permanente à plataforma HealGym</li>
              </WarningList>

              <FinalConfirmText>
                <strong>Tem certeza absoluta que deseja prosseguir?</strong>
              </FinalConfirmText>

              <ButtonGroup>
                <CancelButton
                  onClick={handleCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  💚 Não, Manter Minha Conta
                </CancelButton>
                
                <ConfirmButton
                  onClick={() => setShowConfirmation(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isConfirming}
                >
                  🗑️ Sim, Excluir Permanentemente
                </ConfirmButton>
              </ButtonGroup>
            </WarningContainer>
          )}

          <AnimatePresence>
            {message && (
              <MessageContainer
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={isSuccess ? 'success' : 'error'}
              >
                {isSuccess && <SuccessIcon>✅</SuccessIcon>}
                {!isSuccess && <ErrorIcon>❌</ErrorIcon>}
                <MessageText>{message}</MessageText>
                {isSuccess && (
                  <RedirectText>Redirecionando para a página inicial...</RedirectText>
                )}
              </MessageContainer>
            )}
          </AnimatePresence>
        </motion.div>
      </ContentSection>

      {/* Modal de Confirmação Final */}
      <AnimatePresence>
        {showConfirmation && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowConfirmation(false)}
          >
            <ModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>💀 ÚLTIMA CONFIRMAÇÃO</ModalTitle>
              </ModalHeader>
              
              <ModalBody>
                <FinalWarningText>
                  <strong>ESTA É SUA ÚLTIMA CHANCE!</strong>
                </FinalWarningText>
                <FinalWarningText>
                  Após clicar em "EXCLUIR AGORA", sua conta será <strong>PERMANENTEMENTE REMOVIDA </strong> 
                   e você <strong>NUNCA MAIS</strong> poderá recuperá-la.
                </FinalWarningText>
                <FinalConfirmQuestion>
                  Tem certeza absoluta que deseja continuar?
                </FinalConfirmQuestion>
              </ModalBody>
              
              <ModalFooter>
                <ModalCancelButton
                  onClick={() => setShowConfirmation(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </ModalCancelButton>
                <ModalDeleteButton
                  onClick={handleConfirmDeletion}
                  disabled={isConfirming}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isConfirming ? 'Excluindo...' : '💀 EXCLUIR AGORA'}
                </ModalDeleteButton>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const LogoTitle = styled.h1`
  font-size: min(2.5vw, 2.5rem);
  text-decoration: underline;
  text-decoration-thickness: 0.1px;
  text-underline-offset: 0.1em;
  color: var(--white);
  position: absolute;
  top: min(5vh, 40px);
  left: min(5vw, 40px);
  font-weight: 600;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.1vw;
  cursor: default;
  font-family: 'Cinzel', serif;
  z-index: 10;
`;

const ContentSection = styled.section`
  width: min(95vw, 900px);
  max-height: none;
  padding: min(3vh, 25px);
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
`;

const PageTitle = styled.h1`
  font-size: min(4vw, 2.5rem);
  color: var(--white);
  margin-bottom: min(1.5vh, 12px);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.1vw;
  cursor: default;
  font-family: 'Poppins', sans-serif;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const PageSubtitle = styled.p`
  font-size: min(2.2vw, 1.1rem);
  color: var(--text-secondary);
  margin-bottom: min(4vh, 30px);
  text-align: center;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
  line-height: 1.4;
  font-weight: 600;
  
  div {
    margin-bottom: 0.3rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const WarningContainer = styled.div`
  background: rgba(220, 38, 38, 0.1);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  padding: min(4vh, 40px);
  margin-bottom: min(3vh, 30px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
`;

const WarningIcon = styled.div`
  font-size: 4rem;
  text-align: center;
  margin-bottom: min(2vh, 20px);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const WarningTitle = styled.h2`
  color: var(--white);
  font-size: min(3vw, 1.8rem);
  font-weight: 800;
  text-align: center;
  margin-bottom: min(2vh, 20px);
  font-family: 'Poppins', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const WarningText = styled.p`
  color: var(--text-secondary);
  font-size: min(2vw, 1.2rem);
  font-weight: 600;
  text-align: center;
  margin-bottom: min(2vh, 20px);
  line-height: 1.5;
  font-family: 'Cormorant', serif;
`;

const WarningList = styled.ul`
  color: var(--text-secondary);
  font-size: min(1.8vw, 1.1rem);
  margin: min(3vh, 30px) 0;
  padding-left: min(3vw, 30px);
  
  li {
    margin-bottom: min(1vh, 12px);
    line-height: 1.4;
    font-weight: 600;
  }
`;

const FinalConfirmText = styled.p`
  color: var(--white);
  font-size: min(2.2vw, 1.3rem);
  font-weight: 700;
  text-align: center;
  margin: min(3vh, 30px) 0;
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: min(2vh, 15px);
  margin-top: min(4vh, 40px);
  
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const CancelButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(1.5vh, 15px) min(3vw, 30px);
  font-size: min(1.8vw, 1.1rem);
  background: linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%);
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
  font-weight: 600;

  &:hover {
    box-shadow: 0 6px 20px rgba(22, 163, 74, 0.5);
    transform: translateY(-2px);
  }
`;

const ConfirmButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(1.5vh, 15px) min(3vw, 30px);
  font-size: min(1.8vw, 1.1rem);
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
  font-weight: 600;

  &:hover {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const MessageContainer = styled(motion.div)`
  padding: min(3vh, 30px);
  border-radius: 12px;
  text-align: center;
  margin-top: min(3vh, 30px);
  
  &.success {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 2px solid #16a34a;
    color: #166534;
  }
  
  &.error {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 2px solid #dc2626;
    color: #7f1d1d;
  }
`;

const SuccessIcon = styled.div`
  font-size: 3rem;
  margin-bottom: min(2vh, 15px);
  animation: bounce 1s infinite;
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: min(2vh, 15px);
  animation: shake 0.5s infinite;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const MessageText = styled.p`
  font-size: min(2vw, 1.2rem);
  font-weight: 600;
  margin-bottom: min(1vh, 10px);
  font-family: 'Cormorant', serif;
`;

const RedirectText = styled.p`
  font-size: min(1.6vw, 1rem);
  font-style: italic;
  margin: 0;
  font-family: 'Cormorant', serif;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 2px solid rgba(220, 38, 38, 0.4);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
`;

const ModalHeader = styled.div`
  padding: 30px 30px 20px 30px;
  border-bottom: 1px solid rgba(220, 38, 38, 0.3);
  text-align: center;
  background: rgba(220, 38, 38, 0.05);
  border-radius: 16px 16px 0 0;
`;

const ModalTitle = styled.h2`
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0;
  font-family: 'Poppins', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
`;

const ModalBody = styled.div`
  padding: 30px;
`;

const FinalWarningText = styled.p`
  color: var(--white);
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.6;
  font-family: 'Cormorant', serif;
  background: rgba(220, 38, 38, 0.1);
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #dc2626;
`;

const FinalConfirmQuestion = styled.p`
  color: var(--white);
  font-size: 1.3rem;
  font-weight: 800;
  text-align: center;
  margin-top: 30px;
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  padding: 20px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 10px;
  background-color: rgba(220, 38, 38, 0.05);
`;

const ModalFooter = styled.div`
  padding: 20px 30px 30px 30px;
  display: flex;
  gap: 15px;
  justify-content: center;
  border-top: 1px solid rgba(220, 38, 38, 0.3);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 16px 16px;
`;

const ModalCancelButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: 12px 25px;
  font-size: 1rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(198, 169, 100, 0.3);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: rgba(198, 169, 100, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(198, 169, 100, 0.2);
  }
`;

const ModalDeleteButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: 12px 25px;
  font-size: 1rem;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
  font-weight: 600;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.6);
    transform: translateY(-2px);
    
    &::before {
      left: 100%;
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default ConfirmDeletePage;
