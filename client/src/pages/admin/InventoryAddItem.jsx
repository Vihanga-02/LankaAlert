import React, { useState } from "react";
import { useInventory } from "../../context/InventoryContext";
import { useNavigate } from "react-router-dom";

const InventoryAddItem = () => {
  const { addInventoryItem } = useInventory();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    currentStock: "",
    minThreshold: "",
    status: "In Stock",
    category: "food", // default category
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addInventoryItem(formData); // ✅ add item via context
    alert("Item added successfully!");

    // ✅ navigate back to inventory management
    navigate("/admin/inventory");
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-indigo-900">Add New Item</h2>

      <div>
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Current Stock</label>
        <input
          type="number"
          name="currentStock"
          value={formData.currentStock}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Min Threshold</label>
        <input
          type="number"
          name="minThreshold"
          value={formData.minThreshold}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="food">Food</option>
          <option value="medical">Medical</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Add Item
      </button>
    </form>
  );
};

export default InventoryAddItem;
