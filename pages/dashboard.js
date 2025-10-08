import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../src/context/AuthContext";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashAlt, faCheckCircle, faUndo, faTasks, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const { token, logout } = useContext(AuthContext);
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "Low" });
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState({ priority: "All", status: "All" });
  const [theme, setTheme] = useState("light");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);

  const indexOfLastTask = currentPage * entriesPerPage;
  const indexOfFirstTask = indexOfLastTask - entriesPerPage;
  const [notification, setNotification] = useState("");
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!token) router.push("/");
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
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/tasks`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks([res.data, ...tasks]);
        setForm({ title: "", description: "", priority: "Low" });
        triggerNotification("Task added successfully ✅");
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
        triggerNotification("Task deleted successfully 🗑️");
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
      triggerNotification(
        task.completed
          ? "Task marked as pending ⏳"
          : "Task completed successfully ✅"
      );
    };

  const handlePriorityChange = async (taskId, newPriority) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t._id === taskId ? { ...t, priority: newPriority } : t
        )
      );
    } catch (err) {
      console.error("Error updating priority:", err);
      alert("Failed to update priority");
    }
  };

  const clearCompleted = async () => {
    if (!confirm("Clear all completed tasks?")) return;
    await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/tasks/clear`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks();
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

    const triggerNotification = (msg) => {
      setNotification(msg);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000); // hides after 2 seconds
    };
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };

  const filteredTasks = tasks
    .filter((t) => {
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
    })

  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);

  return (
    <div className="container" style={{ color: theme === "dark" ? "#eee" : "#333" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Your Tasks</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="theme-switch-wrapper" onClick={toggleTheme} style={{ cursor: "pointer" }}>
            <span className="theme-label">{theme === "light" ? "Light" : "Dark"}</span>
            <div className="theme-switch">
              <input type="checkbox" checked={theme === "dark"} readOnly />
              <span className="slider"></span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            Logout
          </button>
        </div>
      </header>
      
      {showNotification && (
        <div className="notification-popup">
          {notification}
        </div>
      )}

      {/* Task Form */}
      <form onSubmit={addOrUpdate} className="task-form">
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#eee" : "#333" }}
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#eee" : "#333" }}
        />
        <select
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#eee" : "#333" }}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <button type="submit">Add</button>
      </form>

      {/* Filters */}
      <div className="filters-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
        {["Priority", "Status", "From", "To"].map((label) => (
          <div
            key={label}
            style={{
              background: theme === "dark" ? "#2c2c2c" : "#f8f9fa",
              color: theme === "dark" ? "#eee" : "#343a40",
              padding: "6px 12px",
              borderRadius: "20px",
              boxShadow: theme === "dark" ? "0 2px 5px rgba(0,0,0,0.3)" : "0 2px 5px rgba(0,0,0,0.05)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <label style={{ fontSize: "12px", fontWeight: 500 }}>{label}:</label>
            {label === "Priority" && (
              <select
                value={filter.priority}
                onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
                style={{ border: "none", background: "transparent", color: theme === "dark" ? "#eee" : "#343a40", cursor: "pointer" }}
              >
                <option value="All">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            )}
            {label === "Status" && (
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                style={{ border: "none", background: "transparent", color: theme === "dark" ? "#eee" : "#343a40", cursor: "pointer" }}
              >
                <option value="All">All</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            )}
            {label === "From" && (
              <input
                type="date"
                value={filter.fromDate || ""}
                onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                style={{ border: "none", background: "transparent", color: theme === "dark" ? "#eee" : "#343a40", cursor: "pointer" }}
              />
            )}
            {label === "To" && (
              <input
                type="date"
                value={filter.toDate || ""}
                onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                style={{ border: "none", background: "transparent", color: theme === "dark" ? "#eee" : "#343a40", cursor: "pointer" }}
              />
            )}
          </div>
        ))}
        <button
          onClick={clearCompleted}
          style={{
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: "20px",
            cursor: "pointer",
            boxShadow: theme === "dark" ? "0 2px 5px rgba(0,0,0,0.3)" : "0 2px 5px rgba(0,0,0,0.05)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          Clear Completed
        </button>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="task-table" style={{ width: "100%", borderCollapse: "collapse", color: theme === "dark" ? "#eee" : "#333" }}>
          <thead>
            <tr>
              {["Title", "Description", "Priority", "Status", "Completed At", "Created At", "Actions"].map((th) => (
                <th key={th} style={{ borderBottom: theme === "dark" ? "1px solid #555" : "1px solid #ccc", padding: "8px" }}>{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentTasks.map((task) => (
              <tr
                key={task._id}
                style={{
                  backgroundColor: task.completed
                    ? theme === "dark"
                      ? "#1b4620"
                      : "#d4edda"
                    : theme === "dark"
                    ? "#333"
                    : "#fff",
                  color: task.completed
                    ? theme === "dark"
                      ? "#d4edda"
                      : "#155724"
                    : theme === "dark"
                    ? "#eee"
                    : "#333",
                }}
              >
                <td>{task.title}</td>
                <td>{task.description || "-"}</td>
              <td>
                <select
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(task._id, e.target.value)}
                  style={{
                    background:
                      task.priority === "High"
                        ? "#ff4d4d"   // solid red
                        : task.priority === "Medium"
                        ? "#ffd700"   // solid yellow
                        : "#00fa9a",  // solid green
                    color: "#000", // black text
                    border: "1px solid #888",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    outline: "none",
                    fontSize: "14px",
                    fontWeight: "600",
                    textTransform: "capitalize",
                    transition: "all 0.2s ease",
                    boxShadow:
                      theme === "dark"
                        ? "0 0 4px rgba(255,255,255,0.2)"
                        : "0 0 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <option
                    value="Low"
                    style={{
                      background: "#00fa9a",
                      color: "#000",
                    }}
                  >
                    Low
                  </option>
                  <option
                    value="Medium"
                    style={{
                      background: "#ffd700",
                      color: "#000",
                    }}
                  >
                    Medium
                  </option>
                  <option
                    value="High"
                    style={{
                      background: "#ff4d4d",
                      color: "#000",
                    }}
                  >
                    High
                  </option>
                </select>
              </td>


                <td>{task.completed ? "✅ Completed" : "⏳ Pending"}</td>
                <td>{task.completedAt ? new Date(task.completedAt).toLocaleString() : "-"}</td>
                <td>{new Date(task.createdAt).toLocaleString()}</td>
                <td className="actions" style={{ display: "flex", gap: "4px" }}>
                  <button onClick={() => del(task._id)} className="icon-btn delete-btn"><FontAwesomeIcon icon={faTrashAlt} /></button>
                  <button onClick={() => toggleComplete(task)} className="icon-btn toggle-btn">
                    <FontAwesomeIcon icon={task.completed ? faUndo : faCheckCircle} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <div>
          Show{" "}
          <select
            value={entriesPerPage}
            onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
            style={{ background: theme === "dark" ? "#333" : "#fff", color: theme === "dark" ? "#eee" : "#333" }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>{" "}
          entries
        </div>
        <div>
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Previous</button>
          <span style={{ margin: "0 8px" }}>Page {currentPage} of {Math.ceil(filteredTasks.length / entriesPerPage)}</span>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredTasks.length / entriesPerPage)))} disabled={currentPage === Math.ceil(filteredTasks.length / entriesPerPage)}>Next</button>
        </div>
      </div>
    </div>
  );
}
