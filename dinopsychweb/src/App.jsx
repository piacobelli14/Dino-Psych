import { BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom"; 
import Login from "./pages/Login";
import Register from "./pages/Register";
import Reset from "./pages/Reset";
import Manager from "./pages/Manager";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report"; 
import Survey from "./pages/Survey"; 

import './styles/App.css'; 

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="login" element={<Login/>}/>
        <Route path="register" element={<Register/>}/>
        <Route path="reset" element={<Reset/>}/>
        <Route path="manager" element={<Manager/>}/>
        <Route path="dashboard" element={<Dashboard/>}/>
        <Route path="report" element={<Report/>}/>
        <Route path="/survey/:surveyKey" element={<Survey/>}/>

        <Route index element={<Navigate to="login" replace />} />
      </Routes>
    </Router>
  );
}