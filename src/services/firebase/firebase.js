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
        this.usersCollectionRef = this._database.collection('users');
        this.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
        this.unsubscribeOnAuthState = this.subscribeOnAuthState();
    };

    subscribeOnAuthState = () => {
        return this._auth.onAuthStateChanged((user) => {
            if (user) {
                this.user = user;
                this.currentUserRef = this.usersCollectionRef.doc(user.uid);
                this.userData = this.getUserData(user.uid);
            } else {
                this.user = null;
                this.currentUserRef = null;
            }
        }, (error) => {
            console.error(error);
            this.subscribeOnAuthState();
        });
    };

    createNewUser = (email, password) => {
        return this._auth.createUserWithEmailAndPassword(email, password)
            .then(({user}) => {
                this.writeNewUser(user.uid);
                return user;
            });
    };

    writeNewUser = (uid) => {
        this.usersCollectionRef.doc(uid).set({
            displayName: '',
            isOnline: true,
            lastSession: this.serverTimestamp(),
            photoUrl: '',
            activeChatsWith: [],
        }).catch(error => console.log(error));
    };

    updateUserName = (displayName) => {
        this.user.updateProfile({displayName}).catch(error => console.error(error));
        return this.currentUserRef.update({displayName});
    }

    setIsOnline = (isOnline) => {
        return this.currentUserRef.update({isOnline});
    };

    updateLastSession = () => {
        return this.currentUserRef.update({
            lastSession: this.serverTimestamp(),
        })
    };

    updatePhotoUrl = (photoUrl) => {
        return this.currentUserRef.update({photoUrl})
    };

    addNewActiveChat = (participantId) => {
        const newActiveChat = [ this.userData.activeChatsWith, participantId];
        return this.currentUserRef.update({activeChatsWith: newActiveChat})
            .then(() => {
                this.userData.activeChatsWith = newActiveChat;
                return newActiveChat;
            });
    };

    removeActiveChat = (participantId) => {
        const newActiveChat = this.userData.activeChatsWith.filter(id => id !== participantId);
        return this.currentUserRef.update({activeChatsWith: newActiveChat})
            .then(() => {
                this.userData.activeChatsWith = newActiveChat;
                return newActiveChat;
            });
    };

    getUserData = (uid) => {
        let userData = {};
        this.usersCollectionRef.doc(uid).get()
            .then(doc => {
                if (doc.exists) {
                    userData = doc.data();
                } else {
                    console.log('User dont Exist');
                }
            }).catch(error => console.error(error));
        return userData;
    };

    signIn = (email, password) => {
        return this._auth.signInWithEmailAndPassword(email, password);
    };

    signOut = () => {
        return this._auth.signOut();
    };
}

