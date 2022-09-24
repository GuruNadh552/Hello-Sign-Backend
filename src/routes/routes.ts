import express from 'express';
import applicationRoutes from './application.routes';
import authRoutes from './auth.routes';
import helloSignRoutes from './hello-sign.routes';
import helloWorksRoutes from './helloworks.routes';

const routes = express.Router();

routes.use('/login',authRoutes);
routes.use('/hellowork', helloWorksRoutes);
routes.use('/hellosign', helloSignRoutes);
routes.use('/programs', applicationRoutes);

export = routes;