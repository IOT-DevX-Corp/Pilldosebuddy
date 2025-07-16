import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth, signInAnonymously } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAnanb7oZ0LmlQrjb31NJLIxLi_GKPjBB4",
  authDomain: "iot-prj-ac910.firebaseapp.com",
  databaseURL: "https://iot-prj-ac910-default-rtdb.firebaseio.com/",
  projectId: "iot-prj-ac910",
  storageBucket: "iot-prj-ac910.appspot.com",
  messagingSenderId: "678890602245",
  appId: "1:678890602245:web:abcdef123456",
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
export const auth = getAuth(app)

// Initialize anonymous authentication
export const initializeAuth = async () => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth)
    }
    return auth.currentUser
  } catch (error) {
    console.error("Error signing in anonymously:", error)
    throw error
  }
}
