import {useState, useEffect} from "react"; 
import { useNavigate } from "react-router-dom"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


const Profile = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token"); 
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
        timestamp: date,
        count: userTimestampCounts[date] || 0,
    }));

    const organizationBarChartData = getLastSevenDays().map(date => ({
        timestamp: date,
        count: organizationTimestampCounts[date] || 0,
    }));


    return (
        <div>





        </div>
    );
};

export default Profile;