import { FirebaseOptions } from "firebase/app";

import dotenv from 'dotenv';
dotenv.config();

export const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.apiKey1,
    authDomain: process.env.authDomain,
    projectId: process.env.projectId,
    storageBucket: process.env.storageBucket,
    messagingSenderId: process.env.messagingSenderId,
    appId: process.env.appId,
    measurementId: process.env.measurementId,
};