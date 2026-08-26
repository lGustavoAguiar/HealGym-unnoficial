import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { calculateAge } from '../utils/healthCalculations';
import { isStrongPassword } from '../utils/authValidation';
import { validatePhysicalProfileField } from '../utils/profileValidation';
import { BODY_TYPE_OPTIONS, GENDER_OPTIONS } from '../utils/profileOptions';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    newPassword: '',
    confirmPassword: '',
    gender: '',
    height: '',
    weight: '',
    bodyType: '',
    age: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const deleteMessageRef = useRef(null);
  const submitMessageRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        newPassword: '',
        confirmPassword: '',
        gender: user.profile?.gender || '',
        height: user.profile?.height || '',
        weight: user.profile?.weight || '',
        bodyType: user.profile?.bodyType || '',
        age: (calculateAge(user.profile?.dateOfBirth) ?? '').toString(),
      });
      setIsLoadingUser(false);
    }
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);
  useEffect(() => {
    if (submitMessage && submitMessageRef.current) {
      setTimeout(() => {
        submitMessageRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 300);
    }
  }, [submitMessage]);

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
        } else if (value && !isStrongPassword(value)) {
          error =
            'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
        }
        break;
      case 'confirmPassword':
        if (value && value !== formData.newPassword) {
          error = 'Confirmação de senha não confere';
        }
        break;
      default:
        return validatePhysicalProfileField(name, value);
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const sanitizedValue = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      if (touched[name]) {
        const newError = validateField(name, sanitizedValue);
        setErrors((prev) => ({ ...prev, [name]: newError }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const newError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: newError }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: newError }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
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
      bodyType: true,
      age: true,
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
        bodyType: formData.bodyType,
        age: parseInt(formData.age),
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
      setSubmitMessage(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteMessage('');

    try {
      const response = await api.requestAccountDeletion();

      setDeleteMessage(
        response.message || 'E-mail de confirmação enviado! Verifique sua caixa de entrada.',
      );
      setShowDeleteConfirmation(false);

      if (response.devMode) {
        setDeleteMessage(response.message + ' (Modo desenvolvimento)');
      }

      // Scroll automático para mostrar a mensagem
      setTimeout(() => {
        if (deleteMessageRef.current) {
          deleteMessageRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 300);
    } catch (error) {
      setDeleteMessage(error.message || 'Erro ao solicitar exclusão. Tente novamente.');

      setTimeout(() => {
        if (deleteMessageRef.current) {
          deleteMessageRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }, 300);
    } finally {
      setIsDeleting(false);
    }
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
      <FormSection>
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
                  {GENDER_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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

            <TripleInputRow>
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

              <InputGroup>
                <Input
                  type="number"
                  name="age"
                  placeholder="Idade (anos)"
                  value={formData.age}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.age && errors.age}
                  min="13"
                  max="120"
                />
                <AnimatePresence>
                  {touched.age && errors.age && (
                    <ErrorMessage
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {errors.age}
                    </ErrorMessage>
                  )}
                </AnimatePresence>
              </InputGroup>
            </TripleInputRow>

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
                  {BODY_TYPE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
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

            <DangerZone>
              <DangerTitle>🚨 Zona de Perigo</DangerTitle>
              <DangerDescription>
                Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão perdidos.
              </DangerDescription>
              <DeleteButton
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isDeleting}
              >
                🗑️ Excluir Conta Permanentemente
              </DeleteButton>
            </DangerZone>

            <AnimatePresence>
              {submitMessage && (
                <SubmitMessage
                  ref={submitMessageRef}
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

            <AnimatePresence>
              {deleteMessage && (
                <SubmitMessage
                  ref={deleteMessageRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={
                    deleteMessage.includes('enviado') || deleteMessage.includes('sucesso')
                      ? 'success'
                      : 'error'
                  }
                >
                  {deleteMessage}
                </SubmitMessage>
              )}
            </AnimatePresence>
          </FormContainer>
        </motion.div>
      </FormSection>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirmation && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setShowDeleteConfirmation(false)}
          >
            <ModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>⚠️ Confirmar Exclusão de Conta</ModalTitle>
              </ModalHeader>

              <ModalBody>
                <WarningText>
                  <strong>Esta ação é IRREVERSÍVEL!</strong>
                </WarningText>
                <WarningText>Ao confirmar, você:</WarningText>
                <WarningList>
                  <li>🗑️ Perderá todos os seus dados permanentemente</li>
                  <li>🗑️ Não poderá recuperar sua conta</li>
                  <li>🗑️ Precisará criar uma nova conta para usar o HealGym novamente</li>
                  <li>📧 Receberá um email de confirmação final</li>
                </WarningList>
                <ConfirmText>Tem certeza absoluta que deseja excluir sua conta?</ConfirmText>
              </ModalBody>

              <ModalFooter>
                <ModalCancelButton
                  onClick={() => setShowDeleteConfirmation(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancelar
                </ModalCancelButton>
                <ModalDeleteButton
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDeleting ? 'Enviando...' : '🗑️ Sim, Excluir Minha Conta'}
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
  height: auto;
  min-height: 100vh;
  margin: 0;
  padding: min(2vh, 20px) 0;
  overflow-y: auto;
  background: linear-gradient(
    135deg,
    var(--gradient-start) 0%,
    var(--gradient-mid) 50%,
    var(--gradient-end) 100%
  );
  display: flex;
  align-items: flex-start;
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
  width: min(90vw, 700px);
  max-width: 700px;
  padding: min(2vh, 20px);
  background: var(--card-bg);
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(198, 169, 100, 0.1);
  backdrop-filter: blur(10px);
  margin: min(8vh, 60px) auto min(2vh, 20px) auto;
  position: relative;

  @media (max-height: 800px) {
    margin: min(4vh, 30px) auto min(2vh, 20px) auto;
    padding: min(1.5vh, 15px);
  }

  @media (max-height: 600px) {
    margin: min(2vh, 15px) auto;
    padding: min(1vh, 10px);
  }
`;

const FormTitle = styled.h1`
  font-size: min(4vw, 1.8rem);
  color: var(--white);
  margin-bottom: min(1vh, 8px);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  letter-spacing: 0.2vw;
  cursor: default;

  @media (max-height: 600px) {
    font-size: min(4vw, 1.5rem);
    margin-bottom: min(0.5vh, 5px);
  }
`;

const FormSubtitle = styled.p`
  font-size: min(2vw, 1rem);
  color: var(--text-secondary);
  margin-bottom: min(2vh, 15px);
  text-align: center;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.1vw;
  cursor: default;
  line-height: 1.3;

  div {
    margin-bottom: 0.2rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  @media (max-height: 600px) {
    font-size: min(2vw, 0.9rem);
    margin-bottom: min(1vh, 10px);
  }
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: min(1.5vh, 12px);

  @media (max-height: 600px) {
    gap: min(1vh, 8px);
  }
`;

const InputGroup = styled.div`
  width: 100%;
`;

const TripleInputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: min(1.5vw, 12px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
    gap: min(2vw, 15px);

    & > div:last-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: min(1.5vh, 12px);

    & > div:last-child {
      grid-column: auto;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: min(1.5vh, 12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid
    ${(props) => (props.error ? 'var(--error, #ff6b6b)' : 'rgba(198, 169, 100, 0.2)')};
  border-radius: 2px;
  color: var(--white);
  font-size: min(1.8vw, 1.1rem);
  transition: all 0.3s ease;
  font-family: 'Cormorant', serif;
  letter-spacing: 0.5px;
  animation: ${(props) => (props.error ? 'shake 0.5s ease-in-out' : 'none')};

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? 'var(--error, #ff6b6b)' : 'var(--accent)')};
    box-shadow: 0 0 10px
      ${(props) => (props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(198, 169, 100, 0.2)')};
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-3px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(3px);
    }
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
  border: 1px solid
    ${(props) => (props.error ? 'var(--error, #ff6b6b)' : 'rgba(198, 169, 100, 0.2)')};
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
    border-color: ${(props) => (props.error ? 'var(--error, #ff6b6b)' : 'var(--accent)')};
    box-shadow: 0 0 10px
      ${(props) => (props.error ? 'rgba(255, 107, 107, 0.2)' : 'rgba(198, 169, 100, 0.2)')};
  }

  option {
    background: var(--secondary);
    color: var(--white);
    padding: 10px;
  }

  option[value=''] {
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
  gap: min(1vh, 10px);
  margin-top: min(1.5vh, 12px);

  @media (max-height: 600px) {
    gap: min(0.8vh, 8px);
    margin-top: min(1vh, 8px);
  }
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

const DangerZone = styled.div`
  margin-top: min(2vh, 20px);
  padding: min(1.5vh, 15px);
  border: 2px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.05);
  text-align: center;

  @media (max-height: 600px) {
    margin-top: min(1.5vh, 15px);
    padding: min(1vh, 10px);
  }
`;

const DangerTitle = styled.h3`
  color: #dc2626;
  font-size: min(2vw, 1.2rem);
  font-weight: 700;
  margin-bottom: min(1vh, 10px);
  font-family: 'Poppins', sans-serif;
`;

const DangerDescription = styled.p`
  color: rgb(218, 34, 34);
  font-size: min(1.6vw, 0.9rem);
  margin-bottom: min(2vh, 15px);
  font-family: 'Cormorant', serif;
  font-style: italic;
`;

const DeleteButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: min(1.2vh, 10px) min(2vw, 20px);
  font-size: min(1.6vw, 0.9rem);
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  color: white;
  border: none;
  border-radius: 5px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1vw;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(220, 38, 38, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
`;

const ModalHeader = styled.div`
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid rgba(220, 38, 38, 0.2);
`;

const ModalTitle = styled.h2`
  color: var(--white);
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const WarningText = styled.p`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  text-align: center;
  font-family: 'Cormorant', serif;
`;

const WarningList = styled.ul`
  color: var(--text-secondary);
  font-size: 1rem;
  margin: 20px 0;
  padding-left: 20px;

  li {
    margin-bottom: 8px;
    line-height: 1.4;
  }
`;

const ConfirmText = styled.p`
  color: var(--white);
  font-size: 1.1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 20px;
  font-family: 'Cormorant', serif;
`;

const ModalFooter = styled.div`
  padding: 16px 24px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid rgba(220, 38, 38, 0.3);
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 12px 12px;
`;

const ModalCancelButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: 10px 20px;
  font-size: 0.9rem;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid rgba(198, 169, 100, 0.3);
  border-radius: 5px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: rgba(198, 169, 100, 0.1);
  }
`;

const ModalDeleteButton = styled(motion.button)`
  font-family: 'Poppins', sans-serif;
  padding: 10px 20px;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%);
  color: white;
  border: none;
  border-radius: 5px;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

export default EditProfilePage;
