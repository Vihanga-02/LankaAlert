import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getInventoryItems,
  addInventoryItem as addItemService,
  updateInventoryItem as updateItemService,
  deleteInventoryItem as deleteItemService, 
  getInventoryItemById,
} from "../services/inventoryService";

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  const fetchInventory = async () => {
    const items = await getInventoryItems();
    setInventory(items);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const addInventoryItem = async (item) => {
    const id = await addItemService(item);
    setInventory((prev) => [...prev, { id, ...item }]);
    setRecentMovements((prev) => [
      { id: Date.now(), item: item.name, quantity: item.currentStock, type: "added", date: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  const updateInventoryItem = async (id, updatedFields) => {
    await updateItemService(id, updatedFields);
    setInventory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    );

    const itemName = inventory.find((item) => item.id === id)?.name;
    if (updatedFields.currentStock !== undefined) {
      const prevStock = inventory.find((item) => item.id === id)?.currentStock || 0;
      const diff = updatedFields.currentStock - prevStock;
      if (diff !== 0) {
        setRecentMovements((prev) => [
          {
            id: Date.now(),
            item: itemName,
            quantity: Math.abs(diff),
            type: diff > 0 ? "added" : "removed",
            date: new Date().toLocaleString(),
          },
          ...prev,
        ]);
      }
    }
  };

  const deleteInventoryItem = async (id) => {
    await deleteItemService(id);
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const getInventoryItemByIdContext = async (id) => {
    return await getInventoryItemById(id);
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        recentMovements,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        getInventoryItemById: getInventoryItemByIdContext,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
