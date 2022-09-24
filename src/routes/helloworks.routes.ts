import {
    postCallBackData,
    createWorkflowInstance,
    getApplications,
    getApplicationSummary,
    getApplicationTypes,
    getDocumentLinkById,
    getWorkflowInstanceById,
    getDocumentViewById,
    getFinanceData,
    getFinanceDataSummary,
} from '../controllers/helloworks.controller';
import express from 'express';

const helloWorksRoutes = express.Router();

helloWorksRoutes.route('/').get(getApplications);
helloWorksRoutes.route('/').post(createWorkflowInstance);
helloWorksRoutes.route('/types').get(getApplicationTypes);
helloWorksRoutes.route('/work-summary').get(getApplicationSummary);
helloWorksRoutes.route('/workinstance/:id').get(getWorkflowInstanceById);
helloWorksRoutes.route('/documenturl/:id/:format').get(getDocumentLinkById);
helloWorksRoutes.route('/viewdocument/:id').get(getDocumentViewById);
helloWorksRoutes.route('/callback').post(postCallBackData);
helloWorksRoutes.route('/finance').get(getFinanceData);
helloWorksRoutes.route('/financeSummary').get(getFinanceDataSummary);

export = helloWorksRoutes;