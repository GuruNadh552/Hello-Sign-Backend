import { FirebaseApp, initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    getDocs,
    Firestore,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
} from 'firebase/firestore/lite';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { firebaseConfig } from './firebase.config';
import * as _ from 'lodash';

class FireBaseDB {
    private app: FirebaseApp;
    private db: Firestore;
    private collectionName : string;
    constructor(collectionName : string) {
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        this.collectionName = collectionName;
    }

    async insertData(data: any) {
        const dataColumns = collection(this.db, this.collectionName);
        const snapShotData = await addDoc(dataColumns, data);
        return snapShotData;
    }

    async getData() {
        const dataColumns = collection(this.db, this.collectionName);
        const snapShotData = await getDocs(dataColumns);
        let data = snapShotData.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        data = _.reverse(_.sortBy(data,['createdOn']));
        return data;
    }

    async updateData(id: string,data:any){
        const docRef = doc(this.db, this.collectionName, id);
        const updatedData = await updateDoc(docRef,data);
        return {success:true,data:updatedData};
    }

    async deleteData(id: string) {
        const docRef = doc(this.db, this.collectionName, id);
        const deleteData = await deleteDoc(docRef);
        return { success: true };
    }

    async uploadFile(testData:any){
        const storage = getStorage(this.app);
        const storageRef = ref(storage, `${Date.now()}.pdf`);
        const metadata = {
            contentType: 'application/pdf',
        };
        const uploadTask = await uploadBytes(storageRef,testData,metadata); 
        console.log(metadata);
    }
}

export default FireBaseDB;


