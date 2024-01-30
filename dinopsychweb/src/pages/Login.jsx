import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png";

import "../styles/Login.css"

const Login = ({ onRegister }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }, []);

  

  return (
    <div>

      <div className="loginHeaderContainer">
        <div className="loginTopNavBarContainer"> 

          <a className="loginSkipToContent"> 
            <img className="loginLogo" src={DinoLabsLogoWhite} alt="Dino Labs Logo"/>

            <label className="loginHeader">
              Dino Psych
            </label> 
          </a>

          <div className="hamburgerCircle">
            <FontAwesomeIcon icon={faBars} className="hamburgerIcon" />
          </div>
        </div>

        <div className="headerDivider"/>
      </div>



     

        

       
       
        
        

       
    </div>
  );
};


export default Login;
