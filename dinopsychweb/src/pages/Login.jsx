import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faX } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'; 
import { faPerson } from "@fortawesome/free-solid-svg-icons";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png";

import "../styles/Login.css"

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHamburger, setIsHamburger] = useState(false); 
  const [isEmail, setIsEmail] = useState(false); 
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState("");


  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  }, []);

  const handleLogin = async () => {
    try {
        const response = await fetch('http://172.20.10.3:3001/login', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (response.status === 200) {
          const data = await response.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          navigate("/manager");
        } else {
          setLoginError('That username and/or password is incorrect.')
        }
    } catch (error) {
      return;
    }
  };

  return (
    <div>

      {isHamburger && (
        <div className="hamburgerPopout"> 
        </div>
      )}

      <div className="loginHeaderContainer">
        <div className="loginTopNavBarContainer"> 

          <a className="loginSkipToContent"> 
            <img className="loginLogo" src={DinoLabsLogoWhite} alt="Dino Labs Logo"/>
            <label className="loginHeader">
              Dino Psych
            </label> 
          </a>

          <button className="hamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
            <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="hamburgerIcon" />
          </button>
        </div>

        <div className="headerDivider"/>

        {isHamburger && (
          <button className="hamburgerLoginButton" onClick={()=> setIsHamburger(!isHamburger)} style={{"backgroundColor": "#2D3436", "color": "#F5F5F5"}}>
              Login
          </button>
        )}

        {isHamburger && (
          <button className="hamburgerLoginButton" onClick={()=> navigate("/register")} style={{"backgroundColor": "#F5F5F5", "color": "#2D3436"}}>
              Sign Up
          </button>
        )}


      </div>

      <div className="loginBlock"> 
        <label className="loginTitle">Log in to Dino Psych</label>

        <div className="loginInputWrapper"> 
          <input className="loginInput" type="text" placeholder={"Email Address"} onChange={(e) => setEmail(e.target.value)}/>
        </div>

        {!isEmail && (
          <button className="loginInputButton" style={{'backgroundColor': '#8884d8'}} onClick={()=> setIsEmail(!isEmail)}>
            <FontAwesomeIcon icon={faEnvelope} className="envelopeIcon"/>
            <label className="loginInputText">Continue with Email</label> 
          </button>
        )}

        {!isEmail && (
          <button className="loginInputButton" style={{'backgroundColor': '#2D3436'}} onClick={()=> navigate("/register")}>
            <FontAwesomeIcon icon={faPerson} className="envelopeIcon"/>
            <label className="loginInputText">Create an Account</label> 
          </button>
        )}

        {!isEmail && (
          <button className="loginSupplementalButton" onClick={()=> navigate("/reset")}>Forgot password? Click here to reset.</button>
        )}

        {isEmail && (
          <div className="loginInputWrapper"> 
            <input className="loginInputPassword" type={passwordVisible ? "text" : "password"} placeholder={"Password"} onChange={(e) => setPassword(e.target.value)}/>
            <FontAwesomeIcon
              icon={passwordVisible ? faEyeSlash : faEye}
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="passwordToggleIcon"
            />
          </div>
        )}

        {isEmail && (
          <button className="loginInputButton" style={{'backgroundColor': '#8884d8'}} onClick={handleLogin}>
            <label className="loginInputText">Sign In</label> 
          </button>
        )}

        <div className="loginError">{loginError}</div>

        {isEmail && (
          <button className="loginSupplementalButton" onClick={()=> setIsEmail(!isEmail)}>
            <span>
              <FontAwesomeIcon icon={faArrowLeft} className="envelopeIcon"/>
            </span>
            Return to Main
          </button>
        )}

      </div>





     

        

       
       
        
        

       
    </div>
  );
};


export default Login;
