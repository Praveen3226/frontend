import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../src/context/AuthContext";
import { useRouter } from "next/router";
import "../styles/globals.css"; // <-- make sure you created this file

export default function Home() {
  const { token, logout } = useContext(AuthContext);
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "Low" });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState({ priority: "All", status: "All" });
  const [theme, setTheme] = useState("light");

  // Load token + theme
  useEffect(() => {
    if (!token) router.push("/login");
    else fetchTasks();

    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.body.className = savedTheme;
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) logout();
    }
  };

  const addOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/tasks/${editingId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks((ts) => ts.map((t) => (t._id === editingId ? res.data : t)));
        setEditingId(null);
      } else {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/tasks`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks([res.data, ...tasks]);
      }
      setForm({ title: "", description: "", priority: "Low" });
    } catch (err) {
      setMsg(err.response?.data?.msg || "Action failed");
    }
  };

  const del = async (id) => {
    if (!id || !window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Failed to delete task");
    }
  };

  const toggleComplete = async (task) => {
    const res = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${task._id}`,
      { completed: !task.completed },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setTasks(tasks.map((t) => (t._id === task._id ? res.data : t)));
  };

  const edit = (task) => {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Low",
    });
  };

  const clearCompleted = async () => {
    if (!confirm("Clear all completed tasks?")) return;
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tasks/clear`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    const matchPriority = filter.priority === "All" || t.priority === filter.priority;
    const matchStatus =
      filter.status === "All" ||
      (filter.status === "Completed" && t.completed) ||
      (filter.status === "Pending" && !t.completed);

    const createdDate = new Date(t.createdAt);
    const from = filter.fromDate ? new Date(filter.fromDate) : null;
    const to = filter.toDate ? new Date(filter.toDate) : null;

    const matchDate =
      (!from || createdDate >= from) &&
      (!to || createdDate <= new Date(to.getTime() + 24 * 60 * 60 * 1000));

    return matchPriority && matchStatus && matchDate;
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  return (
    <div className="container">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Your Tasks</h1>
        <div>
          <button onClick={toggleTheme} style={{ marginRight: "10px" }}>
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Task Form */}
      <form onSubmit={addOrUpdate} className="task-form">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button type="submit">{editingId ? "Update" : "Add"}</button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ title: "", description: "", priority: "Low" });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <button onClick={clearCompleted} style={{ marginBottom: "10px" }}>
        Clear Completed
      </button>
      {msg && <p>{msg}</p>}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Priority :</label>
          <select
            value={filter.priority}
            onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status :</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>From :</label>
          <input
            type="date"
            value={filter.fromDate}
            onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <label>To :</label>
          <input
            type="date"
            value={filter.toDate}
            onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
          />
        </div>
      </div>

      {/* Table */}
      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Completed At</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => (
            <tr key={task._id}>
              <td>{task.title}</td>
              <td>{task.description || "-"}</td>
              <td>{task.priority}</td>
              <td>{task.completed ? "✅ Completed" : "⏳ Pending"}</td>
              <td>
                {task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}
              </td>
              <td>{new Date(task.createdAt).toLocaleString()}</td>
              <td className="actions">
                <button onClick={() => edit(task)} className="edit-btn">Edit</button>
                <button onClick={() => del(task._id)} className="delete-btn">Delete</button>
                <button onClick={() => toggleComplete(task)} className="toggle-btn">
                  {task.completed ? "Mark Pending" : "Mark Completed"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: "10px", fontStyle: "italic" }}>
        Showing {filteredTasks.length} of {tasks.length} tasks
      </p>
    </div>
  );
}
const thStyle = { padding: '8px', border: '1px solid #aaa', textAlign: 'left' };
const tdStyle = { padding: '8px', border: '1px solid #ccc' };

const btnEdit = { backgroundColor: '#f0ad4e', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' };
const btnDelete = { backgroundColor: '#d9534f', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' };
const btnToggle = { backgroundColor: '#5bc0de', color: '#fff', padding: '4px 8px', border: 'none', borderRadius: '4px' };