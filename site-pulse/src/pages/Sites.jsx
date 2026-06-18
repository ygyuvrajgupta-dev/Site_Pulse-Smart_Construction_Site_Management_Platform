import Navbar from "../components/Navbar";

function Sites() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>Sites</h1>

        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Site Name</th>
              <th>Location</th>
              <th>Progress</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Kanpur Cold Storage</td>
              <td>Kanpur</td>
              <td>72%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Sites;