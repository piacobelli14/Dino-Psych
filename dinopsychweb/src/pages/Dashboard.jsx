import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Chart from "chart.js/auto"; 
import { Bar, Line, Pie } from "react-chartjs-2"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faX, faFile, faPerson, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png"; 

import "../styles/Dashboard.css"; 

const Dashboard = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token"); 
    const [username, setUsername] = useState("");
    const [organizationID, setOrganizationID] = useState(""); 
    const [patientList, setPatientList] = useState(['']); 
    const [selectedPatientIDs, setSelectedPatientIDs] = useState([]); 
    const [selectedPatientInfo, setSelectedPatientInfo] = useState([]); 
    const [isHamburger, setIsHamburger] = useState(false);

    return (
        <div>

           {isHamburger && (
                <div className="dashboardHamburgerPopout"> 
                </div>
            )}

            <div className="dashboardHeaderContainer">
                <div className="dashboardTopNavBarContainer"> 

                <a className="dashboardSkipToContent"> 
                    <img className="dashboardLogo" src={DinoLabsLogoWhite} alt="Dino Labs Logo"/>
                    <label className="dashboardHeader">
                        Dino Psych
                    </label> 
                </a>

                <button className="dashboardHamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
                    <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="dashboardHamburgerIcon" />
                </button>
                </div>

                {!isHamburger && (
                    <div className="dashboardHeaderDivider"/>
                )}

                {isHamburger && (
                    <div className="dashboardHamburgerContent">

                        <br/>
                        <br/>
                        
                        <button className="navigationButtonWrapper">
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faFile} className="navigationButtonIcon"/>
                                Dashboard
                            </div>   

                            <div className="navigationButtonDivider"/>
                        </button>

                        <button className="navigationButtonWrapper" onClick={()=> navigate('/dashboard')}>
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faPerson} className="navigationButtonIcon"/>
                                My Account
                            </div>

                            <div className="navigationButtonDivider"/>
                        </button>

                        <button className="navigationButtonWrapper" onClick={()=> navigate('/login')}>
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faRightFromBracket} className="navigationButtonIcon"/>
                                Sign Out
                            </div>

                            <div className="navigationButtonDivider"/>
                        </button>
                    </div>
                )}

                {!isHamburger && (
                    <div>
                    </div>
                )}


            </div>
        </div>
    );
};

export default Dashboard; 