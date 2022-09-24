import express from 'express';

const applicationRoutes = express.Router();
applicationRoutes.route('/').put();

export = applicationRoutes;
