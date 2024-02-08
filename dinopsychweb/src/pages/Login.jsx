import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faX, faEnvelope, faPerson, faArrowLeft, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; 

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
        const response = await fetch('http://10.111.26.70:3001/login', {
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
          setLoginError(response.status); 
        }
    } catch (error) {
      return;
    }
  };

  return (
    <div>

      {isHamburger && (
        <div className="loginHamburgerPopout"> 
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

          <button className="loginHamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
            <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="loginHamburgerIcon" />
          </button>
        </div>

        <div className="loginHeaderDivider"/>

        {isHamburger && (
          <button className="loginHamburgerButton" onClick={()=> setIsHamburger(!isHamburger)} style={{"backgroundColor": "#2D3436", "color": "#F5F5F5"}}>
              Login
          </button>
        )}

        {isHamburger && (
          <button className="loginHamburgerButton" onClick={()=> navigate("/register")} style={{"backgroundColor": "#F5F5F5", "color": "#2D3436"}}>
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
          <button className="loginSupplementalButton" onClick={()=> navigate("/reset")}>Forgot password? <span style={{"opacity": "0.9"}}>Click here to reset.</span></button>
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
          <button className="loginSupplementalButton" onClick={()=> {
              setIsEmail(!isEmail); 
              setLoginError("");
            }}
          >
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
