import { signIn } from '../controllers/users.controller';
import express from 'express';

const authRoutes = express.Router();

authRoutes.post('/', signIn);

export = authRoutes;