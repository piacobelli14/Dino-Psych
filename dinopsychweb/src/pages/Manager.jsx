import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { Chart } from "chart.js/auto"; 
import { Pie, Bar } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faX, faFile, faPerson, faRightFromBracket, faPersonCirclePlus, faPersonCircleMinus, faEdit, faTrashCan } from '@fortawesome/free-solid-svg-icons';

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
    const [selectedState, setSelectedState] = useState("enroll"); 
    const [maleCount, setMaleCount] = useState(0); 
    const [femaleCount, setFemaleCount] = useState(0); 
    const [avgMaleHeight, setAvgMaleHeight] = useState(0); 
    const [avgFemaleHeight, setAvgFemaleHeight] = useState(0); 
    const [avgMaleWeight, setAvgMaleWeight] = useState(0); 
    const [avgFemaleWeight, setAvgFemaleWeight] = useState(0);
    const [ageRangeCount, setAgeRangeCount] = useState([]); 
    const ageReordered = ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const sortedAgeRangeCount = ageReordered.map(orderItem => {
        return ageRangeCount.find(item => item.age_range === orderItem) || { age_range: orderItem, count: 0 };
    });

    const [enrollFirstName, setEnrollFirstName] = useState(""); 
    const [enrollLastName, setEnrollLastName] = useState(""); 
    const [enrollEmail, setEnrollEmail] = useState(""); 
    const [enrollImage, setEnrollImage] = useState(""); 
    const [enrollHeight, setEnrollHeight] = useState(""); 
    const [enrollWeight, setEnrollWeight] = useState("");  
    const [enrollSex, setEnrollSex] = useState(""); 
    const [enrollAge, setEnrollAge] = useState("");

    const [firstNamePlaceholder, setFirstNamePlaceholder] = useState(""); 
    const [lastNamePlaceholder, setLastNamePlaceholder] = useState(""); 
    const [emailPlaceholder, setEmailPlaceholder] = useState(""); 
    const [imagePlaceholder, setImagePlaceholder] = useState(""); 
    const [heightPlaceholder, setHeightPlaceholder] = useState(""); 
    const [weightPlaceholder, setWeightPlaceholder] = useState(""); 
    const [sexPlaceholder, setSexPlaceholder] = useState("");
    const [agePlaceholder, setAgePlaceholder] = useState(""); 

    const [editFirstName, setEditFirstName] = useState(""); 
    const [editLastName, setEditLastName] = useState(""); 
    const [editEmail, setEditEmail] = useState(""); 
    const [editImage, setEditImage] = useState(""); 
    const [editHeight, setEditHeight] = useState(""); 
    const [editWeight, setEditWeight] = useState("");  
    const [editSex, setEditSex] = useState(""); 
    const [editAge, setEditAge] = useState("");

    const [isDistribution, setIsDistribution] = useState(false);
    const [isSendSurvey, setIsSendSurvey] = useState(false);

    const [managerError, setManagerError] = useState(); 

    useEffect(() => {
        setUsername(localStorage.getItem('username') || ''); 
    },[])

    useEffect(() => {
        fetchUserInfo();
    }, [username]);

    useEffect(() => {
        fetchOrganizationUsers(); 
        fetchDemographicInfo();
    }, [organizationID]);

    const fetchUserInfo = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/user-info', {
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
            const response = await fetch('http://172.20.10.3:3001/pull-organization-users', {
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
        if (selectedState !== "discharge" && selectedState !== "distribution" && selectedState !== "delete") {
            setSelectedState("enroll");    
        }
        setManagerError(""); 
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            const reader = new FileReader();
        
            reader.onloadend = () => {
                const base64Data = reader.result;
                if (selectedState === "enroll") {
                    setEnrollImage(base64Data);
                } else {
                    setEditImage(base64Data); 
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const getSelectedUserPlaceholders = async () => {
        if (selectedPatientIDs.length === 1) {
            try {
                const response = await fetch('http://172.20.10.3:3001/selected-user-placeholders', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `${token}`,
                    },
                    body: JSON.stringify({ patientID: selectedPatientIDs[0], organizationID }),
                });
    
                const data = await response.json();
                const userData = data.patientInfo[0];
                setFirstNamePlaceholder(userData.ptname.split(' ')[0]);
                setLastNamePlaceholder(userData.ptname.split(' ')[1]);
                setAgePlaceholder(userData.ptage);
                setSexPlaceholder(userData.ptsex);
                setHeightPlaceholder(userData.ptheight);
                setWeightPlaceholder(userData.ptweight);
                setImagePlaceholder(userData.ptimage);
                setEmailPlaceholder(userData.ptemail);
            } catch (error) {
                return;
            }
        } else {
            setFirstNamePlaceholder(""); 
            setLastNamePlaceholder(""); 
            setAgePlaceholder(""); 
            setSexPlaceholder(""); 
            setHeightPlaceholder(""); 
            setWeightPlaceholder(""); 
            setImagePlaceholder(""); 
            setEmailPlaceholder("");
        }
    };

    const handleEnroll = async () => {
        const newUserData = {
            organizationID: organizationID, 
            firstName: enrollFirstName, 
            lastName: enrollLastName, 
            age: enrollAge, 
            sex: enrollSex, 
            height: enrollHeight, 
            weight: enrollWeight, 
            image: enrollImage || "default", 
            email: enrollEmail,
        };
    
        if (enrollFirstName != "" && enrollLastName != "" && enrollAge != "" && enrollSex != "" &&  enrollHeight != "" && enrollWeight != "" && enrollEmail != "") {
            try {
                const response = await fetch('http://172.20.10.3:3001/enroll-user', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `${token}`,
                    },
                    body: JSON.stringify(newUserData),
                });
    
                if (response.status === 200) {
                    window.location.reload();
                }
                await response.json();
            } catch (error) {
                return;
            }
        } else {
            setManagerError('Please fill in all fields.')
        }
    };

    const handleEdit = async () => {
        const editUserData = {
            organizationID: organizationID, 
            patientID: selectedPatientIDs[0], 
            firstName: editFirstName ? editFirstName : firstNamePlaceholder, 
            lastName: editLastName ? editLastName : lastNamePlaceholder,  
            age: editAge ? parseInt(editAge) : parseInt(agePlaceholder), 
            sex: editSex ? editSex : sexPlaceholder, 
            height: editHeight ? parseInt(editHeight) : parseInt(heightPlaceholder), 
            weight: editWeight ? parseInt(editWeight) : parseInt(weightPlaceholder), 
            image: editImage ? editImage : imagePlaceholder,
            email: editEmail ? editEmail : emailPlaceholder,
        };
    
        try {
            const response = await fetch('http://172.20.10.3:3001/edit-user', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`,
                },
                body: JSON.stringify(editUserData),
            });

            if (response.status === 200)  {
                window.location.reload();
            } 
            await response.json();
        } catch (error) {
            return;
        }
    }; 

    const handleDischarge = async () => {
        const isConfirmed = window.confirm(
            `Are you sure you want to archive these patients and all of their data?\n\n${selectedPatientInfo.map((patient, index) => `${patient.name} - (ID: ${patient.id})`).join('\n\n')}\n\nThis action can not be undone.`
        );
    
        if (isConfirmed) {
            const dischargeUserData = {
                organizationID: organizationID,
                patientIDs: selectedPatientIDs
            };
    
            try {
                const response = await fetch('http://172.20.10.3:3001/discharge-user', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `${token}`,
                    },
                    body: JSON.stringify(dischargeUserData),
                });

                if (response.status === 200)  {
                    window.location.reload();
                } 
                await response.json();
            } catch (error) {
                return; 
            }
        }
    };

    const handleDeletion = async () => {
        const isConfirmed = window.confirm(
            `Are you sure you want to permanently delete these patients and all of their data?\n\n${selectedPatientInfo.map((patient, index) => `${patient.name} - (ID: ${patient.id})`).join('\n\n')}\n\nThis action can not be undone.`
        );
    
        if (isConfirmed) {
            const deleteUserData = {
                organizationID: organizationID,
                patientIDs: selectedPatientIDs
            };
    
            try {
                const response = await fetch('http://172.20.10.3:3001/delete-user', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `${token}`,
                    },
                    body: JSON.stringify(deleteUserData),
                });
    
                if (response.status === 200) {
                    window.location.reload();
                } 
                await response.json();
            } catch (error) {
                return;
            }
        }
    };

    const fetchDemographicInfo = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/user-demographic-info', {
                method: "POST",
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
            setMaleCount(data.maleCount);
            setFemaleCount(data.femaleCount);
            setAgeRangeCount(data.ageDistribution);
            setAvgMaleHeight(data.maleAvgHeight); 
            setAvgFemaleHeight(data.femaleAvgHeight); 
            setAvgMaleWeight(data.maleAvgWeight); 
            setAvgFemaleWeight(data.femaleAvgWeight); 
        } catch (error) {
            return;
        }        
    };

    const sexChartData = {
        labels: ['Male', 'Female'],
        datasets: [
            {
                label: 'Gender Distribution',
                data: [maleCount, femaleCount],
                backgroundColor: [
                    '#5669CA',
                    '#B557CD',
                ],
                borderColor: [
                    '#5669CA',
                    '#B557CD',
                ],
                borderWidth: 1,
            },
        ],
    };
     
    const sexChartOptions = {
        plugins: {
            legend: {
                display: false 
            }
        },
        cutout: '50%' 
    };
    
    const ageChartData = {
        labels: sortedAgeRangeCount.map(item => item.age_range),
        datasets: [{
            label: 'Age Range Distribution',
            data: sortedAgeRangeCount.map(item => parseInt(item.count, 10)), 
            backgroundColor: '#5669CA',
        }]
    };

    const ageChartOptions = {
        scales: {
        y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1, 
            },
            grid: {
              display: false, 
              drawBorder: true, 
            },
            border: {
                lineWidth: 2,
                color: 'grey',
            }
          },
          x: {
            grid: {
              display: false,
              drawBorder: false, 
            },
            border: {
                lineWidth: 2,
                color: 'grey',
            }
          }
        },
        plugins: {
          legend: {
            display: false, 
          }
        },
        elements: {
          line: {
            borderWidth: 0 
          },
          point: {
            radius: 0 
          }
        }
    };

    const heightChartData = {
        labels: ["Avg. Male Height", "Avg. Female Height"],
        datasets: [{
            label: 'Average Heights',
            data: [avgMaleHeight, avgFemaleHeight], 
            backgroundColor: ['#5669CA', '#B557CD'],
        }]
    };

    const heightChartOptions = {
        indexAxis: 'y',
        scales: {
            y: {
                grid: {
                    display: false,
                    drawBorder: false, 
                },
                ticks: {
                    display: false, 
                },
                border: {
                    lineWidth: 2,
                    color: 'grey',
                }
            }, 
            x: {
                grid: {
                    display: false,
                    drawBorder: false, 
                },
                ticks: {
                    display: false, 
                }
            }
        },
        plugins: {
            legend: {
                display: false, 
            }
        },
        elements: {
            line: {
                borderWidth: 0 
            },
            point: {
                radius: 0 
            }
        }
    };

    const weightChartData = {
        labels: ["Avg. Male Weight", "Avg. Female Weight"],
        datasets: [{
            label: 'Average Heights',
            data: [avgMaleWeight, avgFemaleWeight], 
            backgroundColor: ['#5669CA', '#B557CD'],
        }]
    };

    const weightChartOptions = {
        indexAxis: 'y',
        scales: {
            y: {
                grid: {
                    display: false,
                    drawBorder: false, 
                },
                ticks: {
                    display: false, 
                },
                border: {
                    lineWidth: 2,
                    color: 'grey',
                }
            }, 
            x: {
                grid: {
                    display: false,
                    drawBorder: false, 
                },
                ticks: {
                    display: false, 
                }
            }
        },
        plugins: {
            legend: {
                display: false, 
            }
        },
        elements: {
            line: {
                borderWidth: 0 
            },
            point: {
                radius: 0 
            }
        }
    };
    
    const handleSurveyDistribution = async () => {
        if (selectedPatientIDs.length >= 1) {
          try {
            const response = await fetch('http://172.20.10.3:3001/distribute-survey', {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
              },
              body: JSON.stringify({
                organizationID,
                patientIDs: selectedPatientIDs,
              }),
            });
      
            if (response.status !== 200) {
              throw new Error(`Internal Server Error`);
            } else {
              setIsDistribution(false);
              setIsSendSurvey(false);
              window.location.reload();
            }
          } catch (error) {
            return; 
          }
        }
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
                        
                        <button className="navigationButtonWrapper" onClick={()=> navigate('/dashboard')}>
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faFile} className="navigationButtonIcon"/>
                                Dashboard
                            </div>   

                            <div className="navigationButtonDivider"/>
                        </button>

                        <button className="navigationButtonWrapper" onClick={()=> navigate('/profile')}>
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
                            <table className="managerControlTable" style={{"overflow": "scroll"}}>
                                <thead className="managerControlHeaders">
                                    <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Patient ID</th>
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
                                        <td>{patient.ptsex === 'M' ? 'Male' : 'Female'}</td>
                                        <td>{patient.ptage} yo</td>

                                    </tr>
                                    ))}
                                </tbody>
                                
                            </table>

                            <div className="managerControlTableNavBar">
                                <button className="managerControlTableNavBarButton" onClick={()=> {
                                    setSelectedState("enroll");
                                    setManagerError("");
                                }}> 
                                        <FontAwesomeIcon icon={faPersonCirclePlus} className="managerControlTableNavBarIconLeading"/> 
                                </button>
                                <button className="managerControlTableNavBarButton"  disabled={selectedPatientIDs.length > 0 ? false : true} onClick={()=> {
                                    setSelectedState("discharge"); 
                                    setManagerError("");
                                }}> 
                                        <FontAwesomeIcon icon={faPersonCircleMinus} className="managerControlTableNavBarIconLeading" style={{'opacity': selectedPatientIDs.length > 0 ? 1 : 0.6}}/> 
                                </button>
                                <button className="managerControlTableNavBarButton"  disabled={selectedPatientIDs.length > 0 ? false : true} onClick={()=> {
                                    setSelectedState("distribution"); 
                                    setManagerError("");
                                }}> 
                                        <FontAwesomeIcon icon={faFile} className="managerControlTableNavBarIconLeading" style={{'opacity': selectedPatientIDs.length > 0 ? 1 : 0.6}}/> 
                                </button>
                                <button className="managerControlTableNavBarButton" disabled={selectedPatientIDs.length === 1 ? false : true}  onClick={()=> {
                                    getSelectedUserPlaceholders();
                                    setSelectedState("edit");
                                    setManagerError("");
                                }}> 
                                        <FontAwesomeIcon icon={faEdit} className="managerControlTableNavBarIconTrailing" style={{'opacity': selectedPatientIDs.length === 1 ? 1 : 0.6}}/> 
                                </button>
                                <button className="managerControlTableNavBarButton" disabled={selectedPatientIDs.length > 0 ? false : true}  onClick={()=> {
                                    setSelectedState("delete");
                                    setManagerError(""); 
                                }}> 
                                        <FontAwesomeIcon icon={faTrashCan} className="managerControlTableNavBarIconTrailing" style={{'opacity': selectedPatientIDs.length > 0 ? 1 : 0.6}}/> 
                                </button>
                            </div>
                        </div>

                        <div className="managerOperationsCard">

                            <div className="operationsContent">

                                {selectedState === "enroll" && (
                                    <label className="operationsHeader"> 
                                        Enroll New Patient
                                    </label> 
                                )}
                               
                                {selectedState === "discharge" && (
                                    <label className="operationsHeader"> 
                                        Discharge Patients
                                    </label> 
                                )}

                                {selectedState === "distribution" && (
                                    <label className="operationsHeader"> 
                                        Distribute Surveys
                                    </label> 
                                )}

                                {selectedState === "edit" && (
                                    <label className="operationsHeader"> 
                                        Edit Patient Info
                                    </label> 
                                )}

                                {selectedState === "delete" && (
                                    <label className="operationsHeader"> 
                                        Delete Patients
                                    </label> 
                                )}

                                {selectedState === "enroll" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsTwoSplitInput" placeholder={"First Name"} value={enrollFirstName} onChange={(e)=> setEnrollFirstName(e.target.value)}/>
                                        <input className="operationsTwoSplitInput" placeholder={"Last Name"} value={enrollLastName} onChange={(e)=> setEnrollLastName(e.target.value)}/>
                                    </div>
                                )}
                                {selectedState === "enroll" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsInput" placeholder={"Email"} value={enrollEmail} onChange={(e)=> setEnrollEmail(e.target.value)}/>
                                        <div className="patientPictureUpload" style={{"backgroundColor": enrollImage ? "#2D3436" : "rgba(255,255,255,0.0)"}}>
                                            <label className="patientImageText" htmlFor="imageUpload">Choose a Photo</label>
                                            <input
                                                className="patientPicture"
                                                type="file"
                                                id="imageUpload"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedState === "enroll" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsThreeSplitInput" placeholder={"Height"} type={"number"} value={enrollHeight} onChange={(e)=> setEnrollHeight(e.target.value)}/>
                                        <input className="operationsThreeSplitInput" placeholder={"Weight"} type={"number"} value={enrollWeight} onChange={(e)=> setEnrollWeight(e.target.value)}/>
                                        <input className="operationsThreeSplitInput" placeholder={"Age"} type={"number"} value={enrollAge} onChange={(e)=> setEnrollAge(e.target.value)}/>
                                        <select className="operationsSelect" placeholder={"Sex"} value={enrollSex} onChange={(e)=> setEnrollSex(e.target.value)}>
                                            <option className="operationsSelect" value="" hidden={true}></option>
                                            <option className="operationsSelect" value="M">Male</option>
                                            <option className="operationsSelect" value="F">Female</option>
                                        </select> 
                                    </div>
                                )}

                                {selectedState === "edit" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsTwoSplitInput" placeholder={firstNamePlaceholder} value={editFirstName} onChange={(e)=> setEditFirstName(e.target.value)}/>
                                        <input className="operationsTwoSplitInput" placeholder={lastNamePlaceholder} value={editLastName} onChange={(e)=> setEditLastName(e.target.value)}/>
                                    </div>
                                )}
                                {selectedState === "edit" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsInput" placeholder={emailPlaceholder} value={editEmail} onChange={(e)=> setEditEmail(e.target.value)}/>
                                        <div className="patientPictureUpload" style={{"backgroundColor": imagePlaceholder ? "#2D3436" : "rgba(255,255,255,0.0)"}}>
                                            <label className="patientImageText" htmlFor="imageUpload">Choose a Photo</label>
                                            <input
                                                className="patientPicture"
                                                type="file"
                                                id="imageUpload"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedState === "edit" && (
                                    <div className="operationsNameFlex"> 
                                        <input className="operationsThreeSplitInput" placeholder={heightPlaceholder} type={"number"} value={editHeight} onChange={(e)=> setEditHeight(e.target.value)}/>
                                        <input className="operationsThreeSplitInput" placeholder={weightPlaceholder} type={"number"} value={editWeight} onChange={(e)=> setEditWeight(e.target.value)}/>
                                        <input className="operationsThreeSplitInput" placeholder={agePlaceholder} type={"number"} value={editAge} onChange={(e)=> setEditAge(e.target.value)}/>
                                        <select className="operationsSelect" placeholder={sexPlaceholder} value={editSex} onChange={(e)=> setEditSex(e.target.value)}>
                                            <option className="operationsSelect" value="" hidden={true}></option>
                                            <option className="operationsSelect" value="M">Male</option>
                                            <option className="operationsSelect" value="F">Female</option>
                                        </select> 
                                    </div>
                                )}

                                {(selectedState === "discharge" || selectedState === "delete") && (
                                    <div className="operationsRemovalListWrapper">
                                        <ul className="operationsRemovalList">
                                            {selectedPatientInfo.map((patient, index) => (
                                                <li className="removalListItem" key={index}>
                                                    <div className="removalListItemHeader">{patient.name}</div>
                                                    <div className="removalListItemSubheader">{`ID: ${patient.id}`}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedState === "distribution" && (
                                    <div className="operationsRemovalListWrapper">
                                        <button className="distributeXButton" onClick={() => handleDistributionCancel()}>
                                            <span>&times;</span>
                                        </button>

                                        <ul className="distributionListWrapper">
                                            {selectedPatientInfo.map((patient, index) => (
                                                <li key={index}>
                                                <div className="dischargeListItemHeader">{patient.name}</div>
                                                <div className="dischargeListItemSubheader">{`ID: ${patient.id}`}</div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {selectedState === "enroll" && (
                                    <button className="enrollPatientButton" onClick={handleEnroll}> 
                                        Confirm Enrollment 
                                    </button>
                                )}

                                {selectedState === "discharge" && (
                                    <button className="enrollPatientButton" onClick={handleDischarge}> 
                                        Confirm Discharge 
                                    </button>
                                )}

                                {selectedState === "distribution" && (
                                    <button className="enrollPatientButton" onClick={handleSurveyDistribution}> 
                                        Confirm Distribution 
                                    </button>
                                )}

                                {selectedState === "edit" && (
                                    <button className="enrollPatientButton" onClick={handleEdit}> 
                                        Confirm Edits 
                                    </button>
                                )}

                                {selectedState === "delete" && (
                                    <button className="enrollPatientButton" onClick={handleDeletion}> 
                                        Confirm Deletion
                                    </button>
                                )}

                                <button className="cancelOperationButton" onClick={()=> window.location.reload()}> 
                                    Cancel
                                </button>

                                <div className="managerError">{managerError}</div>
                            </div>

                        </div>
                    </div>
                )}

                {!isHamburger && (
                     <div className="managerTableWrapper">
                        <div className="managerDemographicsContainerAge">
                            <div className="demographicsAgeChartWrapper">
                           
                                <div className="demographicsAgeChartContainer"> 
                                    <Bar data={ageChartData} options={ageChartOptions}/>
                                </div>

                                <div className="demographicsBreakdownListWrapper">
                                    <th className="demographicsListHeader">Age Distribution</th>
                                    
                                    <ul className="demographicsBreakdownList">
                                        {ageRangeCount.map((item, index) => (
                                            <li className="demographicsListItem" key={index}>
                                                {item.age_range}: {item.count}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="managerDemographicsContainerSex">
                            <div className="demographicsSexChartWrapper"> 

                                <div className="demographicsSexChartContainer"> 
                                    <Pie data={sexChartData} options={sexChartOptions}/>
                                </div>

                                <div className="demographicsBreakdownListWrapper">
                                    <th className="demographicsListHeader">Sex Distribution</th>

                                    <ul className="demographicsBreakdownList">
                                        <li className="demographicsListItem">
                                            {"Male"}: {maleCount}
                                        </li>

                                        <li className="demographicsListItem">
                                            {"Female"}: {femaleCount}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="managerDemographicsBlock"> 
                            <div className="managerBodyContainer">
                                <div className="demographicsBodyChartContainer"> 
                                    <Bar data={heightChartData} options={heightChartOptions}/>
                                </div>
                                
                                <div className="demographicsBreakdownListWrapper">
                                    <th className="demographicsListHeader">Average Height</th>

                                    <ul className="demographicsBreakdownList">
                                        <li className="demographicsListItem">
                                            {"Male"}: {parseFloat(avgMaleHeight).toFixed(1)} ins 
                                        </li>

                                        <li className="demographicsListItem">
                                            {"Female"}: {parseFloat(avgFemaleHeight).toFixed(1)} ins
                                        </li>
                                    </ul>
                                </div>

                            </div>

                            <div className="managerBodyContainer">
                                <div className="demographicsBodyChartContainer"> 
                                    <Bar data={weightChartData} options={weightChartOptions}/>
                                </div>

                                <div className="demographicsBreakdownListWrapper">
                                    <th className="demographicsListHeader">Average Weight</th>

                                    <ul className="demographicsBreakdownList">
                                        <li className="demographicsListItem">
                                            {"Male"}: {parseFloat(avgMaleWeight).toFixed(1)} lbs 
                                        </li>

                                        <li className="demographicsListItem">
                                            {"Female"}: {parseFloat(avgFemaleWeight).toFixed(1)} lbs
                                        </li>
                                    </ul>
                                </div>

                            </div>

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