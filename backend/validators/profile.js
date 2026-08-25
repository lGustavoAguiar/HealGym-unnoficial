import { body } from 'express-validator';

const optionally = (validation, optional) => (
  optional ? validation.optional() : validation
);

export const createProfileValidationRules = ({ optional = false } = {}) => [
  optionally(body('gender'), optional)
    .isIn(['masculino', 'feminino'])
    .withMessage(optional ? 'Gênero deve ser masculino ou feminino' : 'Gênero inválido'),
  optionally(body('height'), optional)
    .isFloat({ min: 100, max: 250 })
    .withMessage('Altura deve estar entre 100 e 250 cm'),
  optionally(body('weight'), optional)
    .isFloat({ min: 30, max: 300 })
    .withMessage('Peso deve estar entre 30 e 300 kg'),
  optionally(body('bodyType'), optional)
    .isIn(['ectomorfo', 'mesomorfo', 'endomorfo'])
    .withMessage(optional ? 'Biotipo deve ser ectomorfo, mesomorfo ou endomorfo' : 'Biotipo inválido'),
  optionally(body('age'), optional)
    .isInt({ min: 13, max: 120 })
    .withMessage('Idade deve estar entre 13 e 120 anos'),
];
