// services/UserService.js
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const COLLECTION_NAME = "users";

export const UserService = {
  getAllUsers: async () => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },
};
