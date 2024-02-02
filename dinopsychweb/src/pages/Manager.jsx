import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faX, faFile, faPerson, faRightFromBracket, faPersonCirclePlus, faPersonCircleMinus, faEdit, faTrash, faStopwatch, faDeleteLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons';

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png"; 

import "../styles/Manager.css"; 

const Manager = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token");
    const [username, setUsername] = useState(""); 
    const [organizationID, setOrganizationID] = useState(""); 
    const [patientList, setPatientList] = useState(['']); 
    const [selectedPatientIDs, setSelectedPatientIDs] = useState([]); 
    const [selectedPatientInfo, setSelectedPatientInfo] = useState([]); 
    const [isHamburger, setIsHamburger] = useState(false);
    const [selectedState, setSelectedState] = useState(""); 



    const [managerError, setManagerError] = useState(); 

    useEffect(() => {
        setUsername(localStorage.getItem('username') || ''); 
    },[])

    useEffect(() => {
        fetchUserInfo();
    }, [username]);

    useEffect(() => {
        fetchOrganizationUsers(); 
    }, [organizationID])

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('http://10.111.26.70:3001/user-info', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
                body: JSON.stringify({
                    username,
                }),
            });

            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }

            const data = await response.json();
            setOrganizationID(data[0].organizationid === 'null' ? false : data[0].organizationid);
        } catch (error) {
            return; 
        }
    }; 

    const fetchOrganizationUsers = async () => {
        try {
            const response = await fetch('http://10.111.26.70:3001/pull-organization-users', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
                body: JSON.stringify({
                    organizationID,
                }),
            });
        
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
        
            const data = await response.json();
            const filteredPatientList = data.patientInfoArray.filter(item => item !== '');
            setPatientList(filteredPatientList);
        } catch (error) {
            return;
        }        
    }; 

    const handleCheckboxChange = (patient) => {
        setSelectedState(false);
        const isSelected = selectedPatientIDs.includes(patient.ptid);

        setSelectedPatientIDs((prevSelected) =>
            isSelected
                ? prevSelected.filter((id) => id !== patient.ptid)
                : [...prevSelected, patient.ptid]
        );
    
        setSelectedPatientInfo((prevSelected) =>
            isSelected
                ? prevSelected.filter((info) => info.id !== patient.ptid)
                : [
                      ...prevSelected,
                      {
                          name: `${patient.ptname}`,
                          id: patient.ptid,
                      },
                  ]
        );
    };

    return (
        <div> 

            {isHamburger && (
                <div className="managerHamburgerPopout"> 
                </div>
            )}

            <div className="managerHeaderContainer">
                <div className="managerTopNavBarContainer"> 

                <a className="managerSkipToContent"> 
                    <img className="managerLogo" src={DinoLabsLogoWhite} alt="Dino Labs Logo"/>
                    <label className="managerHeader">
                        Dino Psych
                    </label> 
                </a>

                <button className="managerHamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
                    <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="managerHamburgerIcon" />
                </button>
                </div>

                {!isHamburger && (
                    <div className="managerHeaderDivider"/>
                )}

                {isHamburger && (
                    <div className="managerHamburgerContent">

                        <br/>
                        <br/>
                        
                        <button className="navigationButtonWrapper">
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faFile} className="navigationButtonIcon"/>
                                Dashboard
                            </div>   

                            <div className="navigationButtonDivider"/>
                        </button>

                        <button className="navigationButtonWrapper">
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
                    <div className="managerTableWrapper">
                        <div className="managerTableContainer">
                            <table className="managerControlTable">
                                <thead className="managerControlHeaders">
                                    <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Patient ID</th>
                                    <th>Device ID</th>
                                    <th>Sex</th>
                                    <th>Age</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patientList.filter(item => item !== '').map((patient, index) => (
                                    <tr className="managerControlContent" key={index}>
                                        <td>
                                        <input
                                            className="managerControlCheckbox"
                                            type="checkbox"
                                            onChange={() => handleCheckboxChange(patient)}
                                        />
                                        </td>
                                        <td>{patient.ptname}</td>
                                        <td>{patient.ptid}</td>
                                        <td>{patient.devid}</td>
                                        <td>{patient.ptsex === 'M' ? 'Male' : 'Female'}</td>
                                        <td>{patient.ptage} yo</td>

                                    </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="managerControlTableNavBar">
                                <button className="managerControlTableNavBarButton"> 
                                        <FontAwesomeIcon icon={faPersonCirclePlus} className="managerControlTableNavBarIconLeading"/> 
                                </button>
                                <button className="managerControlTableNavBarButton"  disabled={selectedPatientIDs.length === 1 ? false : true}> 
                                        <FontAwesomeIcon icon={faPersonCircleMinus} className="managerControlTableNavBarIconLeading" style={{'opacity': selectedPatientIDs.length === 1 ? 1 : 0.8}}/> 
                                </button>
                                <button className="managerControlTableNavBarButton"> 
                                        <FontAwesomeIcon icon={faEdit} className="managerControlTableNavBarIconTrailing"/> 
                                </button>
                                <button className="managerControlTableNavBarButton"> 
                                        <FontAwesomeIcon icon={faTrashCan} className="managerControlTableNavBarIconTrailing"/> 
                                </button>
                                
                            </div>
                        </div>

                        <div className="managerOperationsCard">

                            <label className="operationsHeader"> 
                                Enroll New Patient
                            </label> 

                            <div className="operationsNameFlex"> 
                                <input className="operationsTwoSplitInput" placeholder={"First Name"}/>
                                <input className="operationsTwoSplitInput" placeholder={"Last Name"}/>
                            </div>
                            <div className="operationsNameFlex"> 
                                <input className="operationsInput" placeholder={"Email"}/>
                                <div className="patientPictureUpload">
                                    <label className="patientImageText" htmlFor="imageUpload">Choose a Photo</label>
                                    <input
                                        className="patientPicture"
                                        type="file"
                                        id="imageUpload"
                                        accept="image/*"
                                    />
                                </div>
                            </div>
                            <div className="operationsNameFlex"> 
                                <input className="operationsThreeSplitInput" placeholder={"Height"} type={"number"}/>
                                <input className="operationsThreeSplitInput" placeholder={"Weight"} type={"number"}/>
                                <select className="operationsSelect" placeholder={"Sex"}>
                                    <option className="operationsSelect" value="" hidden={true}></option>
                                    <option className="operationsSelect" value="M">Male</option>
                                    <option className="operationsSelect" value="F">Female</option>
                                </select> 
                            </div>

                            <button className="enrollPatientButton"> 
                                Confirm Enrollment 
                            </button>

                            <button className="cancelOperationButton"> 
                                Cancel Enrollment
                            </button>

                            <div className="managerError">{/*loginError*/}</div>

                        </div>
                    </div>
                )}

                {!isHamburger && (
                     <div className="managerTableWrapper">
                        <div className="managerDemographicsContainer">


                        </div>
                    </div>
                )}

                

            

                {!isHamburger && (
                    <div className="managerNavigationFlex"> 
                    </div>
                )}
                
            </div>

            



        </div>
    );
}; 

export default Manager; 