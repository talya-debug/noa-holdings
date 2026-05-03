// חיבור Firebase — אימות + מסד נתונים
// Production/Dev נבחר אוטומטית לפי הדומיין
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const prodConfig = {
  apiKey: "AIzaSyCjvx8n2-NWj2y9lK3fjbWMUpm6NzlYHgs",
  authDomain: "noa-holdings.firebaseapp.com",
  projectId: "noa-holdings",
  storageBucket: "noa-holdings.firebasestorage.app",
  messagingSenderId: "824074329917",
  appId: "1:824074329917:web:2ed6a21dd6c75406f22f54"
}

const devConfig = {
  apiKey: "AIzaSyAvD7IKWcO-YO7FwS1cvGnKlOM_izLIwN0",
  authDomain: "noa-holdings-dev.firebaseapp.com",
  projectId: "noa-holdings-dev",
  storageBucket: "noa-holdings-dev.firebasestorage.app",
  messagingSenderId: "737381513891",
  appId: "1:737381513891:web:66b869abb3212652861d16"
}

// אם הדומיין הוא noa-holdings.vercel.app = production, אחרת = dev
const isProd = typeof window !== 'undefined' && window.location.hostname === 'noa-holdings.vercel.app'
const firebaseConfig = isProd ? prodConfig : devConfig

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
