import App from './app';
import dotenv from 'dotenv';
import db from './config/db.config';

dotenv.config()
const PORT: string = process.env.PORT || '3000';

const app = new App(PORT);
console.log(db)
app.listen();