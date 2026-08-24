const express = require('express');
const { signup, login } = require('../controllers/auth.controller');
const { validateSignup, validateLogin } = require('../middleware/validate.middleware');

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

module.exports = router;
