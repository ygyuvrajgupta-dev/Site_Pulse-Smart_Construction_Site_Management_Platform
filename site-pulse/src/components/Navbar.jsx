import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        background: "#0f172a",
        padding: "15px",
        display: "flex",
        gap: "20px",
      }}
    >
      <Link to="/" style={{ color: "white" }}>Dashboard</Link>
      <Link to="/sites" style={{ color: "white" }}>Sites</Link>
      <Link to="/materials" style={{ color: "white" }}>Materials</Link>
      <Link to="/attendance" style={{ color: "white" }}>Attendance</Link>
    </nav>
  );
}

export default Navbar;