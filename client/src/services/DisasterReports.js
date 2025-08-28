// services/DisasterReports.js
import { db } from "./firebase"; 
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const collectionName = "disasterReports";
const disasterCollection = collection(db, collectionName);

// ✅ CREATE - add new disaster report
// Now attaches reporterId + reporterEmail from logged-in user
export const addDisasterReport = async (reportData, currentUser) => {
  try {
    if (!currentUser?.uid || !currentUser?.email) {
      throw new Error("User not logged in");
    }

    const docRef = await addDoc(disasterCollection, {
      ...reportData,
      reporterId: currentUser.uid,
      reporterEmail: currentUser.email,   // 👈 saved to Firestore
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding disaster report:", error);
    throw error;
  }
};

// ✅ READ - get all reports
export const getDisasterReports = async () => {
  try {
    const querySnapshot = await getDocs(disasterCollection);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching disaster reports:", error);
    throw error;
  }
};

// ✅ READ - get single report by ID
export const getDisasterReportById = async (id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Report not found");
    }
  } catch (error) {
    console.error("Error fetching disaster report:", error);
    throw error;
  }
};

// ✅ UPDATE - update disaster report
export const updateDisasterReport = async (id, updatedData) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...updatedData,
      updatedAt: serverTimestamp(),
    });
    return { id, ...updatedData };
  } catch (error) {
    console.error("Error updating disaster report:", error);
    throw error;
  }
};

// ✅ DELETE - delete disaster report
export const deleteDisasterReport = async (id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return id;
  } catch (error) {
    console.error("Error deleting disaster report:", error);
    throw error;
  }
};
