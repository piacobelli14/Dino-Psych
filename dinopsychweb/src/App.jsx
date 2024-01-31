import { BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reset from "./pages/Reset";

import './styles/App.css'; 

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="login" element={<Login/>}/>
        <Route path="register" element={<Register/>}/>
        <Route path="reset" element={<Reset/>}/>

        <Route index element={<Navigate to="login" replace />} />
      </Routes>
    </Router>
  );
}