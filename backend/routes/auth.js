const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate Limiter: 5 intentos cada 15 minutos
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Demasiados intentos, intenta de nuevo en 15 minutos.' }
});

// Validaciones
const registerValidation = [
    body('name').trim().notEmpty().withMessage('El nombre es requerido').escape(),
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
        .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
        .matches(/[A-Z]/).withMessage('Debe tener una mayúscula')
        .matches(/[a-z]/).withMessage('Debe tener una minúscula')
        .matches(/[0-9]/).withMessage('Debe tener un número')
        .matches(/[\W]/).withMessage('Debe tener un símbolo')
];

const loginValidation = [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Password requerido')
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

module.exports = router;

