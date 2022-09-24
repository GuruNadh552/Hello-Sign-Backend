import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes/routes';
import dotenv from 'dotenv';
import multer from 'multer';
const upload = multer().array('');
class App {
    public express: Application;
    public port: string;

    constructor(port: string) {
        this.express = express();
        this.port = port;
        this.intializeMiddleware();
    }
    intializeMiddleware() {
        this.express.use(upload);
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(cors());
        this.express.use('/applications', express.static('./applications'));
        this.express.use(routes);
        dotenv.config();
    }

    public listen() {
        this.express.listen(this.port, () => {
            console.log(`Hey! I am listening on 4200`);
        });
    }
}

export default App;
