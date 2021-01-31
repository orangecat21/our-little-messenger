import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

import firebaseConfig from './firebaseConfig';

export default class Firebase {
    constructor() {
        firebase.initializeApp(firebaseConfig);
        this._auth = firebase.auth();
        this._database = firebase.firestore();
        this._storage = firebase.storage();
        this._auth.onAuthStateChanged((user) => {
            if (user) {
                this.uid = user.uid;
            } else {
                this.uid = '';
            }
        });


    }
}

