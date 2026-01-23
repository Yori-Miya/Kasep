const firebaseConfig = {
  apiKey: "AIzaSyBopYTE3eXADKxkjR1jR_6IBJOYtB-kBys",
  authDomain: "kasep-project.firebaseapp.com",
  databaseURL: "https://kasep-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kasep-project",
  storageBucket: "kasep-project.firebasestorage.app",
  messagingSenderId: "1080890353842",
  appId: "1:1080890353842:web:b6a7e64f1285f6ffb701ab",
  measurementId: "G-V3HZVB06MQ"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();