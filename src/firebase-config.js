import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDA-eSYCkfp_rghIlz4-N8KuWsydjarokc",
    authDomain: "cs4241-a3-persistence.firebaseapp.com",
    databaseURL: "https://cs4241-a3-persistence.firebaseio.com",
    projectId: "cs4241-a3-persistence",
    storageBucket: "cs4241-a3-persistence.appspot.com",
    messagingSenderId: "359117328600",
    appId: "1:359117328600:web:952cd88ac77f29a26487ad"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
