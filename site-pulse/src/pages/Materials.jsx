import Navbar from "../components/Navbar";

function Materials() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>Materials</h1>

        <ul>
          <li>PUF Panels - 120</li>
          <li>Doors - 8</li>
          <li>Roofing Sheets - 10</li>
        </ul>
      </div>
    </>
  );
}

export default Materials;