import FireBaseDB from '../config/db.config';
import { Response, Request } from 'express';
import { Application } from '../models/application.model';

const firebaseDb = new FireBaseDB('documents');

const createApplication = async (req: Request, res: Response) => {
    const data: Application = req.body;
    console.log(data);
    if (!data || !data.email || !data.name) {
        res.status(400).send({
            success: false,
            message: 'Email or Name not found',
        });
    }
    const respData = await firebaseDb.insertData(data);
    res.status(200).send({ success: true, data: { id: respData.id, ...data } });
};

export { createApplication };
