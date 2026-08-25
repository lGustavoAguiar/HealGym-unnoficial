import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { login, loading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isAuthenticated, loading, navigate]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value) error = 'E-mail é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'E-mail inválido';
        break;
      case 'password':
        if (!value) error = 'Senha é obrigatória';
        else if (value.length < 6) error = 'Senha deve ter pelo menos 6 caracteres';
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
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const newError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: newError }));
  };

  const handleSubmit = async () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched({
      email: true,
      password: true
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const credentials = {
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      };

      const response = await login(credentials);
      
      setSubmitMessage('Login realizado com sucesso! Redirecionando...');
      
      setTimeout(() => {
        if (!response.user.profileSetupCompleted) {
          navigate('/profile-setup');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
      
    } catch (error) {
      setSubmitMessage(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container className="custom-scroll">
      <LogoTitle onClick={() => navigate('/')}>HealGym</LogoTitle>
      <FormSection ref={formRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <FormTitle>Entrar</FormTitle>
          <FormSubtitle>Acesse sua conta e continue sua jornada</FormSubtitle>
          
          <FormContainer>
          <InputGroup>
            <Input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email}
            />
            <AnimatePresence>
              {touched.email && errors.email && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.email}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>
          
          <InputGroup>
            <Input
              type="password"
              name="password"
              placeholder="Senha"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password}
            />
            <AnimatePresence>
              {touched.password && errors.password && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {errors.password}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>
          
          <LoginButton
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Entrando...' : 'Entrar'}
          </LoginButton>

          {submitMessage && (
            <SubmitMessage 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={submitMessage.includes('sucesso') ? 'success' : 'error'}
            >
              {submitMessage}
            </SubmitMessage>
          )}
        </FormContainer>
        
        <RegisterText>
          Não tem uma conta? <RegisterLink onClick={() => navigate('/register')}>Cadastre-se</RegisterLink>
        </RegisterText>
        
        <ForgotPasswordText>
          <ForgotPasswordLink onClick={() => navigate('/forgot-password')}>
            Esqueci minha senha
          </ForgotPasswordLink>
        </ForgotPasswordText>
        </motion.div>
      </FormSection>
    </Container>
  );
};

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

const Container = styled.div`
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: min(15vh, 120px) 0;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-mid) 50%, var(--gradient-end) 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
`;

const FormSection = styled.section`
  width: min(90vw, 500px);
  padding: min(5vh, 40px);
  background: var(--card-bg);
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  margin-top: min(10vh, 80px);
`;

const FormTitle = styled.h1`
  font-size: min(6vw, 2.5rem);
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

const ErrorMessage = styled(motion.span)`
  color: var(--error, #ff6b6b);
  font-size: min(1.6vw, 0.875rem);
  font-family: 'Cormorant', serif;
  font-style: italic;
  margin-top: 5px;
  display: block;
  text-align: left;
  padding-left: 2px;
`;

const LoginButton = styled(motion.button)`
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
`;

const RegisterText = styled.p`
  text-align: center;
  margin-top: min(3vh, 20px);
  color: var(--text-secondary);
  font-size: min(1.8vw, 1rem);
  cursor: default;
`;

const RegisterLink = styled.span`
  color: var(--accent);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent-light);
    text-decoration: underline;
  }
`;

const ForgotPasswordText = styled.p`
  text-align: center;
  margin-top: min(2vh, 15px);
  cursor: default;
`;

const ForgotPasswordLink = styled.span`
  color: var(--text-secondary);
  cursor: pointer;
  font-size: min(1.6vw, 0.9rem);
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent);
    text-decoration: underline;
  }
`;

const SubmitMessage = styled(motion.div)`
  margin-top: 15px;
  padding: 12px 16px;
  border-radius: 8px;
  font-family: 'Cormorant', serif;
  font-size: min(1.8vw, 1rem);
  text-align: center;
  
  &.success {
    background-color: rgba(76, 175, 80, 0.1);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }
  
  &.error {
    background-color: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.3);
  }
`;

export default LoginPage;
