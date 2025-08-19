import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Verificar se o token é válido quando a página carrega
    if (!token) {
      setTokenValid(false);
      return;
    }
    
    // Token presente, consideramos válido inicialmente
    // A validação real acontecerá quando o formulário for enviado
    setTokenValid(true);
  }, [token]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'password':
        if (!value) error = 'Nova senha é obrigatória';
        else if (value.length < 6) error = 'Senha deve ter pelo menos 6 caracteres';
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) 
          error = 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
        break;
      case 'confirmPassword':
        if (!value) error = 'Confirmação de senha é obrigatória';
        else if (value !== formData.password) error = 'Senhas não conferem';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const newError = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: newError }));
    }
    
    // Revalidar confirmPassword se a senha principal mudou
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = formData.confirmPassword !== value ? 'Senhas não conferem' : '';
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: newError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched({ password: true, confirmPassword: true });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.post(`/auth/reset-password/${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.';
      setErrors({ general: errorMessage });
      
      if (error.response?.status === 400 && errorMessage.includes('Token')) {
        setTokenValid(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenValid === false || !token) {
    return (
      <Container>
        <LogoTitle onClick={() => navigate('/')}>HealGym</LogoTitle>
        <FormSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <ErrorContainer>
              <ErrorIcon>⚠️</ErrorIcon>
              <ErrorTitle>Link Inválido</ErrorTitle>
              <ErrorMessage>
                O link de recuperação de senha é inválido ou expirou.
              </ErrorMessage>
              <ErrorSubtext>
                Solicite um novo link de recuperação ou entre em contato com o suporte.
              </ErrorSubtext>
              
              <ActionButtons>
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/forgot-password')}
                >
                  Solicitar Novo Link
                </ActionButton>
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  variant="secondary"
                >
                  Voltar ao Login
                </ActionButton>
              </ActionButtons>
            </ErrorContainer>
          </motion.div>
        </FormSection>
      </Container>
    );
  }

  return (
    <Container>
      <LogoTitle onClick={() => navigate('/')}>HealGym</LogoTitle>
      <FormSection>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {!isSuccess ? (
            <>
              <FormTitle>Redefinir Senha</FormTitle>
              <FormSubtitle>
                Digite sua nova senha abaixo
              </FormSubtitle>
              
              {errors.general && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.general}
                </ErrorMessage>
              )}
              
              <FormContainer onSubmit={handleSubmit}>
                <InputGroup>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Nova senha"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && errors.password}
                  />
                  <AnimatePresence>
                    {touched.password && errors.password && (
                      <ErrorText
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.password}
                      </ErrorText>
                    )}
                  </AnimatePresence>
                </InputGroup>

                <InputGroup>
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirmar nova senha"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.confirmPassword && errors.confirmPassword}
                  />
                  <AnimatePresence>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <ErrorText
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {errors.confirmPassword}
                      </ErrorText>
                    )}
                  </AnimatePresence>
                </InputGroup>
                
                <SubmitButton
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                >
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                </SubmitButton>
              </FormContainer>
              
              <BackText>
                Lembrou da senha? <BackLink onClick={() => navigate('/login')}>Voltar ao login</BackLink>
              </BackText>
            </>
          ) : (
            <SuccessContainer
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <SuccessIcon>✅</SuccessIcon>
              <SuccessTitle>Senha Redefinida!</SuccessTitle>
              <SuccessMessage>
                Sua senha foi redefinida com sucesso.
              </SuccessMessage>
              <SuccessSubtext>
                Agora você pode fazer login com sua nova senha.
              </SuccessSubtext>
              
              <ActionButtons>
                <ActionButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                >
                  Fazer Login
                </ActionButton>
              </ActionButtons>
            </SuccessContainer>
          )}
        </motion.div>
      </FormSection>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 20px;
`;

const LogoTitle = styled.h1`
  font-size: min(2.5vw, 2.5rem);
  text-decoration: underline;
  text-decoration-thickness: 0.1px;
  text-underline-offset: 6px;
  text-decoration-color: rgba(141, 140, 140, 0.2);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: fixed;
  top: min(10vh, 70px);
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.3vw;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 1000;

  &:hover {
    transform: translateX(-50%) scale(1.05);
  }
`;

const FormSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const FormTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-align: center;
  margin-bottom: 10px;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const FormSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-bottom: 30px;
  font-size: 1rem;
  line-height: 1.5;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid ${props => 
    props.error ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.2)'
  };
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: ${props => 
      props.error ? 'rgba(255, 107, 107, 0.8)' : 'var(--gold-color)'
    };
    box-shadow: 0 0 0 3px ${props => 
      props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(212, 175, 55, 0.2)'
    };
  }
`;

const ErrorText = styled(motion.span)`
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-top: 5px;
`;

const ErrorMessage = styled(motion.div)`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 0.9rem;
`;

const SubmitButton = styled(motion.button)`
  background: var(--gold-gradient);
  color: black;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BackText = styled.p`
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  margin-top: 25px;
  font-size: 0.9rem;
`;

const BackLink = styled.span`
  color: var(--gold-color);
  cursor: pointer;
  font-weight: 600;
  transition: color 0.3s ease;

  &:hover {
    color: #FFD700;
  }
`;

// Success and Error Containers
const SuccessContainer = styled(motion.div)`
  text-align: center;
  padding: 20px;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 20px;
`;

const SuccessIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 20px;
`;

const SuccessTitle = styled.h2`
  color: #4CAF50;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 15px;
`;

const ErrorTitle = styled.h2`
  color: #ff6b6b;
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 15px;
`;

const SuccessMessage = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-bottom: 10px;
`;

const SuccessSubtext = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const ErrorSubtext = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.95rem;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled(motion.button)`
  background: ${props => props.variant === 'secondary' ? 'transparent' : 'var(--gold-gradient)'};
  color: ${props => props.variant === 'secondary' ? 'var(--gold-color)' : 'black'};
  border: ${props => props.variant === 'secondary' ? '1px solid var(--gold-color)' : 'none'};
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
`;

export default ResetPasswordPage;
