import {
    accountData,
    postCallBack,
    testFile,
} from '../controllers/hello-sign.controller';
import express from 'express';

const helloSignRoutes = express.Router();

helloSignRoutes.get('/', accountData);
helloSignRoutes.get('/test', testFile);
helloSignRoutes.post('/callback', postCallBack);

export = helloSignRoutes;
