import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>Site Pulse Dashboard</h1>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={cardStyle}>
            <h2>12</h2>
            <p>Total Sites</p>
          </div>

          <div style={cardStyle}>
            <h2>8</h2>
            <p>Active Projects</p>
          </div>

          <div style={cardStyle}>
            <h2>72%</h2>
            <p>Overall Progress</p>
          </div>
        </div>
      </div>
    </>
  );
}

const cardStyle = {
  background: "#22c55e",
  color: "white",
  padding: "20px",
  borderRadius: "12px",
  width: "200px",
};

export default Dashboard;