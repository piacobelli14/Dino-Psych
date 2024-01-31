import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faPerson, faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons";

import "../styles/Register.css";

const Register = () => {

    const [isPersonal, setIsPersonal] = useState(true); 
    const [isPassword, setIsPassword] = useState(false); 

    const [firstName, setFirstName] = useState(""); 
    const [lastName, setLastName] = useState(""); 
    const [email, setEmail] = useState(""); 
    const [username, setUsername] = useState(""); 
    const [phone, setPhone] = useState("");
    const [profileImage, setProfileImage] = useState(null); 
    const [newPassword, setNewPassword] = useState(""); 
    const [confirmPassword, setConfImageirmPassword] = useState(""); 
    const [newPasswordVisible, setNewPasswordVisible] = useState(false); 
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); 

    const [registerError, setRegisterError] = useState(""); 

    const formatPhoneNumber = (value) => {
        const numericPhoneValue = value.replace(/\D/g, "");
        const formattedPhoneNumber = numericPhoneValue.replace(
          /^(\d{3})(\d{3})(\d{4})$/,
          "($1) $2-$3"
        );
        return formattedPhoneNumber;
    };

    const handleRegister = async () => {

        if (firstName !== "" && lastName !== "" && email !== "" && username !== "" && phone !== "") {
            if (!/\S+@\S+\.\S+/.test(email)) {
                setRegisterError("Please enter a valid email address.");
                return;
            }
        
            if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(phone)) {
                setRegisterError("Please enter a valid phone number in the format (XXX) XXX-XXXX.");
                return;
            }

            try {
                const response = await fetch("http://172.20.10.3:3001/validate-new-user-info", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        username,
                    }),
                });
        
                if (response.status === 200) {
                    setRegisterError(""); 
                    setIsPersonal(!isPersonal);
                    setIsPassword(!isPassword);
                } else {
                    setRegisterError("There is already an account associated with that email or username.");
                } 
            } catch (error) {
                return;
            }
        } else {
            setRegisterError("Please fill in all fields.")
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result;
            setProfileImage(base64Data);
          };
          reader.readAsDataURL(file);
        }
    };

    return (
        <div>

            <div className="registerHeaderContainer"> 
                <div className="registerTopNavBarContainer">
                    <a className="registerBackButton" href={"/login"}> 
                        <FontAwesomeIcon icon={faArrowLeft} className="registerBackArrowIcon"/>
                        <label className="registerHeader">
                            Back to Login
                        </label> 
                    </a>
                </div>
                <div className="headerDivider"/>
            </div>

            {isPersonal && (
                <div className="registerBlock">
                    <label className="registerTitle">Personal Info</label>

                    <div className="registerNameFlex">
                        <input className="registerInputFlex" placeholder={"First Name"} onChange={(e) => setFirstName(e.target.value)}/>
                        <input className="registerInputFlex" placeholder={"Last Name"} onChange={(e) => setLastName(e.target.value)}/>
                    </div>

                    <input className="registerInput" placeholder={"Email"} onChange={(e) => setEmail(e.target.value)}/>

                    <input className="registerInput" placeholder={"Phone"} value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}/>

                    <input className="registerInput" placeholder={"Username"} onChange={(e) => setUsername(e.target.value)}/>
                    
                    <div className="profilePictureUpload">
                        <label className="profileImageText" htmlFor="imageUpload">Choose a Photo</label>
                        <input
                            className="profilePicture"
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                    
                
                    <button className="registerContinueButton" onClick={handleRegister}>
                        Continue
                        <FontAwesomeIcon icon={faArrowRight} className="registerNextArrowIcon"/>
                    </button>
                </div>
            )}

            {isPassword && (
                <div className="registerBlock">
                    <label className="registerTitle">Set A Password</label>

                    <div className="registerPasswordInputWrapper"> 
                        <input className="passwordInput" type={newPasswordVisible ? "text" : "password"} placeholder={"New Password"} onChange={(e) => setNewPassword(e.target.value)}/>
                        <FontAwesomeIcon
                            icon={newPasswordVisible ? faEyeSlash : faEye}
                            onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                            className="registerToggleIcon"
                        />
                    </div>
                    


                    <div className="registerPasswordInputWrapper"> 
                        <input className="passwordInput" type={confirmPasswordVisible ? "text" : "password"} placeholder={"Confirm Password"} onChange={(e) => setConfirmPassword(e.target.value)}/>
                        <FontAwesomeIcon
                            icon={confirmPasswordVisible ? faEyeSlash : faEye}
                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className="registerToggleIcon"
                        />
                    </div>
                
                    <button className="registerContinueButton" onClick={handleRegister}>
                        <FontAwesomeIcon icon={faPerson} className="registerPersonIcon"/>
                        Create Account
                    </button>
                </div>
            )}

            <div className="registerError">{registerError}</div>


            

                
            

            


        </div>
    );
};

export default Register; 