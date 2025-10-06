import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        setUser(userDoc.exists() ? userDoc.data() : null);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (formData) => {
    setIsLoading(true);
    try {
      const { password, reporterOfficeLocation, reporterOfficeId, ...rest } =
        formData;

      const cred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        password
      );

      // Build base user object
      const newUser = {
        ...rest, // includes smsSubscribed, farmerAlerts, fishermenAlerts, etc.
        uid: cred.user.uid,
        role: "user",
        isAdmin: formData.email === "admin@lankaalert.com",
        isReporter: false,
        createdAt: serverTimestamp(),
      };

      // If they applied as reporter, add extra fields
      if (formData.applyAsReporter) {
        newUser.requestedReporter = true;
        if (reporterOfficeLocation)
          newUser.districtOffice = reporterOfficeLocation;
        if (reporterOfficeId) newUser.workId = reporterOfficeId;
      }

      await setDoc(doc(db, "users", cred.user.uid), newUser);

      setUser(newUser);
      return { success: true };
    } catch (error) {
      console.error("Registration Error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", cred.user.uid));
      if (!userDoc.exists()) throw new Error("User not found");
      const userData = userDoc.data();
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login Error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = async (updates) => {
    setIsLoading(true);
    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) throw new Error("No authenticated user");
      await updateDoc(doc(db, "users", uid), updates);
      const updated = { ...(user || {}), ...updates };
      setUser(updated);
      return { success: true };
    } catch (error) {
      console.error("Update User Error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
