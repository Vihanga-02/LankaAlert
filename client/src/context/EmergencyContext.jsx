// src/context/EmergencyContext.jsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';

const EmergencyContext = createContext();

export const useEmergency = () => useContext(EmergencyContext);

export const EmergencyProvider = ({ children }) => {
  const [allRequests, setAllRequests] = useState([]);
  const [availableReporters, setAvailableReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New function to update a request
  const handleUpdateRequest = async (requestId, newData) => {
    if (!db) return;
    try {
      const requestDocRef = doc(db, 'emergencyRequests', requestId);
      await updateDoc(requestDocRef, newData);
      console.log("Request updated successfully!");
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  // New function to delete a request
  const handleDeleteRequest = async (requestId) => {
    if (!db) return;
    try {
      const requestDocRef = doc(db, 'emergencyRequests', requestId);
      await deleteDoc(requestDocRef);
      console.log("Request deleted successfully!");
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    if (!db) return;
    try {
      const requestDocRef = doc(db, 'emergencyRequests', requestId);
      const updateData = {
        status: newStatus,
      };

      if (newStatus === 'processing') {
        updateData.assignedAt = Timestamp.now();
      } else if (newStatus === 'completed') {
        updateData.completedAt = Timestamp.now();
      }

      await updateDoc(requestDocRef, updateData);
    } catch (error) {
      console.error('Error changing request status:', error);
    }
  };

  const handleAssignRequest = async (requestId, reporter) => {
    if (!db) return;
    try {
      const requestDocRef = doc(db, 'emergencyRequests', requestId);
      await updateDoc(requestDocRef, {
        status: 'processing',
        assignedTo: reporter.name,
        assignedAt: Timestamp.now(),
        reporterId: reporter.id,
      });
    } catch (error) {
      console.error('Error assigning request:', error);
    }
  };

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const requestsCollectionRef = collection(db, 'emergencyRequests');
    const unsubscribeRequests = onSnapshot(requestsCollectionRef, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllRequests(requests);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setIsLoading(false);
    });

    const reportersCollectionRef = collection(db, 'reporters');
    const unsubscribeReporters = onSnapshot(reportersCollectionRef, (querySnapshot) => {
      const reporters = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableReporters(reporters);
    }, (error) => {
      console.error("Error fetching reporters:", error);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeReporters();
    };

  }, []);

  return (
    <EmergencyContext.Provider value={{
      allRequests,
      availableReporters,
      handleAssignRequest,
      handleStatusChange,
      handleUpdateRequest,
      handleDeleteRequest,
      isLoading
    }}>
      {children}
    </EmergencyContext.Provider>
  );
};
