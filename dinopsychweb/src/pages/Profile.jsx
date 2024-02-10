import {useState, useEffect} from "react"; 
import { useNavigate } from "react-router-dom"; 
import Chart from "chart.js/auto"; 
import { Bar } from 'react-chartjs-2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX, faBars, faRightFromBracket, faPerson, faFile, faPeopleLine, faPencil, faTrashCan, faRegistered } from "@fortawesome/free-solid-svg-icons";

import '../styles/Profile.css'


const Profile = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token"); 
    const [isHamburger, setIsHamburger] = useState(false);
    const [username, setUsername] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [isAdmin, setIsAdmin] = useState('');
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [image, setImage] = useState('');
    const [phone, setPhone] = useState('');
    const [organizationID, setOrganizationID] = useState(null);
    const [organizationName, setOrganizationName] = useState('');
    const [organizationUserCount, setOrganizationUserCount] = useState('');
    const [organizationPatientCount, setOrganizationPatientCount] = useState('');
    const [userTimestampCounts, setUserTimestampCounts] = useState({});
    const [organizationTimestampCounts, setOrganizationTimestampCounts] = useState({});
    const [signInLog, setSignInLog] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [editModeFirstName, setEditModeFirstName] = useState(false);
    const [editModeLastName, setEditModeLastName] = useState(false);
    const [editModeEmail, setEditModeEmail] = useState(false);
    const [editModePhone, setEditModePhone] = useState(false);
    const [createTeamMode, setCreateTeamMode] = useState(false); 
    const [joinTeamMode, setJoinTeamMode] = useState(false); 
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState(''); 
    const [teamMessage, setTeamMessage] = useState(''); 
    const requestAccessBorderColor = notifications.length > 0 ? '#E54B4B' : 'grey';
    
    useEffect(() => {
        setUsername(localStorage.getItem('username') || '');
    }, [])

    useEffect(() => { 
        fetchUserInfo();
        fetchUserUsageData(); 
    }, [username]);

    useEffect(() => {
        if (organizationID) {
            fetchOrganizationInfo();
            fetchOrganizationUsageData();
            fetchOrganizationSignInLog();
        }
    }, [organizationID])

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData();
        }
    }, [isAdmin])

    useEffect(() => {
        if (isAdmin || organizationID !== null) {
            fetchNotifications();
        } 
    }, [isAdmin, organizationID])

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
            setEmail(data[0].email);
            setFirstName(data[0].firstname);
            setLastName(data[0].lastname);
            setImage(data[0].image);
            setPhone(data[0].phone);
            setOrganizationID(data[0].organizationid === 'null' ? false : data[0].organizationid);
            setIsAdmin(data[0].isadmin);
        } catch (error) {
            return; 
        }
    };

    const fetchUserUsageData = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/user-usage-data', {
                method: 'POST',
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
            setUserTimestampCounts(data.timestamps);
        } catch (error) {
            return; 
        }
    };

    const fetchOrganizationInfo = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/organization-info', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({
                    username,
                    organizationID,
                }),
            });
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
    
            const data = await response.json();
            setOrganizationName(data[0].orgname);
            setOrganizationUserCount(data[0].userCount);
            setOrganizationPatientCount(data[0].patientCount);
        } catch (error) {
            return; 
        }
    };

    const fetchOrganizationUsageData = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/organization-usage-data', {
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
            setOrganizationTimestampCounts(data.timestamps);
        } catch (error) {
            return;
        }
    };

    const fetchOrganizationSignInLog = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/organization-signin-log', {
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
            setSignInLog(data.signInsData);
        } catch (error) {
            return;
        }
    };

    const fetchAdminData = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/admin-data', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({
                    username,
                    organizationID,
                }),
            });
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
    
            const data = await response.json();
            setAdminUsers(data.users);
        } catch (error) {
            return;
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/pull-notifications', {
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
            setNotifications(data.requestUsernames);
        } catch (error) {
            return;
        }
    };
    
    const handleCheckboxChange = (username) => {
        const updatedSelectedRows = selectedRows.includes(username)
            ? selectedRows.filter((user) => user !== username)
            : [...selectedRows, username];
        setSelectedRows(updatedSelectedRows);
    };
    
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).format(date);
    };

    const formatPhoneNumber = (value) => {
        const numericPhoneValue = value.replace(/\D/g, "");
        const formattedPhoneNumber = numericPhoneValue.replace(
          /^(\d{3})(\d{3})(\d{4})$/,
          "($1) $2-$3"
        );
    
        return formattedPhoneNumber;
    };

    const handleDelete = async () => {
        const deletedUsernames = selectedRows;
        const selectedUserNames = deletedUsernames.map((username) => {
            const user = adminUsers.find((user) => user.username === username);
            return `- ${user.firstname} ${user.lastname} (${user.username})`;
        });
        const confirmationMessage = `Are you sure you want to delete the selected users?\n\n${selectedUserNames.join('\n')}\n\nThis action can not be undone.`;
        const confirmed = window.confirm(confirmationMessage);
        if (!confirmed) {
            return;
        }
    
        const updatedAdminUsers = adminUsers.filter((user) => !deletedUsernames.includes(user.username));
        setAdminUsers(updatedAdminUsers);
    
        try {
            const response = await fetch('http://172.20.10.3:3001/remove-admin-users', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ deletedUsernames }),
            });
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
        } catch (error) {
            return;
        }
    };

    const handleEditClickFirstName = () => {
        setEditModeFirstName(!editModeFirstName);
    };

    const handleEditClickLastName = () => {
        setEditModeLastName(!editModeLastName);
    };

    const handleEditClickEmail = () => {
        setEditModeEmail(!editModeEmail);
    };

    const handleEditClickPhone = () => {
        setEditModePhone(!editModePhone);
    };

    const handleSaveClickFirstName = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/edit-first-name', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, firstName }),
            });
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
            setEditModeFirstName(false);
        } catch (error) {
            return; 
        }
    };

    const handleSaveClickLastName = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/edit-last-name', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, lastName }),
            })
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
            setEditModeLastName(false);
        } catch (error) {
            return; 
        }
    };

    const handleSaveClickEmail = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/edit-email', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, email }),
            })
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
            setEditModeEmail(false);
        } catch (error) {
            return; 
        }
    }; 

    const handleSaveClickPhone = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/edit-phone', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, phone }),
            })
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }
            setEditModePhone(false);
        } catch (error) {
            return; 
        }
    }; 

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
    
        if (file) {
            const reader = new FileReader();
    
            reader.onloadend = async () => {
                const base64Data = reader.result;
                setImage(base64Data);
    
                try {
                    const response = await fetch('http://172.20.10.3:3001/edit-image', {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `${token}`, 
                        },
                        body: JSON.stringify({ username, image: base64Data }),
                    });
    
                    if (response.status !== 200) {
                        throw new Error(`Internal Server Error`);
                    }
                    e.target.value = '';
                } catch (error) {
                   return;
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleRoleChange = (username, newRole) => {
        const updatedAdminUsers = adminUsers.map((user) =>
            user.username === username ? { ...user, isadmin: newRole } : user
        );
        setAdminUsers(updatedAdminUsers);
    };

    const handleSaveChanges = async () => {
        const selectedUsernames = selectedRows;
    
        if (selectedUsernames.length === 0) {
            alert('No users selected for permission change.');
            return;
        }
    
        const selectedUserNames = selectedUsernames.map((username) => {
            const user = adminUsers.find((user) => user.username === username);
            return user ? `- ${user.firstname} ${user.lastname} (${user.username})` : '';
        });
    
        const confirmationMessage = `Are you sure you want to change the permissions of the following users?\n\n${selectedUserNames.join('\n')}`;
        const confirmed = window.confirm(confirmationMessage);
    
        if (!confirmed) {
            return;
        }
    
        const updatedAdminUsers = adminUsers;
    
        try {
            const response = await fetch('http://172.20.10.3:3001/update-admin-users', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ adminUsers: updatedAdminUsers }),
            });
    
            if (response.status !== 200) {
                throw new Error(`Internal Server Error`);
            }

        } catch (error) {
            console.error('Error updating admin users:', error);
        }
    };

    const handleConfirm = async (notificationUsername) => {
        try {
            const response = await fetch('http://172.20.10.3:3001/confirm-access', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ notificationUsername, organizationID }),
            });
    
            if (response.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            return;
        }
    };

    const handleDeny = async (notificationUsername) => {
        try {
            const response = await fetch('http://172.20.10.3:3001/deny-access', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ notificationUsername, organizationID }),
            });
    
            if (response.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            return;
        }
    };

    const handleCreateTeamClick = () => {
        createTeamMode ? setCreateTeamMode(false) : setCreateTeamMode(true); 
        setJoinTeamMode(false);
        setTeamMessage('');
    };

    const handleTeamCreation = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/create-team', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, teamName }),
            });
    
            if (response.status === 401) {
                throw new Error('That team name is either taken or invalid. Please select another.');
            } else if (response.status === 500) {
                throw new Error('Internal server error; please try again in a few minutes.');
            } else if (response.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            return;
        }
    };
    
    const handleJoinTeamClick = () => {
        joinTeamMode ? setJoinTeamMode(false) : setJoinTeamMode(true); 
        setCreateTeamMode(false); 
        setTeamMessage('');
    };
    
    const handleTeamJoin = async () => {
        try {
            const response = await fetch('http://172.20.10.3:3001/join-team', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `${token}`, 
                },
                body: JSON.stringify({ username, firstName, lastName, teamCode }),
            });
    
            if (response.status === 401) {
                throw new Error('There are no teams associated with that code. Please try again or contact your admin to get the correct code.');
            } else if (response.status === 500) {
                throw new Error('Internal server error; please try again in a few minutes.');
            } else if (response.status === 200) {
                throw new Error('An access request has been sent to the appropriate administrators!');
            }

        } catch (error) {
            setTeamMessage(error.message);
        }
    };
    
    const getLastSevenDays = () => {
        const today = new Date();
        const dateArray = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            return date.toISOString().split('T')[0];
        });
        return dateArray.reverse();
    };
    
    const userBarChartData = getLastSevenDays().map(date => ({
        timestamp: date.split('-').slice(1).join('-'), 
        count: userTimestampCounts[date] || 0,
    }));
    
    const organizationBarChartData = getLastSevenDays().map(date => ({
        timestamp: date.split('-').slice(1).join('-'),
        count: organizationTimestampCounts[date] || 0,
    }));
    

    const personalLoginsOptions = {
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
            },
            datalabels: {
                display: true,
                align: 'center',
                anchor: 'center',
                formatter: (value) => value || '',
                font: {
                    size: 10
                }
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

    const personalLoginsData = {
        labels: userBarChartData.map(dataPoint => dataPoint.timestamp),
        datasets: [{
            label: `${firstName} ${lastName} - Logins`,
            data: userBarChartData.map(dataPoint => dataPoint.count),
            backgroundColor: '#8884d8'
        }]
    };

    const organizationLoginsOptions = {
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
            },
            datalabels: {
                display: true,
                align: 'center',
                anchor: 'center',
                formatter: (value) => value || '',
                font: {
                    size: 10
                }
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

    const organizationLoginsData = {
        labels: organizationBarChartData.map(dataPoint => dataPoint.timestamp),
        datasets: [{
            label: `${organizationName} (ID: ${organizationID}) - Logins`,
            data: organizationBarChartData.map(dataPoint => dataPoint.count),
            backgroundColor: '#8884d8'
        }]
    };

    useEffect(() => {
        document.body.classList.add('profilePageBody');
        return () => {
          document.body.classList.remove('profilePageBody');
        };
    }, []);

    


    return (
        <div id="profilePageContainer" class="profilePageBody">

            {isHamburger && (
                <div className="loginHamburgerPopout"> 
                </div>
            )}

            <div className="profileHeaderContainer">
                <div className="profileTopNavBarContainer"> 

                    <div className="profileInfoWrapper">
                        <img className="userImage" src={`${image}`} alt="" />
                        <div className="patientInfoBlock">
                            <label className="profileName">{firstName} {lastName}</label>
                            {organizationID && (
                                <label className="profileEmail">{email}</label>
                            )}
                            
                            {organizationID && (
                                <label className="profilePhoneNumber">{formatPhoneNumber(phone)}</label>
                            )}

                        </div>
                    </div>
                    

                    <button className="profileHamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
                        <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="profileHamburgerIcon" />
                    </button>
                </div>

                <div className="profileHeaderDivider"/>

                {isHamburger && (
                    <div className="managerHamburgerContent">

                        <br/>
                        <br/>

                        <button className="navigationButtonWrapper" onClick={()=> navigate('/manager')}>
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faPeopleLine} className="navigationButtonIcon"/>
                                Patients
                            </div>

                            <div className="navigationButtonDivider"/>
                        </button>

                        <button className="navigationButtonWrapper" onClick={()=> navigate('/dashboard')}>
                            <div className="navigationButton">
                                <FontAwesomeIcon icon={faFile} className="navigationButtonIcon"/>
                                Dashboard
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
                    <div className="userControlBlock">
                        <div className="userControlFlex"> 
                            <div className="userEditInfoBlock">
                                <div className="userNameInputFlex"> 
                                    <div className="userInputBlock">
                                        <label className="userInputHeader">First Name</label>
                                        <input className="userInput" placeholder={firstName}/> 
                                        <button className="editButton"> 
                                            <FontAwesomeIcon icon={faPencil} className="editButtonIcon"/> 
                                        </button>
                                    </div>

                                    <div className="userInputBlock">
                                        <label className="userInputHeader">Last Name</label>
                                        <input className="userInput" placeholder={lastName}/> 
                                        <button className="editButton"> 
                                            <FontAwesomeIcon icon={faPencil} className="editButtonIcon"/> 
                                        </button>
                                    </div>
                                </div>

                                <div className="userNameInputFlex"> 
                                    <div className="userInputBlock">
                                        <label className="userInputHeader">Email</label>
                                        <input className="userInput" placeholder={email}/> 
                                        <button className="editButton"> 
                                            <FontAwesomeIcon icon={faPencil} className="editButtonIcon"/> 
                                        </button>
                                    </div>

                                    <div className="userInputBlock">
                                        <label className="userInputHeader">Phone</label>
                                        <input className="userInput" placeholder={formatPhoneNumber(phone)}/> 
                                        <button className="editButton"> 
                                            <FontAwesomeIcon icon={faPencil} className="editButtonIcon"/> 
                                        </button>
                                    </div>
                                </div>

                                <div className="userNameInputFlex"> 
                                    <div className="userInputBlock">
                                        <div className="userPictureUpload">
                                            <label className="userImageText" htmlFor="imageUpload">Choose a Photo</label>
                                            <input
                                                className="Picture"
                                                type="file"
                                                id="imageUpload"
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>

                                    <div className="userInputBlock">
                                        <label className="userInputHeader">Username</label>
                                        <input className="userInput" placeholder={username} disabled={true}/> 
                                        <button className="editButton"> 
                                            <FontAwesomeIcon icon={faPencil} className="editButtonIcon"/> 
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="userEditBlock">
                                <div className="personalSignInBarChartWrapper">
                                    <label className="loginChartTitle">{firstName} {lastName} - Logins</label>
                                    <label className="loginChartSubtitle">Last Seven Days</label>
                                    <Bar className="personalSigninBarChart" data={personalLoginsData} options={personalLoginsOptions} />
                                </div>
                                
                            </div>

                            

                        </div>
                    </div>
                )}


                {!isHamburger && organizationID !== username && (

                    <div className="userControlBlock">
                        <div className="profileSectionDivider"/>
                        <div className="userControlFlex">

                            <div className="organizationInformationBlock">
                                <div className="profileOrganizationName">{organizationName}</div>
                                <div className="profileOrganizationID">Org ID: {organizationID}</div>
                                
                                <div className="profileOrganizationCountLabel">Current Team Members</div>
                                <div className="profileOrganizationCount">{organizationUserCount}</div>

                        
                                <div className="profileOrganizationCountLabel">Current Wearers</div>
                                <div className="profileOrganizationCount">{organizationPatientCount}</div>
                        
                            </div>

                            <div className="siginLogTableContainer">
                                <div className="scrollableTableWrapperSignins">
                                    <table className="signinLogTable">
                                        <thead className="signinLogHeaders">
                                            <tr>
                                                <th>Login</th>
                                                <th>Time</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {signInLog.map((item, index) => (
                                                <tr className="signinLogContent" key={index}>
                                                    <td>{item.firstname} {item.lastname}</td>
                                                    <td>{formatDate(item.timestamp)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="userEditBlock">
                                <div className="personalSignInBarChartWrapper">
                                    <label className="loginChartTitle">{organizationName} (ID: {organizationID}) - Logins</label>
                                    <label className="loginChartSubtitle">Last Seven Days</label>
                                    <Bar className="personalSigninBarChart" data={personalLoginsData} options={personalLoginsOptions} />
                                </div>
                                
                            </div>
                        </div>
                    </div>
                )}


                {!isHamburger && isAdmin && (
                    <div className="userControlBlock">
                        <div className="profileSectionDivider"/>
                        <div className="userControlFlex">
                            <div className="userControlTableContainer">
                                <div className="deleteButtonContainer">
                                    <button className="deleteButton" onClick={handleDelete}>
                                        <FontAwesomeIcon icon={faTrashCan} className="deleteButtonIcon"/>
                                    </button>
                                    <button className="saveChangesButton" onClick={handleSaveChanges}>
                                        Save Changes
                                    </button>
                                </div>

                                <div className="scrollableTableWrapperAdmin">
                                    <table className="userControlTable">
                                        <thead className="signinLogHeaders">
                                            <tr>
                                                <th></th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Username</th>
                                                <th>Role</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {adminUsers.map((item, index) => (
                                                <tr className="signinLogContent" key={index}>
                                                    <td>
                                                    <input
                                                        className="userControlCheckbox"
                                                        type="checkbox"
                                                        onChange={() => handleCheckboxChange(item.username)}
                                                        checked={selectedRows.includes(item.username)}
                                                        disabled={item.username === localStorage.getItem('username') || ''}
                                                    />

                                                    </td>
                                                    <td>{item.firstname} {item.lastname}</td>
                                                    <td>{item.email}</td>
                                                    <td>{item.username}</td>
                                                    <td>
                                                        <select
                                                            className="selectAdmin"
                                                            value={item.isadmin}
                                                            onChange={(e) => handleRoleChange(item.username, e.target.value)}
                                                            disabled={item.username === localStorage.getItem('username') || ''}
                                                        >
                                                            <option className="selectAdmin" value="no">Team Member</option>
                                                            <option className="selectAdmin" value="admin">Administrator</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="accessRequestTableContainer" style={{ 'borderColor': requestAccessBorderColor }}>
                                {notifications.length > 0 && (
                                    <ul className="accessRequestListWrapper">
                                        {notifications.map((notificationUsername, index) => (
                                        <li className="accessRequestList" key={index}>
                                            <div className="accessRequestDisplayWrapper">
                                                <span className="accessNotification">User {notificationUsername} is requesting access to {organizationName}.</span>
                                                <div className="accessRequestFlexWrapper">
                                                    <button className="accessButton" onClick={() => handleConfirm(notificationUsername)}>Confirm</button>
                                                    <button className="accessButton" onClick={() => handleDeny(notificationUsername)}>Deny</button>
                                                </div>
                                            </div>
                                        </li>
                                        ))}
                                    </ul>
                                )}

                                {notifications.length === 0 && (
                                    <label className="userControlHeaders">No Access Requests</label>
                                    
                                )}
                            </div>
                        </div>
                    </div>
                )}


                
                
            </div>

            
            





        </div>
    );
};

export default Profile;