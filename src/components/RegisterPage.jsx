import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  // Efeito para rolar para o topo quando a página é carregada
  useEffect(() => {
    // Função para garantir o scroll para o topo
    const scrollToTop = () => {
      // Força o scroll para o topo de várias maneiras para garantir que funcione
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };

    // Executa imediatamente
    scrollToTop();

    // Adiciona um listener para o evento load
    window.addEventListener('load', scrollToTop);

    // Executa depois de um pequeno delay para garantir
    const timeoutId = setTimeout(scrollToTop, 50);

    // Cleanup
    return () => {
      window.removeEventListener('load', scrollToTop);
      clearTimeout(timeoutId);
    };
  }, []); // Array vazio significa que só executa uma vez quando o componente monta

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Nome é obrigatório';
        else if (value.trim().length < 3) error = 'Nome deve ter pelo menos 3 caracteres';
        else if (/\d/.test(value)) error = 'O nome não deve conter números';
        else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/.test(value)) error = 'O nome deve conter apenas letras';
        break;
      case 'email':
        if (!value) error = 'E-mail é obrigatório';
        else if (!/\S+@\S+\.\S+/.test(value)) error = 'E-mail inválido';
        break;
      case 'password':
        if (!value) error = 'Senha é obrigatória';
        else if (value.length < 6) error = 'Senha deve ter pelo menos 6 caracteres';
        break;
      case 'confirmPassword':
        if (!value) error = 'Confirmação de senha é obrigatória';
        else if (value !== formData.password) error = 'Senhas não coincidem';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Se for o campo nome, remove números e caracteres especiais
    if (name === 'name') {
      const sanitizedValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
      if (touched[name]) {
        setErrors(prev => ({ ...prev, [name]: validateField(name, sanitizedValue) }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors && formRef.current) {
      const yOffset = -50; // ajuste fino para posição vertical
      const formElement = formRef.current;
      const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      const smoothScroll = () => {
        const startPosition = window.pageYOffset;
        const distance = y - startPosition;
        const duration = 1200; // 1.2 segundos
        let start = null;

        const easeOutQuart = t => 1 - (--t) * t * t * t; // função de easing mais suave no final

        const step = currentTime => {
          if (!start) start = currentTime;
          const progress = Math.min((currentTime - start) / duration, 1);
          
          if (progress === 1) {
            window.scrollTo(0, y);
            return;
          }

          const currentPosition = startPosition + (distance * easeOutQuart(progress));
          window.scrollTo(0, currentPosition);
          window.requestAnimationFrame(step);
        };

        window.requestAnimationFrame(step);
      };

      smoothScroll();
    }
  }, [errors]);
  
  return (
    <Container>
      <LogoTitle onClick={() => navigate('/')}>HealGym</LogoTitle>
      <FormSection ref={formRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <FormTitle>Criar Conta</FormTitle>
          <FormSubtitle>Comece sua jornada fitness hoje</FormSubtitle>
          
          <FormContainer>
            <InputGroup>
              <Input
                type="text"
                name="name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                onPaste={(e) => {
                  e.preventDefault();
                  const text = e.clipboardData.getData('text');
                  const sanitized = text.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
                  document.execCommand('insertText', false, sanitized);
                }}
                error={touched.name && errors.name}
              />
              <AnimatePresence>
                {touched.name && errors.name && (
                  <ErrorMessage
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.name}
                  </ErrorMessage>
                )}
              </AnimatePresence>
            </InputGroup>
            
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
            
            <InputGroup>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.confirmPassword && errors.confirmPassword}
              />
              <AnimatePresence>
                {touched.confirmPassword && errors.confirmPassword && (
                  <ErrorMessage
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.confirmPassword}
                  </ErrorMessage>
                )}
              </AnimatePresence>
            </InputGroup>
            
            <RegisterButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                const newErrors = {};
                Object.keys(formData).forEach(key => {
                  const error = validateField(key, formData[key]);
                  if (error) newErrors[key] = error;
                });

                setTouched({
                  name: true,
                  email: true,
                  password: true,
                  confirmPassword: true
                });

                if (Object.keys(newErrors).length > 0) {
                  setErrors(newErrors);
                  if (formRef.current) {
                    const yOffset = -50; // ajuste fino para posição vertical
                    const formElement = formRef.current;
                    const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    
                    const smoothScroll = () => {
                      const startPosition = window.pageYOffset;
                      const distance = y - startPosition;
                      const duration = 1200; // 1.2 segundos
                      let start = null;

                      const easeOutQuart = t => 1 - (--t) * t * t * t; // função de easing mais suave no final

                      const step = currentTime => {
                        if (!start) start = currentTime;
                        const progress = Math.min((currentTime - start) / duration, 1);
                        
                        if (progress === 1) {
                          window.scrollTo(0, y);
                          return;
                        }

                        const currentPosition = startPosition + (distance * easeOutQuart(progress));
                        window.scrollTo(0, currentPosition);
                        window.requestAnimationFrame(step);
                      };

                      window.requestAnimationFrame(step);
                    };

                    smoothScroll();
                  }
                } else {
                  // Aqui você pode adicionar a lógica de cadastro
                  console.log('Formulário válido:', formData);
                }
              }}
            >
              Cadastrar
            </RegisterButton>
          </FormContainer>
          
          <LoginText>
            Já tem uma conta? <LoginLink>Entrar</LoginLink>
          </LoginText>
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
  position: absolute;
  top: min(10vh, 70px);
  left: 50%;
  transform: translateX(-50%);
  letter-spacing: 0.3vw;
  cursor: pointer;
  transition: transform 0.3s ease;
  z-index: 2;

  &:hover {
    transform: translateX(-50%) scale(1.05);
  }
`;

const Container = styled.div`
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: min(15vh, 120px) 0;
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

  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--error, #ff6b6b)' : 'var(--accent)'};
    box-shadow: 0 0 10px ${props => props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(198, 169, 100, 0.2)'};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
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

const RegisterButton = styled(motion.button)`
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

const LoginText = styled.p`
  text-align: center;
  margin-top: min(3vh, 20px);
  color: var(--text-secondary);
  font-size: min(1.8vw, 1rem);
  cursor: default;
`;

const LoginLink = styled.span`
  color: var(--accent);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent-light);
    text-decoration: underline;
  }
`;

export default RegisterPage;
