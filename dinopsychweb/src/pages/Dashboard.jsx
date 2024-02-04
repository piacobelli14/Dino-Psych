import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom"; 
import Chart from "chart.js/auto"; 
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faX, faPerson, faRightFromBracket, faPeopleLine, faFilter } from '@fortawesome/free-solid-svg-icons';

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png"; 

import "../styles/Dashboard.css"; 

const Dashboard = () => {
    const navigate = useNavigate(); 
    const token = localStorage.getItem("token"); 
    const [username, setUsername] = useState("");
    const [organizationID, setOrganizationID] = useState(""); 
    const [organizationName, setOrganizationName] = useState(""); 
    const [patientList, setPatientList] = useState(['']); 
    const [selectedPatientIDs, setSelectedPatientIDs] = useState([]); 
    const [selectedPatientInfo, setSelectedPatientInfo] = useState([]); 
    const [isHamburger, setIsHamburger] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [selectedID, setSelectedID] = useState(""); 
    const [selectedName, setSelectedName] = useState(""); 
    const [measureFilter, setMeasureFilter] = useState('phq15');
    const [measureFilterLabel, setMeasureFilterLabel] = useState('PHQ-15');
    const [average, setAverage] = useState(0);
    const [dataInterpretation, setDataIntepretation] = useState('');
    const [patientTimepointInfo, setPatientTimepointInfo] = useState([]);
    const [organizationTimepointInfo, setOrganizationTimepointInfo] = useState([]);
    const [organizationCounts, setOrganizationCounts] = useState('');
    const [maxCompletionCount, setMaxCompletionCount] = useState('');
    const [distributionList, setDistributionList] = useState(''); 
    const [trajectoryData, setTrajectoryData] = useState([]); 

    const [searchValue, setSearchValue] = useState(""); 


    useEffect(() => {
        setUsername(localStorage.getItem('username') || ''); 
    }, []); 

    useEffect(() => {
        fetchUserInfo(); 
    }, [username]); 

    useEffect(() => {
        fetchPatientSearchOptions();
        fetchOrganizationInfo();
        fetchDistributionInfo();
        fetchOrganizationTimepointData();
        fetchOrganizationCompletionCounts();
    }, [organizationID]);

    useEffect(() => {
        setTimeout(() => {
            fetchPatientOutcomesData();
        })
    }, [username, organizationID, selectedID, measureFilter]);

    useEffect(() => {
        fetchPatientAnalysis();
    }, [average, measureFilter, selectedID]);

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

    const fetchOrganizationInfo = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/organization-info', {
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
          setOrganizationName(data[0].orgname);
        } catch (error) {
          return; 
        }
    };

    const fetchPatientSearchOptions = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/patient-search-options', {
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
          setPatientList(data.patientsArray);
        } catch (error) {
          return; 
        }
      };

    const fetchDistributionInfo = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/get-distribution-info', {
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
          setDistributionList(data.patientList);
        } catch (error) {
          return; 
        }
    };
    
    const fetchOrganizationTimepointData = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/pull-organization-timepoint-data', {
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
          setOrganizationTimepointInfo(data.measureAverages);
        } catch (error) {
          return; 
        }
    };
    
    const fetchOrganizationCompletionCounts = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/pull-organization-completion-counts', {
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
          setOrganizationCounts(data.completionCounts);
          setMaxCompletionCount(data.maxCount);
        } catch (error) {
          return; 
        }
    };

    const fetchPatientOutcomesData = async () => {
        try {
          const response = await fetch('http://172.20.10.3:3001/patient-outcomes-data', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${token}`,
            },
            body: JSON.stringify({
              organizationID,
              patientFilter: selectedID || '',
              measureFilter: measureFilter,
            }),
          });
      
          if (response.status !== 200) {
            throw new Error(`Internal Server Error`);
          }
      
          const data = await response.json();
          setTrajectoryData(data.trajectoryData);
        } catch (error) {
         return; 
        }
    };

    const fetchPatientAnalysis = async () => {
        try {
          const response = await fetch('http://10.111.26.70:3001/pull-patient-analysis', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${token}`,
            },
            body: JSON.stringify({
              selectedPatient: selectedName ? `${selectedName} (${selectedID})` : '',
              selectedMeasure: (measureFilter && measureFilter !== 'undefined') ? measureFilter : 'suicidalityindex',
              selectedScore: average,
            }),
          });
      
          if (response.status !== 200) {
            throw new Error(`Internal Server Error`);
          }
      
          const data = await response.json();
          setDataIntepretation(data.text);
        } catch (error) {
          return; 
        }
    };

    const handleSearchChange = async (event) => {
        setSelectedID(''); 
        setSelectedName('');
        setPatientTimepointInfo('');
      
        const query = event.target.value;
        setSearchValue(query);
      
        const filteredSuggestions = patientList.filter((item) =>
          item.toLowerCase().includes(query.toLowerCase())
        );
      
        setFilteredSuggestions(filteredSuggestions);
      
        try {
          const response = await fetch('http://172.20.10.3:3001/pull-patient-analysis', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${token}`,
            },
            body: JSON.stringify({
              selectedPatient: selectedName ? `${selectedName} (${selectedID})` : '',
              selectedMeasure: (measureFilter && measureFilter !== 'undefined') ? measureFilter : 'phq15',
              selectedScore: average,
            }),
          });
      
          if (response.status !== 200) {
            throw new Error(`Internal Server Error`);
          }
      
          const data = await response.json();
          setDataIntepretation(data.text);
        } catch (error) {
          return; 
        }
    };
      
    const handleSuggestionClick = async (suggestion) => {
        const matches = suggestion.match(/^(.*) \(([^)]+)\)$/);
        if (!matches) {
          return;
        }
      
        const patientName = matches[1].trim();
        const patientID = matches[2].trim();
      
        setSelectedName(patientName);
        setSelectedID(patientID);
      
        setSearchValue(suggestion);
        setFilteredSuggestions([]);
      
        try {
          const response = await fetch('http://172.20.10.3:3001/pull-patient-timepoint-data', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Authorization": `${token}`,
            },
            body: JSON.stringify({
              organizationID,
              selectedPatient: patientID,
            }),
          });
      
          if (response.status !== 200) {
            throw new Error(`Internal Server Error`);
          }
      
          const data = await response.json();
          setPatientTimepointInfo(data.patientDataArray);
        } catch (error) {
          return;
        }
    };

    const [trajectoryChartData, setTrajectoryChartData] = useState({
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
        datasets: [
          {
            label: 'Measure',
            data: [],
            fill: false,
            borderWidth: 3,
            backgroundColor: '#8884d8',
            borderColor: '#8884d8',
          },
        ],
    });
    
    const [trajectoryChartOptions, setTrajectoryChartOptions] = useState({});

    useEffect(() => {
        const avg = trajectoryData.reduce((sum, value) => sum + value, 0) / trajectoryData.length;
        setAverage(avg);

        let measureMax = 100;
        let stepValue = 5;

        switch (measureFilter) {
            case "phq9":
                measureMax = 27;
                stepValue = 3;
                break;
            case "phq15":
                measureMax = 30;
                stepValue = 5;
                break;
            case "gad7":
                measureMax = 21;
                stepValue = 3;
                break;
            case "sbqr":
                measureMax = 18;
                stepValue = 3;
                break;
            case "psqi":
                measureMax = 21;
                stepValue = 3;
                break;
            default:
                measureMax = 27;
                stepValue = 3;
        }

        setTrajectoryChartData(prevData => ({
            ...prevData,
            datasets: [
                {
                ...prevData.datasets[0],
                data: trajectoryData,
                label: 'Measure', 
                },
            ],
        }));

        setTrajectoryChartOptions({
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
            display: false,
            },
        },
        scales: {
            y: {
            beginAtZero: true,
            min: 0,
            max: measureMax,
            ticks: {
                stepSize: stepValue,
            },
            grid: {
                display: false,
            },
            },
            x: {
            grid: {
                display: false,
            },
            },
        },
        });

  }, [trajectoryData, measureFilter]);

  const [gaugeChartData, setGaugeChartData] = useState({
    datasets: [
      {
        data: [],
        backgroundColor: [],
      },
    ],
  });
  
  const [gaugeChartOptions, setGaugeChartOptions] = useState({});
  

  useEffect(() => {
    let measureCutoff = 15; // Default values
    let measureMax = 30; // Default values
  
    switch (measureFilter) {
      case "phq9":
        measureCutoff = 20;
        measureMax = 27;
        break;
      case "phq15":
        measureCutoff = 15;
        measureMax = 30;
        break;
      case "gad7":
        measureCutoff = 15;
        measureMax = 21;
        break;
      case "sbqr":
        measureCutoff = 8;
        measureMax = 18;
        break;
      case "psqi":
        measureCutoff = 5;
        measureMax = 21;
        break;
      default:
        measureCutoff = 15;
        measureMax = 30;
    }
  
    setGaugeChartData({
      datasets: [
        {
          data: [average, measureMax - average],
          backgroundColor: [average >= measureCutoff ? '#E54B4B' : '#8884d8', 'grey'],
          borderWidth: 0,
        },
      ],
    });
  
    setGaugeChartOptions({
      cutout: "70%",
      circumference: 180,
      rotation: -90,
      plugins: {
        legend: {
          display: false,
        },
      },
      tooltips: {
        enabled: false,
      },
    });
  
  }, [average, measureFilter]);
  
  

    

    return (
        <div>

           {isHamburger && (
                <div className="dashboardHamburgerPopout"> 
                </div>
            )}

            <div className="dashboardHeaderContainer">
                <div className="dashboardTopNavBarContainer"> 

                <a className="dashboardSkipToContent"> 
                    <img className="dashboardLogo" src={DinoLabsLogoWhite} alt="Dino Labs Logo"/>
                    <label className="dashboardHeader">
                        Dino Psych
                    </label> 
                </a>

                <button className="dashboardHamburgerCircle" onClick={()=> setIsHamburger(!isHamburger)}>
                    <FontAwesomeIcon icon={isHamburger ? faX : faBars} className="dashboardHamburgerIcon" />
                </button>
                </div>

                {!isHamburger && (
                    <div className="dashboardHeaderDivider"/>
                )}

                {isHamburger && (
                    <div className="dashboardHamburgerContent">

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
                    <div className="dashboardWrapper">
                        <div className="dashboardContainer">

                            <div className="patientSearchWrapper"> 
                                <input
                                    className="patientSearchBar"
                                    type="text"
                                    placeholder="Search for Patient"
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                />

                                {searchValue && filteredSuggestions.length > 0 && (
                                    <ul className="patientSearchSuggestions">
                                        {filteredSuggestions.map((suggestion) => (
                                        <li key={suggestion} onClick={() => handleSuggestionClick(suggestion)}>
                                            {suggestion}
                                        </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="patientInterpretationContainer">
                                <div className="outcomesTrajectoryChartContainer">
                                    <div className="measureFilterWrapper">
                                        <FontAwesomeIcon icon={faFilter} className="navigationButtonIcon"/>

                                        <div className="filterByMeasurePrompt">Filter By Measure</div>

                                        <select
                                            className="measureSelect"
                                            value={measureFilter}
                                            onChange={(e) => {
                                                const selectedValue = e.target.value;
                                                const selectedLabel =
                                                e.target.options[e.target.selectedIndex].text;

                                                setMeasureFilter(selectedValue);
                                                setMeasureFilterLabel(selectedLabel);
                                            }}
                                        >
                                        <option value={"phq9"}>PHQ-9</option>
                                        <option value={"phq15"}>PHQ-15</option>
                                        <option value={"gad7"}>GAD-7</option>
                                        <option value={"sbqr"}>SBQ-R</option>
                                        <option value={"psqi"}>PSQI</option>
                                        </select>

                                    </div>

                                    <Line className="outcomesTrajectoryChart" data={trajectoryChartData} options={trajectoryChartOptions} />
                                </div>
                                

                                <div className="selectedPatientInterpretationFlex">
                                    <div className="outcomesThresholdChartContainer">
                                        <Doughnut className="outcomesDoughnutChart" data={gaugeChartData} options={gaugeChartOptions} />
                                        <div className="averageValueBlock">
                                            <div className="averageMeasureValue">{(measureFilter && measureFilter !== 'undefined' && measureFilter === 'suicidalityindex') ? `${average.toFixed(1)}%` : average.toFixed(1)}</div>
                                            <div className="averageMeasureLabel">{(measureFilterLabel && measureFilter !== 'undefined') ? measureFilterLabel : ''}</div>
                                            <div className="averageMeasureTitle">{(selectedID && selectedID !== '') ? `${selectedName} - (${selectedID})` : "All Patients"}</div>
                                        </div>
                                    </div>

                                    <div className='outcomesThresholdSummaryContainer'>{dataInterpretation}</div>
                                </div>
                                
                            </div>

                        </div>



                    </div>
                )}

                


            </div>
        </div>
    );
};

export default Dashboard; 