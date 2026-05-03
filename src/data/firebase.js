// חיבור Firebase — אימות + מסד נתונים
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCjvx8n2-NWj2y9lK3fjbWMUpm6NzlYHgs",
  authDomain: "noa-holdings.firebaseapp.com",
  projectId: "noa-holdings",
  storageBucket: "noa-holdings.firebasestorage.app",
  messagingSenderId: "824074329917",
  appId: "1:824074329917:web:2ed6a21dd6c75406f22f54"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
