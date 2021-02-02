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
        this.dialogsCollectionRef = this._database.collection('dialogs');
        this.serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;
        this.user = null;
        this.currentUserRef = null;
        this.userData = null;
        this.activeDialogRef = null;
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
                this.userData = null;
            }
        }, (error) => {
            console.error(error);
            this.subscribeOnAuthState();
        });
    };

    verifyUserEmail = () => {
        return this.user.sendEmailVerification();
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
        const newActiveChat = [this.userData.activeChatsWith, participantId];
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
                    console.log('User dont exist');
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

    createNewDialog = async (participantUid) => {
        try {
            const newDialogRef = await this.dialogsCollectionRef.doc();
            await newDialogRef.set({
                participants: [this.user.uid, participantUid],
            });
            this.activeDialogRef = newDialogRef;
        } catch (error) {
            console.error(error);
        }
    };

    sendMessage = (messageType, dialodId, data) => {
        if (dialodId && messageType && data) {
            return this.dialogsCollectionRef.doc(dialodId).collection('messages').add({
                type: messageType,
                date: this.serverTimestamp(),
                ...data,
            });

        }
    };

    sendTextMessage = (dialogId, text) => {
        if (text) {
            const data = {text};
            return this.sendMessage('text', dialogId, data);
        }
    };

    sendImgMessage = (dialogId, text, linkOnFile) => {
        if (linkOnFile) {
            const data = {
                linkOnFile,
                text: text ? text : '',
            }
            return this.sendMessage('image', dialogId, data);
        }
    };

    sendDocMessage = (dialogId, text, linkOnFile) => {
        if (linkOnFile) {
            const data = {
                linkOnFile,
                text: text ? text : '',
            }
            return this.sendMessage('document', dialogId, data);
        }
    };

    // setActiveDialog = (participantUid) => {
    //   return this.dialogsCollectionRef.where('participants', 'array-contains', this.user.uid)
    //       .get()
    //       .then((snapshot) => {
    //           snapshot.forEach(doc => {
    //
    //           });
    //       })
    // };
}
