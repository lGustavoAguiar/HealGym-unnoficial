import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
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
    if (!token) {
      setTokenValid(false);
      return;
    }
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
      const backendUrl = window.location.hostname === 'healgym-frontend.onrender.com' 
        ? ''
        : 'http://localhost:5000';
      
      console.log('🚀 Direct fetch to:', `${backendUrl}/api/auth/reset-password/${token}`);
      
      const response = await fetch(`${backendUrl}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha');
      }
      
      setIsSuccess(true);
    } catch (error) {
      console.error('❌ Reset password error:', error);
      const errorMessage = error.message || 'Erro ao redefinir senha. Tente novamente.';
      setErrors({ general: errorMessage });
      if (error.message && error.message.includes('Token')) {
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
      <FormSection ref={formRef}>
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.general}
                </ErrorMessage>
              )}
              <FormContainer onSubmit={handleSubmit} noValidate>
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
const Container = styled.div`
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: min(15vh, 120px) 0;
  overflow: hidden;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
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
  width: min(90vw, 500px);
  padding: min(5vh, 40px);
  background: var(--card-bg);
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  margin-top: min(12vh, 800px);
`;
const FormTitle = styled.h2`
  font-size: min(5vw, 2rem);
  color: var(--white);
  margin-bottom: min(3vh, 20px);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  letter-spacing: 0.2vw;
  cursor: default;
`;
const FormSubtitle = styled.p`
  font-size: min(2.5vw, 1.2rem);
  color: var(--text-secondary);
  margin-bottom: min(6vh, 30px);
  text-align: center;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
`;
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: min(3vh, 20px);
`;
const InputGroup = styled.div`
  width: 100%;
`;
const Input = styled.input`
  width: 100%;
  padding: min(2vh, 15px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.error ? 'var(--error, #ff6b6b)' : 'rgba(198, 169, 100, 0.2)'};
  border-radius: 2px;
  color: var(--white);
  font-size: min(2vw, 1.2rem);
  transition: all 0.3s ease;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.5px;
  animation: ${props => props.error ? 'shake 0.5s ease-in-out' : 'none'};
  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--error, #ff6b6b)' : 'var(--accent)'};
    box-shadow: 0 0 10px ${props => props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(198, 169, 100, 0.2)'};
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
    20%, 40%, 60%, 80% { transform: translateX(3px); }
  }
`;
const ErrorText = styled(motion.span)`
  color: var(--error, #ff6b6b);
  font-size: min(1.6vw, 0.875rem);
  font-family: 'Cormorant', serif;
  font-style: italic;
  margin-top: 5px;
  display: block;
  text-align: left;
  padding-left: 2px;
`;
const ErrorMessage = styled(motion.div)`
  margin-top: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: 'Cormorant', serif;
  font-size: min(1.8vw, 1rem);
  text-align: center;
  background-color: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;
const SubmitButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(2vh, 15px);
  font-size: min(2vw, 1.1rem);
  background: var(--gold-gradient);
  color: var(--background);
  border-radius: 2px;
  border: none;
  transition: all 0.4s ease;
  text-transform: uppercase;
  letter-spacing: 0.2vw;
  margin-top: min(2vh, 15px);
  width: 100%;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  &:hover {
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const BackText = styled.p`
  text-align: center;
  margin-top: min(3vh, 20px);
  color: var(--text-secondary);
  font-size: min(1.8vw, 1rem);
  cursor: default;
`;
const BackLink = styled.span`
  color: var(--accent);
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    color: var(--accent-light);
    text-decoration: underline;
  }
`;
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
  font-size: min(4vw, 1.8rem);
  font-weight: 700;
  margin-bottom: 15px;
  font-family: 'Poppins', sans-serif;
`;
const ErrorTitle = styled.h2`
  color: #ff6b6b;
  font-size: min(4vw, 1.8rem);
  font-weight: 700;
  margin-bottom: 15px;
  font-family: 'Poppins', sans-serif;
`;
const SuccessMessage = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: min(2vw, 1.1rem);
  margin-bottom: 10px;
  font-family: 'Cormorant', serif;
`;
const SuccessSubtext = styled.p`
  color: var(--text-secondary);
  font-size: min(1.6vw, 0.95rem);
  margin-bottom: 30px;
  line-height: 1.5;
  font-family: 'Cormorant', serif;
`;
const ErrorSubtext = styled.p`
  color: var(--text-secondary);
  font-size: min(1.6vw, 0.95rem);
  margin-bottom: 30px;
  line-height: 1.5;
  font-family: 'Cormorant', serif;
`;
const ActionButtons = styled.div`
  display: flex;
  gap: min(2vw, 15px);
  justify-content: center;
  flex-wrap: wrap;
  margin-top: min(2vh, 15px);
`;
const ActionButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(2vh, 12px) min(3vw, 24px);
  font-size: min(2vw, 1rem);
  background: ${props => props.variant === 'secondary' ? 'transparent' : 'var(--gold-gradient)'};
  color: ${props => props.variant === 'secondary' ? 'var(--accent)' : 'var(--background)'};
  border: ${props => props.variant === 'secondary' ? '1px solid var(--accent)' : 'none'};
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  font-weight: 600;
  box-shadow: ${props => props.variant === 'secondary' ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.3)'};
  &:hover {
    box-shadow: ${props => props.variant === 'secondary' ? '0 2px 10px rgba(198, 169, 100, 0.2)' : '0 6px 20px rgba(255, 215, 0, 0.4)'};
  }
`;
export default ResetPasswordPage;
