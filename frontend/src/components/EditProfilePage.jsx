import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { user, updateUser, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    newPassword: '',
    confirmPassword: '',
    gender: '',
    height: '',
    weight: '',
    bodyType: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    console.log('🔍 EditProfile useEffect - User:', user);
    console.log('🔍 EditProfile useEffect - User profile:', user?.profile);
    if (user) {
      console.log('🔍 Preenchendo dados do formulário...');
      setFormData({
        name: user.name || '',
        newPassword: '',
        confirmPassword: '',
        gender: user.profile?.gender || '',
        height: user.profile?.height || '',
        weight: user.profile?.weight || '',
        bodyType: user.profile?.bodyType || ''
      });
      setIsLoadingUser(false);
    } else {
      console.log('⚠️ User não disponível ainda');
    }
  }, [user]);

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
      case 'name':
        if (!value.trim()) error = 'Nome é obrigatório';
        else if (value.trim().length < 2) error = 'Nome deve ter pelo menos 2 caracteres';
        else if (/\d/.test(value)) error = 'O nome não deve conter números';
        else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/.test(value)) error = 'O nome deve conter apenas letras';
        break;
      case 'newPassword':
        if (value && value.length < 6) {
          error = 'Nova senha deve ter pelo menos 6 caracteres';
        } else if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.newPassword) {
          error = 'Confirmação de senha não confere';
        }
        break;
      case 'gender':
        if (!value) error = 'Gênero é obrigatório';
        break;
      case 'height':
        if (!value) error = 'Altura é obrigatória';
        else if (isNaN(value) || value < 100 || value > 250) error = 'Altura deve estar entre 100 e 250 cm';
        break;
      case 'weight':
        if (!value) error = 'Peso é obrigatório';
        else if (isNaN(value) || value < 30 || value > 300) error = 'Peso deve estar entre 30 e 300 kg';
        break;
      case 'bodyType':
        if (!value) error = 'Biotipo é obrigatório';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      const sanitizedValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
      if (touched[name]) {
        const newError = validateField(name, sanitizedValue);
        setErrors(prev => ({ ...prev, [name]: newError }));
      }
      return;
    }
    
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

    setTouched({
      name: true,
      newPassword: true,
      confirmPassword: true,
      gender: true,
      height: true,
      weight: true,
      bodyType: true
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const profileData = {
        name: formData.name.trim(),
        gender: formData.gender,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        bodyType: formData.bodyType
      };

      if (formData.newPassword) {
        profileData.newPassword = formData.newPassword;
      }

      const response = await api.updateProfile(profileData);
      
      updateUser(response.user);
      
      setSubmitMessage('Perfil atualizado com sucesso! Redirecionando...');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setSubmitMessage(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoClick = () => {
  };

  if (isLoadingUser) {
    return (
      <Container className="custom-scroll">
        <LogoTitle>HealGym</LogoTitle>
        <FormSection>
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--white)' }}>
            Carregando dados do perfil...
          </div>
        </FormSection>
      </Container>
    );
  }

  return (
    <Container className="custom-scroll">
      <LogoTitle>HealGym</LogoTitle>
      <FormSection ref={formRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <FormTitle>Editar Perfil</FormTitle>
          <FormSubtitle>
            <div>Atualize suas informações pessoais</div>
            <div>Mantenha seu perfil sempre atualizado</div>
          </FormSubtitle>
          
          <FormContainer onSubmit={handleSubmit} noValidate>
            <InputGroup>
              <Input
                type="text"
                name="name"
                placeholder="Nome completo"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
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
                type="password"
                name="newPassword"
                placeholder="Nova senha (deixe em branco para não alterar)"
                value={formData.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.newPassword && errors.newPassword}
              />
              <AnimatePresence>
                {touched.newPassword && errors.newPassword && (
                  <ErrorMessage
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.newPassword}
                  </ErrorMessage>
                )}
              </AnimatePresence>
            </InputGroup>

            <InputGroup>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Confirme a nova senha"
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

            <InputGroup>
              <SelectWrapper>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.gender && errors.gender}
                >
                  <option value="">Selecione seu gênero</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </Select>
              </SelectWrapper>
              <AnimatePresence>
                {touched.gender && errors.gender && (
                  <ErrorMessage
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.gender}
                  </ErrorMessage>
                )}
              </AnimatePresence>
            </InputGroup>

            <InputRow>
              <InputGroup>
                <Input
                  type="number"
                  name="height"
                  placeholder="Altura (cm)"
                  value={formData.height}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.height && errors.height}
                  min="100"
                  max="250"
                />
                <AnimatePresence>
                  {touched.height && errors.height && (
                    <ErrorMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.height}
                    </ErrorMessage>
                  )}
                </AnimatePresence>
              </InputGroup>

              <InputGroup>
                <Input
                  type="number"
                  name="weight"
                  placeholder="Peso (kg)"
                  value={formData.weight}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.weight && errors.weight}
                  min="30"
                  max="300"
                  step="0.1"
                />
                <AnimatePresence>
                  {touched.weight && errors.weight && (
                    <ErrorMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.weight}
                    </ErrorMessage>
                  )}
                </AnimatePresence>
              </InputGroup>
            </InputRow>

            <InputGroup>
              <SelectWrapper>
                <Select
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.bodyType && errors.bodyType}
                >
                  <option value="">Selecione seu biotipo</option>
                  <option value="ectomorfo">Ectomorfo (Magro, dificuldade para ganhar peso)</option>
                  <option value="mesomorfo">Mesomorfo (Atlético, ganha músculo facilmente)</option>
                  <option value="endomorfo">Endomorfo (Tendência a acumular gordura)</option>
                </Select>
              </SelectWrapper>
              <AnimatePresence>
                {touched.bodyType && errors.bodyType && (
                  <ErrorMessage
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errors.bodyType}
                  </ErrorMessage>
                )}
              </AnimatePresence>
            </InputGroup>

            <ButtonGroup>
              <SubmitButton
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
              </SubmitButton>
              
              <CancelButton
                type="button"
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancelar
              </CancelButton>
            </ButtonGroup>

            <AnimatePresence>
              {submitMessage && (
                <SubmitMessage
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={submitMessage.includes('sucesso') ? 'success' : 'error'}
                >
                  {submitMessage}
                </SubmitMessage>
              )}
            </AnimatePresence>
          </FormContainer>
        </motion.div>
      </FormSection>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 110vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
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

const FormSection = styled.section`
  width: min(95vw, 800px);
  max-height: none;
  padding: min(3vh, 25px);
  background: var(--card-bg);
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
`;

const FormTitle = styled.h1`
  font-size: min(5vw, 2.2rem);
  color: var(--white);
  margin-bottom: min(1.5vh, 12px);
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
  font-size: min(2.2vw, 1.1rem);
  color: var(--text-secondary);
  margin-bottom: min(4vh, 20px);
  text-align: center;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
  line-height: 1.4;
  
  div {
    margin-bottom: 0.3rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: min(2vh, 15px);
`;

const InputGroup = styled.div`
  width: 100%;
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: min(2vw, 15px);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: min(2vh, 15px);
  }
`;

const Input = styled.input`
  width: 100%;
  padding: min(1.5vh, 12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.error ? 'var(--error, #ff6b6b)' : 'rgba(198, 169, 100, 0.2)'};
  border-radius: 2px;
  color: var(--white);
  font-size: min(1.8vw, 1.1rem);
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

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Select = styled.select`
  width: 100%;
  padding: min(1.5vh, 12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid ${props => props.error ? 'var(--error, #ff6b6b)' : 'rgba(198, 169, 100, 0.2)'};
  border-radius: 2px;
  color: var(--white);
  font-size: min(1.8vw, 1.1rem);
  transition: all 0.3s ease;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.5px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='rgba(198, 169, 100, 0.7)' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? 'var(--error, #ff6b6b)' : 'var(--accent)'};
    box-shadow: 0 0 10px ${props => props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(198, 169, 100, 0.2)'};
  }

  option {
    background: var(--secondary);
    color: var(--white);
    padding: 10px;
  }

  option[value=""] {
    color: rgba(255, 255, 255, 0.5);
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

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: min(1.5vh, 12px);
  margin-top: min(2vh, 15px);
`;

const SubmitButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(1.5vh, 12px);
  font-size: min(1.8vw, 1rem);
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

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(1.2vh, 10px);
  font-size: min(1.6vw, 0.9rem);
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(198, 169, 100, 0.3);
  border-radius: 2px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  width: 100%;
  cursor: pointer;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: rgba(198, 169, 100, 0.1);
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

export default EditProfilePage;
