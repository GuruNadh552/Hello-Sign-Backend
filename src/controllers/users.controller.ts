import FireBaseDB from '../config/db.config';
import { Response, Request } from 'express';
import * as _ from 'lodash';

const firebaseDb = new FireBaseDB('users');

const signIn = async (req: Request, res: Response) => {
    const data = req.body;
    if (!data || !data.email || !data.password)
        res.status(400).send({
            success: false,
            error: 'Email and Password Not found in req Body',
        });
    else {
        const users = await firebaseDb.getData();
        const currentUserData: any = _.find(users, { email: data.email });
        if (!currentUserData) {
            const docRef = await firebaseDb.insertData(data);
            res.status(200).send({
                success: true,
                message: 'Signed Up Successfully',
                id: docRef.id
            });
        } else {
            if (currentUserData.password === data.password)
                res.status(200).send({
                    success: true,
                    message: 'Logged In Successfully',
                    id: currentUserData.id
                });
            else
                res.status(400).send({
                    success: false,
                    message: 'Invalid Credentials',
                });
        }
    }
};

export { signIn };
