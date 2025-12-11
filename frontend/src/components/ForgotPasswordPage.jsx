import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'email':
        if (!value) error = 'E-mail é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'E-mail inválido';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setTouched({ email: true });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await api.forgotPassword(formData.email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      const errorMessage = error.message || 'Erro ao enviar email de recuperação';
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Container>
      <LogoTitle onClick={() => navigate('/')}>HealGym</LogoTitle>
      <FormSection ref={formRef}>
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {!isSubmitted ? (
            <>
              <FormTitle>Recuperar Senha</FormTitle>
              <FormSubtitle>
                Digite seu e-mail e enviaremos um código para redefinir sua senha
              </FormSubtitle>
              
              {errors.general && (
                <GeneralErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {errors.general}
                </GeneralErrorMessage>
              )}
              
              <FormContainer onSubmit={handleSubmit} noValidate>
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
                
                <SendCodeButton
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.05 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Código'}
                </SendCodeButton>
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
              <SuccessIcon>✉️</SuccessIcon>
              <SuccessTitle>Código Enviado!</SuccessTitle>
              <SuccessMessage>
                Enviamos um código de recuperação para <strong>{formData.email}</strong>
              </SuccessMessage>
              <SuccessSubtext>
                Verifique sua caixa de entrada e pasta de spam. O código expira em 15 minutos.
              </SuccessSubtext>
              
              <ActionButtons>
                <BackButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                >
                  Voltar ao Login
                </BackButton>
                <ResendButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ email: '' });
                    setTouched({});
                    setErrors({});
                    setAnimationKey(prev => prev + 1);
                  }}
                >
                  Enviar Novamente
                </ResendButton>
              </ActionButtons>
            </SuccessContainer>
          )}
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
  overflow: hidden;
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
  margin-top: min(50vh, 130px);
`;

const FormTitle = styled.h1`
  font-size: min(2vw, 2rem);
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
  font-size: min(2vw, 1.2rem);
  color: var(--text-secondary);
  margin-bottom: min(6vh, 30px);
  text-align: center;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
  line-height: 1.6;
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

const GeneralErrorMessage = styled(motion.div)`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-size: min(1.8vw, 0.9rem);
  font-family: 'Cormorant', serif;
`;

const SendCodeButton = styled(motion.button)`
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: rgba(198, 169, 100, 0.5);
  }

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(2vh, 15px);
`;

const SuccessIcon = styled.div`
  font-size: min(8vw, 4rem);
  margin-bottom: min(2vh, 15px);
`;

const SuccessTitle = styled.h2`
  font-size: min(5vw, 2rem);
  color: var(--white);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.2vw;
  cursor: default;
  margin-bottom: min(2vh, 15px);
`;

const SuccessMessage = styled.p`
  font-size: min(2.2vw, 1.1rem);
  color: var(--text-secondary);
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
  line-height: 1.6;
  margin-bottom: min(1vh, 10px);

  strong {
    color: var(--accent);
  }
`;

const SuccessSubtext = styled.p`
  font-size: min(1.8vw, 0.95rem);
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Cormorant', serif;
  font-style: italic;
  cursor: default;
  line-height: 1.5;
  margin-bottom: min(4vh, 30px);
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: min(2vh, 15px);
  width: 100%;
`;

const BackButton = styled(motion.button)`
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
  width: 100%;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  }
`;

const ResendButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(2vh, 15px);
  font-size: min(2vw, 1rem);
  background: transparent;
  color: var(--accent);
  border-radius: 2px;
  border: 1px solid var(--accent);
  transition: all 0.4s ease;
  text-transform: uppercase;
  letter-spacing: 0.2vw;
  width: 100%;
  cursor: pointer;

  &:hover {
    background: rgba(198, 169, 100, 0.1);
    box-shadow: 0 4px 15px rgba(198, 169, 100, 0.2);
  }
`;

export default ForgotPasswordPage;
