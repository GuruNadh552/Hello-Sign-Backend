import { Request, Response } from 'express';
import dotenv from 'dotenv';
import FireBaseDB from '../config/db.config';
import { STATUS_CODES } from '../models/status-codes';
import * as HelloSignSDK from 'hellosign-sdk';
import * as _ from 'lodash';
const request = require('request');
const fs = require('fs');

dotenv.config();
const helloSign = new HelloSignSDK.SignatureRequestApi();
helloSign.username =
    process.env.apiKey || '';

const firebaseDB = new FireBaseDB('workflowinstances');
const accountData = async (req: Request, res: Response) => {
    var data;
    if (data) res.status(200).send({ success: true, data: data });
    else
        res.status(400).send({ success: false, error: 'Something went wrong' });
};

const postCallBack = async (req: Request, res: Response) => {
    try {
        const resp_data = JSON.parse(req.body.json);
        const { event, signature_request } = resp_data;
        console.log(2, event);
        console.log(3, signature_request);
        const { response_data, metadata, signature_request_id } =
            signature_request;
        if (event.event_type == 'signature_request_downloadable') {
            console.log(7, signature_request_id);
            const result = await helloSign.signatureRequestFiles(
                signature_request_id,
                'pdf',
                true,
                false
            );
            const destin = `/applications/${Date.now()}.pdf`;
            const fileURL = await downlodPdf(result.body.fileUrl,destin);
            if (response_data.length == 2) {
                await firebaseDB.updateData(metadata._id, {
                    status: STATUS_CODES[2],
                    statusCode: 2,
                    file1: fileURL,
                });
            }
            if (response_data.length == 4) {
                const amount_field = _.find(response_data, {
                    api_id: 'approved_amount',
                });
                console.log("Amount",amount_field);
                await firebaseDB.updateData(metadata._id, {
                    status: STATUS_CODES[3],
                    statusCode: 3,
                    stageCode: 2,
                    file1: fileURL,
                    approvedAmount: amount_field.value,
                });
            }
        }
        if (event.event_type == 'signature_request_declined') {
            if (!response_data.length) {
                await firebaseDB.updateData(metadata._id, {
                    status: STATUS_CODES[4],
                    statusCode: 4,
                    stageCode : 1,
                    remarks : event?.event_metadata?.event_message || "We can't serve you right now. Thank you for applying."
                });
            }
            if (response_data.length == 2) {
                await firebaseDB.updateData(metadata._id, {
                    status: STATUS_CODES[5],
                    statusCode: 5,
                    stageCode: 1,
                    remarks:
                        event?.event_metadata?.event_message ||
                        "We can't serve you right now. Thank you for applying.",
                });
            }
        }
        res.send('Hello API Event Received');
    } catch (err) {
        res.send('Something went wrong');
    }
};


const testFile = async(req:Request,res:Response) => {
    const sampleURL = 'https://www.africau.edu/images/default/sample.pdf';
    const dest = `/applications/${Date.now()}.pdf`;
    const result = await downlodPdf(sampleURL,dest);
    res.send(result);

}

const downlodPdf = async (uri:any,filename:string) => {
    return new Promise((resolve,reject)=>{
        request.head(uri, function (err: any, res: any, body: any) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri)
                .pipe(fs.createWriteStream('.'+filename));
            resolve(`${process.env.HOST}${filename}`);
        });
    })
}

export { accountData, postCallBack, testFile };
