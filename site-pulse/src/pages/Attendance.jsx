import Navbar from "../components/Navbar";

function Attendance() {
  return (
    <>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <h1>Attendance</h1>

        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Rahul Kumar</td>
              <td>Present</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Attendance;