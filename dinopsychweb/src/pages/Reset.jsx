import { useState, useEffect } from 'react'; 
import { useNavigate } from "react-router-dom"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faEye, faEyeSlash, faPerson, faIdCard } from '@fortawesome/free-solid-svg-icons';

import '../styles/Reset.css'


const Reset = () => {
    const navigate = useNavigate(); 

    const [isEmail, setIsEmail] = useState(true); 
    const [isCode, setIsCode] = useState(false);
    const [isReset, setIsReset] = useState(false); 
    const [newPassword, setNewPassword] = useState(""); 
    const [confirmPassword, setConfirmPassword] = useState(""); 
    const [newPasswordVisible, setNewPasswordVisible] = useState(false); 
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); 

    const [resetError, setResetError] = useState(""); 

    const [resetEmail, setResetEmail] = useState(""); 
    const [resetCode, setResetCode] = useState(""); 
    const [checkedResetCode, setCheckedResetCode] = useState(""); 

    useEffect(() => {
        if (resetCode === checkedResetCode && resetCode !== "") {
          setIsCode(false);
          setIsReset(true);
        }
      }, [resetCode, checkedResetCode]);
    

    const handleEmail = async () => {
        try {
            setResetCode("xxx");
    
            const response = await fetch("http://172.20.10.3:3001/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: resetEmail }),
            });
    
            if (response.status === 200) {
                const jsonResponse = await response.json();
                const code = jsonResponse.data.resetCode;
                setCheckedResetCode(code);
                setIsEmail(false); 
                setIsCode(true); 
                setResetError(""); 
            } else if (response.status === 401) {
                setResetError("That email is not in our system.");
            } else {
                return;
            }
        } catch (error) {
            return;
        }
    };
    
    const handlePassword = async () => {
        setResetError("");
    
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>\-]/.test(newPassword);
        const isLengthValid = newPassword.length >= 8;
    
        if (!isLengthValid) {
            setResetError("Password must be at least 8 characters long.");
        } else if (!hasUpperCase) {
            setResetError("Password must contain at least 1 uppercase letter.");
        } else if (!hasLowerCase) {
            setResetError("Password must contain at least 1 lowercase letter.");
        } else if (!hasNumber) {
            setResetError("Password must contain at least 1 number.");
        } else if (!hasSpecialChar) {
            setResetError("Password must contain at least 1 special character.");
        } else if (newPassword !== confirmPassword) {
            setResetError("Passwords do not match.");
        } else {
            try {
                const response = await fetch("http://172.20.10.3:3001/change-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ newPassword, email: resetEmail }),
                });
    
                if (response.status === 200) {
                    navigate('/login');
                }
            } catch (error) {
                return;
            }
        }
    };

    return (
        <div> 

            <div className="resetHeaderContainer">
                <div className="resetTopNavBarContainer"> 
                    <a className="resetBackButton" href={"/login"}> 
                        <FontAwesomeIcon icon={faArrowLeft} className="resetBackArrowIcon"/> 
                        <label className="resetHeader"> 
                            Back to Login
                        </label> 
                    </a> 
                </div>
                <div className="resetHeaderDivider"/>
            </div>

            <div className="resetBlock"> 

                {isEmail && (
                    <input className="resetInput" placeholder={"Enter Your Email"} onChange={(e) => setResetEmail(e.target.value)}/>
                )}

                {isEmail && (
                    <button className="resetContinueButton" onClick={handleEmail}>
                        Continue
                        <FontAwesomeIcon icon={faArrowRight} className="resetNextArrowIcon"/>
                    </button>
                )}

                {isCode && (
                    <input className="resetInput" placeholder={"Enter Your Six Digit Code"} onChange={(e) => setResetCode(e.target.value)}/>
                )}

                {isReset && (
                    <div className="registerPasswordInputWrapper"> 
                        <input className="passwordInput" type={newPasswordVisible ? "text" : "password"} placeholder={"New Password"} onChange={(e) => setNewPassword(e.target.value)}/>
                        <FontAwesomeIcon
                            icon={newPasswordVisible ? faEyeSlash : faEye}
                            onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                            className="registerToggleIcon"
                        />
                    </div>
                )}
                
                {isReset && (
                    <div className="registerPasswordInputWrapper"> 
                        <input className="passwordInput" type={confirmPasswordVisible ? "text" : "password"} placeholder={"Confirm Password"} onChange={(e) => setConfirmPassword(e.target.value)}/>
                        <FontAwesomeIcon
                            icon={confirmPasswordVisible ? faEyeSlash : faEye}
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className="registerToggleIcon"
                        />
                    </div>
                )}

                {isReset && (
                    <button className="registerContinueButton" onClick={handlePassword}>
                        <FontAwesomeIcon icon={faIdCard} className="registerPersonIcon"/>
                        Set New Password
                    </button>
                )}

                <div className="registerError">{resetError}</div>    
                
            </div>

            


        </div>
    );
}; 

export default Reset; 