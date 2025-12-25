import { useEffect, useState } from "react";
import "./index.css";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";


function App() {
  const [products, setProducts] = useState([]);
  const [stockoutDates, setStockoutDates] = useState({});


const pieData = [
  {
    name: "Stock OK",
    value: products.filter(
      p => (p.current_stock ?? 0) > (p.reorder_point ?? 0)
    ).length,
  },
  {
    name: "Low Stock",
    value: products.filter(
      p =>
        (p.current_stock ?? 0) > 0 &&
        (p.current_stock ?? 0) <= (p.reorder_point ?? 0)
    ).length,
  },
  {
    name: "Out of Stock",
    value: products.filter(
      p => (p.current_stock ?? 0) <= 0
    ).length,
  },
];


const COLORS = ["#22c55e", "#facc15", "#ef4444"];


const [demandSummary, setDemandSummary] = useState([]);


  // ---------- Helpers ----------

  const fetchStockoutDate = async (productId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/inventory/stockout/1/${productId}`
      );
      const data = await res.json();

      setStockoutDates((prev) => ({
        ...prev,
        [productId]: data.stockout_date,
      }));
    } catch (err) {
      console.error("Stockout fetch failed", err);
    }
  };
  

  const getStockStatus = (p) => {
    if (p.current_stock <= 0) {
      return { label: "OUT OF STOCK", color: "#ef4444" };
    }
    if (p.current_stock <= p.reorder_point) {
      return { label: "LOW STOCK", color: "#facc15" };
    }
    return { label: "STOCK OK", color: "#22c55e" };
  };

  

const fetchProducts = () => {
  fetch(`${import.meta.env.VITE_API_URL}/api/products`)
    .then(res => res.json())
    .then(data => {
      setProducts(data);
     // data.forEach(p => fetchStockoutDate(p.product_id));
    })
    .catch(err => console.error(err));
};


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



const [selectedProduct, setSelectedProduct] = useState(null);
const [demandData, setDemandData] = useState([]);



const [newProduct, setNewProduct] = useState({
  product_name: "",
  stock_keeping_unit: "",
  unit_price: "",
});


  // ---------- Data Fetch ----------

  useEffect(() => {
  fetchProducts();
}, []);


useEffect(() => {
  fetchDemandSummary();
}, []);

useEffect(() => {
  if (products.length > 0) {
    fetchDemandTrend(products[0].product_id);
  }
}, [products]);



  // ---------- KPI Calculations ----------

  const totalProducts = products.length;

  const lowStockCount = products.filter(
  p =>
    (p.current_stock ?? 0) > 0 &&
    (p.current_stock ?? 0) <= (p.reorder_point ?? 0)
).length;

const outOfStockCount = products.filter(
  p => (p.current_stock ?? 0) <= 0
).length;



  const updateStock = async (productId, change) => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/api/inventory/update-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        quantity_change: change,
      }),
    });


    // Refresh UI after update
    fetchProducts();
  } catch (err) {
    console.error("Stock update error", err);
  }
};



const deleteProduct = async (productId) => {
  if (!window.confirm("Are you sure you want to Delete this product?")) return;

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





const fetchDemandTrend = async (productId) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/inventory/demand/1/${productId}`
    );
    const data = await res.json();
    setDemandData(data);
    setSelectedProduct(productId);
  } catch (err) {
    console.error("Demand fetch failed", err);
  }
};




const fetchDemandSummary = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/inventory/demand-summary/1`
    );
    const data = await res.json();
    setDemandSummary(data);
  } catch (err) {
    console.error("Demand summary fetch failed", err);
  }
};


  // ---------- UI ----------

  return (
    <div style={{ padding: "10px" }}>
      <h1>Inventory Optimization Dashboard</h1>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: "30px" }}>
        <div className="card table-wrapper">
          <h3>Total Products</h3>
          <h2>{totalProducts}</h2>
        </div>

        <div className="card table-wrapper">
          <h3>Low Stock</h3>
          <h2 style={{ color: "#facc15" }}>{lowStockCount}</h2>
        </div>

        <div className="card table-wrapper">
          <h3>Out of Stock</h3>
          <h2 style={{ color: "#ef4444" }}>{outOfStockCount}</h2>
        </div>
      </div>



      <div className="charts-grid">
          {/* Pie Chart */}
          <div className="card table-wrapper">
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

          
        <div className="card table-wrapper">
        <h2>Daily Demand by Product</h2>

        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={demandSummary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="product_name"
              angle={-30}
              textAnchor="end"
              interval={0}
              height={80}
              tick={{ fill: "#cbd5f5", fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="total_demand"
              fill="#38bdf8"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
       </div>
       </div>


        <div className="card full-width">
          <h2>Daily Demand Trend</h2>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total_quantity"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        

        <div className="product-selector" style={{ marginBottom: "30px" }}>

          {products.map((p) => (
            <button
              key={p.product_id}
              className={`product-btn ${
                selectedProduct === p.product_id ? "active" : ""
              }`}
              onClick={() => fetchDemandTrend(p.product_id)}
            >
              {p.product_name}
            </button>
          ))}
        </div>



      <div className="card table-wrapper">
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

          <button
            className="action-btn restock-btn"
            onClick={addProduct}
          >
            + Add Product
          </button>
        </div>
      </div>



      {/* Products Table */}
      <div className="card table-wrapper">

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
              <th>Stockout Date</th>
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
                    {stockoutDates[p.product_id]
                      ? new Date(
                          stockoutDates[p.product_id]
                        ).toLocaleDateString("en-GB")
                      : "—"}
                  </td>
                  <td>
                    <div className="action-buttons">
                       <button
                        className="action-btn sell-btn"
                        onClick={() => updateStock(p.product_id, -1)}
                        disabled={p.current_stock <= 0}
                      >
                        − Sell
                      </button>

                      <button
                        className="action-btn restock-btn"
                        onClick={() => updateStock(p.product_id, 5)}
                      >
                        + Restock
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteProduct(p.product_id)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
