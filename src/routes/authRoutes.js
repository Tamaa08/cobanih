import { Router } from 'express';
import { showLogin, login, logout } from '../controllers/authController.js';
import { showRegister, register } from '../controllers/authRegisterController.js';

const router = Router();

router.get('/login', showLogin);
router.post('/login', login);
router.get('/register', showRegister);
router.post('/register', register);
router.post('/logout', logout);

export default router;
