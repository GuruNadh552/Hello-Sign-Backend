import axios from 'axios';
import qs from 'qs';
import fs from 'fs';
import * as _ from 'lodash';
import dotenv from 'dotenv';
import request from 'request';
import unzipper from 'unzipper';
import { Request, response, Response } from 'express';
import FireBaseDB from '../config/db.config';
import { STAGE_CODES, STATUS_CODES } from '../models/status-codes';

import * as HelloSignSDK from 'hellosign-sdk';

dotenv.config();
const helloSign = new HelloSignSDK.SignatureRequestApi();
helloSign.username = process.env.apiKey || '';

const api = process.env.api;
const apiId = process.env.apiId;
const apiKey = process.env.apiKey2;

let token: string;
let expiry: any;

const firebaseDB = new FireBaseDB('workflowinstances');

const generateToken = async () => {
    const url = api + '/token/' + apiId;
    try {
        if (isTokenValid()) {
            return;
        }
        const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        const data = res.data.data;
        token = data.token;
        expiry = data.expires_at;
        console.log('Hello Works Token Generated.');
    } catch (err: any) {
        console.log(err.message);
    }
};

const isTokenValid = () => {
    const currentTime = Date.now();
    return (
        token != null &&
        token != undefined &&
        expiry != null &&
        expiry != undefined &&
        expiry - currentTime > 5
    );
};

const createWorkflowInstance = async (req: Request, res: Response) => {
    const url = `${api}/workflow_instances`;
    const data: any = req.body;
    const { email, name } = data;
    if (!email || !name) {
        res.status(400).send('Email and Name are required.');
        return;
    }
    const firebaseData: any = await firebaseDB.insertData(data);
    await generateToken();
    const payload = qs.stringify({
        workflow_id: 'ZlakG9P2br3WmJOD',
        'participants[participant_gZJ6v2][type]': 'email',
        'participants[participant_gZJ6v2][value]': email,
        'participants[participant_gZJ6v2][full_name]': name,
        callback_url:
            'https://hello-sign-production.up.railway.app/hellowork/callback',
        metadata: {
            email: email,
            name: name,
            _id: firebaseData.id,
        },
    });
    const config = {
        method: 'post',
        url: url,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: payload,
    };
    try {
        const response = await axios(config);
        const data = response.data.data;
        data.status = STATUS_CODES[0];
        data.statusCode = 0;
        data.stageCode = 0;
        data.stageName = STAGE_CODES[0];
        data.createdOn = new Date();
        await firebaseDB.updateData(firebaseData.id, data);
        res.json(data);
    } catch (err) {
        res.status(400).send(err);
    }
};

const getWorkflowInstanceById = async (req: Request, res: Response) => {
    const workflowId = req.params.id;
    if (!workflowId)
        res.status(400).send({
            success: false,
            message: 'Workflow ID is Required',
        });
    else {
        const url = api + '/workflow_instances/' + workflowId;
        await generateToken();
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data.data;
            res.json(data);
        } catch (err: any) {
            res.status(400).send(err.message);
        }
    }
};

const getDocumentLinkById = async (req: Request, res: Response) => {
    const workflowInstanceId = req.params.id;
    const fileFormat = req.params.format;
    if (!workflowInstanceId && !fileFormat)
        res.status(400).send({
            success: false,
            message: 'Workflow ID and File Format is Required',
        });
    else {
        const resp = await getDocumentUri(workflowInstanceId, fileFormat);
        res.send({ data: resp });
    }
};

const getDocumentUri = async (workflowInstanceId: any, fileFormat: any) => {
    const url =
        api + '/workflow_instances/' + workflowInstanceId + '/document_link';
    await generateToken();
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.data;
        if (fileFormat === 'zip') {
            return data;
        } else {
            const result = await unzipFiles(data);
            return result;
        }
    } catch (err: any) {
        return 'Something Went Wrong';
    }
};

const unzipFiles = async (data: any) => {
    const output = './files.zip';
    return new Promise((resolve, reject) => {
        request({ url: data, encoding: null }, (err, resp, body) => {
            if (err) throw err;
            fs.writeFile(output, body, function (err) {
                fs.createReadStream(output)
                    .pipe(unzipper.Parse())
                    .on('entry', function (entry) {
                        if (entry.path !== 'audit_trail.pdf') {
                            const fileName =
                                Date.now() +
                                '-' +
                                entry.path.split(' ').join('-');
                            entry.pipe(
                                fs.createWriteStream(
                                    './applications/' + fileName
                                )
                            );
                            resolve(
                                `${process.env.HOST}/applications/${fileName}`
                            );
                        } else {
                            entry.autodrain();
                        }
                    });
            });
        });
    });
};

const getDocumentViewById = async (req: Request, res: Response) => {
    const workflowInstanceId = req.params.id;
    if (!workflowInstanceId)
        res.status(400).send({
            success: false,
            message: 'Workflow ID is Required',
        });
    else {
        const url = api + '/workflow_instances/' + workflowInstanceId;
        await generateToken();
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data.data;
            if (data) {
                const docIds = Object.keys(data.document_hashes);
                if (docIds.length) {
                    const url2 =
                        api +
                        '/workflow_instances/' +
                        workflowInstanceId +
                        '/documents/' +
                        docIds[0];
                    await generateToken();
                    res.status(200).send({
                        data: {
                            url: url2,
                            token: token,
                        },
                    });
                } else {
                    res.status(400).send('DocID not found');
                }
            }
        } catch (err: any) {
            res.status(err?.response?.status || 500).json(
                err?.response?.data || { data: 'Something went wrong' }
            );
        }
    }
};

const getApplications = async (req: Request, res: Response) => {
    try {
        const data = await firebaseDB.getData();
        res.json(data);
    } catch (err) {
        res.status(400).send(err);
    }
};

const getApplicationTypes = async (req: Request, res: Response) => {
    const url = api + '/workflows';
    await generateToken();
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.data;
        res.json(data);
    } catch (err: any) {
        res.status(400).send(err.message);
    }
};

const getApplicationSummary = async (req: Request, res: Response) => {
    const url = api + '/workflows/summary';
    await generateToken();
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data.data;
        res.json(data);
    } catch (err: any) {
        res.status(400).send(err.message);
    }
};

const postCallBackData = async (req: Request, res: Response) => {
    try {
        const { status, data, type, metadata, id } = req.body;
        if (type == 'workflow_stopped' && status === 'completed' && data) {
            const form_oHqD1l = data.form_oHqD1l;
            const medicoName = form_oHqD1l.field_MQFbC4;
            const medicoMail = form_oHqD1l.field_jytJbr;
            const requestedAmount = form_oHqD1l.field_nC30Tg;
            const file1 = await getDocumentUri(id, 'pdf');
            if (medicoName && medicoMail) {
                await firebaseDB.updateData(metadata._id, {
                    status: STATUS_CODES[1],
                    statusCode: 1,
                    file1: file1,
                    requestedAmount: requestedAmount,
                });
                const response = await triggerSignatureRequest(
                    medicoName,
                    medicoMail,
                    metadata,
                    file1
                );
                res.json(response.body);
                return;
            }
        }

        res.send('Ok');
    } catch (err) {
        res.status(400).send('Something went wrong');
    }
};

const triggerSignatureRequest = async (
    name: any,
    email: any,
    metadata: any,
    fileUrl: any
) => {
    const signer1: HelloSignSDK.SubSignatureRequestSigner = {
        emailAddress: email,
        name: name,
        order: 0,
    };

    const signer2: HelloSignSDK.SubSignatureRequestSigner = {
        emailAddress: 'vamsikrishnakdml@gmail.com',
        name: 'President',
        order: 1,
    };

    const signingOptions: HelloSignSDK.SubSigningOptions = {
        draw: true,
        type: true,
        upload: true,
        phone: false,
        defaultType: HelloSignSDK.SubSigningOptions.DefaultTypeEnum.Draw,
    };

    const data: HelloSignSDK.SignatureRequestSendRequest = {
        title: 'Good Hands',
        subject: 'Medical Aid Finance Request',
        message: 'Please verify medical aid request and approve.',
        signers: [signer1, signer2],
        fileUrl: [fileUrl],
        signingOptions,
        testMode: true,
        allowDecline: true,
        formFieldsPerDocument: [
            {
                documentIndex: 0,
                apiId: 'medico_sign',
                type: 'signature',
                x: 390,
                y: 235,
                width: 120,
                height: 30,
                required: true,
                signer: '0',
                page: 3,
            },
            {
                documentIndex: 0,
                apiId: 'medico_sign_date',
                type: 'date_signed',
                x: 100,
                y: 260,
                width: 120,
                height: 30,
                required: true,
                signer: '0',
                page: 3,
            },
            {
                documentIndex: 0,
                apiId: 'ngo_sign',
                type: 'signature',
                x: 430,
                y: 530,
                width: 120,
                height: 30,
                required: true,
                signer: '1',
                page: 4,
            },
            {
                documentIndex: 0,
                apiId: 'approved_amount',
                type: 'text',
                x: 430,
                y: 445,
                width: 120,
                height: 30,
                required: true,
                signer: '1',
                page: 4,
            },
        ],
        clientId: '07cdb79af895854998410f42b57a845e',
        metadata: metadata,
    };
    const result = await helloSign.signatureRequestSend(data);

    return result;
};

const getFinanceData = async (req: Request, res: Response) => {
    const result: any = {};
    const data = await firebaseDB.getData();
    result.totalApplications = data.length;
    result.totalApprovedAmount = _.sum(_.map(data, 'approvedAmount'));
    result.pendingApplications = _.filter(data, { stageCode: 0 }).length || 0;
    result.approvedApplications = _.filter(data, { stageCode: 2 }).length || 0;
    res.status(200).send(result);
};

const getFinanceDataSummary = async (req: Request, res: Response) => {
    const result: any = {
        approvedAmount: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications : 0,
        disapprovedApplications : 0,
        lineData : {},
        columnData : {}
    };
    const data = await firebaseDB.getData();
    data.forEach((elem: any) => {
        var ddate = elem.createdOn.toDate().toString().split(' ');
        let date = `${ddate[2]}-${ddate[1]}-${ddate[3]}`;
        if (elem.approvedAmount) {
            if (date in result.lineData)
                result.lineData[date] = result.lineData[date] + Number(elem.approvedAmount);
            else result.lineData[date] = Number(elem.approvedAmount);
            result.approvedAmount =
                result.approvedAmount + Number(elem.approvedAmount);
        }
        if (!(date in result.columnData))
            result.columnData[date] = {
                pending : 0,
                approved : 0,
                cancelled : 0
            };
        if(elem.stageCode==0){
            result.columnData[date].pending += 1;
            result.pendingApplications += 1
        }
        if (elem.stageCode == 1) {
            result.columnData[date].cancelled += 1;
            result.disapprovedApplications += 1;
        }
        if (elem.stageCode == 2) {
            result.columnData[date].approved += 1;
            result.approvedApplications += 1;
        }
    });
    result.totalApplications = data.length;
    res.status(200).send(result);
};

export {
    generateToken,
    createWorkflowInstance,
    getApplications,
    getApplicationTypes,
    getApplicationSummary,
    getWorkflowInstanceById,
    getDocumentLinkById,
    postCallBackData,
    getDocumentViewById,
    getFinanceData,
    getFinanceDataSummary,
};