import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Chart from "chart.js/auto"; 
import { Bar, Line, Pie } from "react-chartjs-2"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png"; 

import "../styles/Dashboard.css"; 

const Dashboard = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token"); 
    const [username, setUsername] = useState("");

    return (
        <div>

        </div>
    );
};

export default Dashboard; 