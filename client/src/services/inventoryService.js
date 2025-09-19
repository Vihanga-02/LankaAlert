import { db } from './firebase'; 
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const inventoryCollectionRef = collection(db, 'inventoryItems');

// Get all inventory items
export const getInventoryItems = async () => {
  try {
    const data = await getDocs(inventoryCollectionRef);
    return data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching inventory items: ", error);
    return [];
  }
};

// Get single item by ID
export const getInventoryItemById = async (id) => {
  try {
    const itemDoc = await getDoc(doc(db, 'inventoryItems', id));
    if (itemDoc.exists()) {
      return { id: itemDoc.id, ...itemDoc.data() };
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document: ", error);
  }
};

// Add new item
export const addInventoryItem = async (item) => {
  try {
    const docRef = await addDoc(inventoryCollectionRef, item);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// Update existing item
export const updateInventoryItem = async (id, updatedFields) => {
  try {
    const itemDoc = doc(db, 'inventoryItems', id);
    await updateDoc(itemDoc, updatedFields);
    console.log("Document successfully updated!");
  } catch (error) {
    console.error("Error updating document: ", error);
  }
};

// Delete item
export const deleteInventoryItem = async (id) => {
  try {
    const itemDoc = doc(db, 'inventoryItems', id);
    await deleteDoc(itemDoc);
    console.log("Document successfully deleted!");
  } catch (error) {
    console.error("Error deleting document: ", error);
  }
};
