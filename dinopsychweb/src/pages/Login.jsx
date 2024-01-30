import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png";

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
     

        {/*<img src={DinoLabsLogoWhite}/>*/}

       
       
        
        

       
    </div>
  );
};


export default Login;
