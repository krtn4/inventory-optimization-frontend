import { useEffect, useState } from "react";
import "./index.css";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  // ---------------- STATE ----------------
  const [products, setProducts] = useState([]);

  const [newProduct, setNewProduct] = useState({
    product_name: "",
    stock_keeping_unit: "",
    unit_price: "",
  });

  // ---------------- DATA FETCH ----------------
  const fetchProducts = () => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error("Fetch products failed", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ---------------- KPI CALCULATIONS ----------------
  const totalProducts = products.length;

  const lowStockCount = products.filter(
    (p) =>
      (p.current_stock ?? 0) > 0 &&
      (p.current_stock ?? 0) <= (p.reorder_point ?? 0)
  ).length;

  const outOfStockCount = products.filter(
    (p) => (p.current_stock ?? 0) <= 0
  ).length;

  // ---------------- PIE CHART DATA ----------------
  const pieData = [
    {
      name: "Stock OK",
      value: products.filter(
        (p) => (p.current_stock ?? 0) > (p.reorder_point ?? 0)
      ).length,
    },
    {
      name: "Low Stock",
      value: lowStockCount,
    },
    {
      name: "Out of Stock",
      value: outOfStockCount,
    },
  ];

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  // ---------------- HELPERS ----------------
  const getStockStatus = (p) => {
    if ((p.current_stock ?? 0) <= 0) {
      return { label: "OUT OF STOCK", color: "#ef4444" };
    }
    if ((p.current_stock ?? 0) <= (p.reorder_point ?? 0)) {
      return { label: "LOW STOCK", color: "#facc15" };
    }
    return { label: "STOCK OK", color: "#22c55e" };
  };

  // ---------------- ADD PRODUCT ----------------
  const addProduct = async () => {
    if (
      !newProduct.product_name ||
      !newProduct.stock_keeping_unit ||
      !newProduct.unit_price
    ) {
      alert("Fill all fields");
      return;
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: 1,
          product_name: newProduct.product_name,
          stock_keeping_unit: newProduct.stock_keeping_unit,
          unit_cost: 0,
          unit_price: newProduct.unit_price,
        }),
      });

      setNewProduct({
        product_name: "",
        stock_keeping_unit: "",
        unit_price: "",
      });

      fetchProducts();
    } catch (err) {
      console.error("Add product failed", err);
    }
  };

  // ---------------- DELETE PRODUCT ----------------
  const deleteProduct = async (productId) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${productId}`,
        { method: "DELETE" }
      );

      fetchProducts();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // ---------------- UI ----------------
  return (
    <div style={{ padding: "10px" }}>
      <h1>Inventory Optimization Dashboard</h1>

      {/* KPI CARDS */}
      <div className="kpi-grid" style={{ marginBottom: "30px" }}>
        <div className="card">
          <h3>Total Products</h3>
          <h2>{totalProducts}</h2>
        </div>

        <div className="card">
          <h3>Low Stock</h3>
          <h2 style={{ color: "#facc15" }}>{lowStockCount}</h2>
        </div>

        <div className="card">
          <h3>Out of Stock</h3>
          <h2 style={{ color: "#ef4444" }}>{outOfStockCount}</h2>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="card" style={{ marginBottom: "30px" }}>
        <h2>Inventory Health</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ADD PRODUCT */}
      <div className="card" style={{ marginBottom: "30px" }}>
        <h2>Add New Product</h2>
        <div className="form-row">
          <input
            placeholder="Product Name"
            value={newProduct.product_name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, product_name: e.target.value })
            }
          />

          <input
            placeholder="SKU"
            value={newProduct.stock_keeping_unit}
            onChange={(e) =>
              setNewProduct({
                ...newProduct,
                stock_keeping_unit: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Price"
            value={newProduct.unit_price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, unit_price: e.target.value })
            }
          />

          <button className="action-btn restock-btn" onClick={addProduct}>
            + Add Product
          </button>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="card">
        <h2>Products</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Status</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const status = getStockStatus(p);

              return (
                <tr key={p.product_id}>
                  <td>{p.product_id}</td>
                  <td>{p.product_name}</td>
                  <td>{p.stock_keeping_unit}</td>
                  <td>₹ {p.unit_price}</td>
                  <td style={{ color: status.color, fontWeight: "bold" }}>
                    {status.label}
                  </td>
                  <td>{p.current_stock ?? 0}</td>
                  <td>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteProduct(p.product_id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 
        🚧 FUTURE FEATURES (INTENTIONALLY DISABLED)
        - Demand trend
        - Stock update
        - Stockout prediction
        Will be enabled once backend routes are ready
      */}
    </div>
  );
}

export default App;
