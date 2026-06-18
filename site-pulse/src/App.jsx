import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Materials from "./pages/Materials";
import Attendance from "./pages/Attendance";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/sites" element={<Sites />} />
      <Route path="/materials" element={<Materials />} />
      <Route path="/attendance" element={<Attendance />} />
    </Routes>
  );
}

export default App;