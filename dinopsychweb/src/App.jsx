import { BrowserRouter as Router, Route, Routes, Navigate} from "react-router-dom"; 
import Login from "./pages/Login"

import './styles/App.css'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="login" element={<Login/>}/>

        <Route index element={<Navigate to="login" replace />} />
      </Routes>
    </Router>
  );
}