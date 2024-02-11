import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto"; 
import jsPDF from 'jsPDF';
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload } from '@fortawesome/free-solid-svg-icons';

import DinoLabsLogoWhite from "../assets/dinoLabsLogo_white.png"; 

import "../styles/Report.css"; 

const Report = () => {
    const token = localStorage.getItem("token"); 
    const measureArray = ['phq9', 'phq15', 'gad7', 'sbqr', 'psqi'];
    const [phq9TrajectoryData, setPHQ9TrajectoryData] = useState([]);
    const [phq15TrajectoryData, setPHQ15TrajectoryData] = useState([]);
    const [gad7TrajectoryData, setGAD7TrajectoryData] = useState([]);
    const [sbqrTrajectoryData, setSBQRtrajectoryData] = useState([]);
    const [psqiTrajectoryData, setPSQITrajectoryData] = useState([]);
    const [phq15Average, setPHQ15Average] = useState(0); 
    const [phq9Average, setPHQ9Average] = useState(0); 
    const [gad7Average, setGAD7Average] = useState(0); 
    const [sbqrAverage, setSBQRAverage] = useState(0); 
    const [psqiAverage, setPSQIAverage] = useState(0); 
    const [phq15Interpretation, setPHQ15Interpretation] = useState('');
    const [phq9Interpretation, setPHQ9Interpretation] = useState('');
    const [gad7Interpretation, setGAD7Interpretation] = useState('');
    const [sbqrInterpretation, setSBQRInterpretation] = useState('');
    const [psqiInterpretation, setPSQIInterpretation] = useState('');

    const organizationID = localStorage.getItem('organizationID'); 
    const organizationHeader = localStorage.getItem('reportPatient') !== '' ? localStorage.getItem('reportPatient') : localStorage.getItem('reportOrganization'); 
    const patientFilter = localStorage.getItem('reportPatient');

    const headerRef = useRef(); 
    const phq9Ref = useRef(); 
    const phq15Ref = useRef(); 
    const gad7Ref = useRef(); 
    const sbqrRef = useRef(); 
    const psqiRef = useRef(); 
    const footerRef = useRef(); 
        
    const generatePDF = () => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const refs = [headerRef, phq9Ref, phq15Ref, gad7Ref, sbqrRef, psqiRef, footerRef];
        let currentHeight = 0;
        const pageHeight = 280; 
        const pageWidth = 210; 
        const margin = 10; 
    
        const addBackgroundColor = () => {
            pdf.setFillColor("#002"); 
            pdf.rect(0, 0, pageWidth, pageHeight + 2 * margin, 'F'); 
        };
    
        const processRef = async (index) => {
            if (index >= refs.length) {
                pdf.save(`OutcomesReport_${(formatDate().toString()).replace(' ', '-')}.pdf`);
                return;
            }
    
            const currentRef = refs[index].current;
    
            try {
                const canvas = await html2canvas(currentRef, { useCORS: true, scale: 1 });
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = pageWidth - 2 * margin; 
                const imgHeight = canvas.height * imgWidth / canvas.width; 
    
                if (currentHeight === 0 || currentHeight + imgHeight > pageHeight) {
                    if (index !== 0) {
                        pdf.addPage(); 
                    }
                    addBackgroundColor(); 
                    currentHeight = 0;
                }
    
                pdf.addImage(imgData, 'PNG', margin, currentHeight + margin, imgWidth, imgHeight);
                currentHeight += imgHeight + margin; 
    
                processRef(index + 1);
            } catch (error) {
                console.error('Error generating section of PDF:', error);
            }
        };
    
        addBackgroundColor();
        processRef(0);
    };
    
    const calculateAverage = (data) => {
        if (!data.length) return 0; 
        const sum = data.reduce((acc, val) => acc + val, 0); 
        return sum / data.length; 
    }

    const trajectoryDataMap = {
        'phq9': setPHQ9TrajectoryData,
        'phq15': setPHQ15TrajectoryData,
        'gad7': setGAD7TrajectoryData,
        'sbqr': setSBQRtrajectoryData,
        'psqi': setPSQITrajectoryData
    };

    const interpretationDataMap = {
        'phq9': setPHQ9Interpretation,
        'phq15': setPHQ15Interpretation,
        'gad7': setGAD7Interpretation,
        'sbqr': setSBQRInterpretation,
        'psqi': setPSQIInterpretation
    };

    const averageDataMap = {
        'phq9': phq9Average,
        'phq15': phq15Average,
        'gad7': gad7Average,
        'sbqr': sbqrAverage,
        'psqi': psqiAverage
    }

    const getReportTrajectoryData = async (selectedID) => {
        try {
          for (const measure of measureArray) {
            const response = await fetch('http://172.20.10.3:3001/patient-outcomes-data', {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
              },
              body: JSON.stringify({
                organizationID,
                patientFilter: selectedID || '',
                measureFilter: measure,
              }),
            });
      
            if (response.status !== 200) {
              throw new Error(`Internal Server Error`);
            }
      
            const data = await response.json();
            const setTrajectoryData = trajectoryDataMap[measure];
            if (setTrajectoryData) {
              setTrajectoryData(data.trajectoryData);
            }
          }
        } catch (error) {
          return;
        }
    }; 
      
    const getDataInterpretation = async (selectedID) => {
        try {
          for (const measure of measureArray) {
            const response = await fetch('http://172.20.10.3:3001/pull-patient-analysis', {
              method: 'POST',
              headers: {
                "Content-Type": "application/json",
                "Authorization": `${token}`,
              },
              body: JSON.stringify({
                selectedPatient: selectedID ? `${selectedID}` : '',
                selectedMeasure: measure,
                selectedScore: averageDataMap[measure] || 0,
              }),
            });
      
            if (response.status !== 200) {
              throw new Error(`Internal Server Error`);
            }
      
            const data = await response.json();
            const setInterpretation = interpretationDataMap[measure];
            if (setInterpretation) {
              setInterpretation(data.text);
            }
          }
        } catch (error) {
            return; 
        }
    };
    
    useEffect(() => {
        const phq9Average = calculateAverage(phq9TrajectoryData); 
        const phq15Average = calculateAverage(phq15TrajectoryData); 
        const gad7Average = calculateAverage(gad7TrajectoryData); 
        const sbqrAverage = calculateAverage(sbqrTrajectoryData); 
        const psqiAverage = calculateAverage(psqiTrajectoryData); 

        setPHQ15Average(phq15Average);
        setPHQ9Average(phq9Average); 
        setGAD7Average(gad7Average); 
        setSBQRAverage(sbqrAverage); 
        setPSQIAverage(psqiAverage);  

        getDataInterpretation(patientFilter !== '' ? `${patientFilter.split('-')[0]} - (${patientFilter.split('-')[1]})` : ''); 

    }, [phq9TrajectoryData, phq15TrajectoryData, gad7TrajectoryData, sbqrTrajectoryData, psqiTrajectoryData, psqiTrajectoryData])

    const createLineChart = (canvasID, label, data) => {
        const ctx = document.getElementById(canvasID);
        const existingChart = Chart.getChart(ctx);

        let measureMax = 100;
        let stepValue;
        if (canvasID === "phq9_Line") {
          measureMax = 27;
          stepValue = 3;
        } else if (canvasID === "phq15_Line") {
          measureMax = 30;
          stepValue = 5;
        } else if (canvasID === "gad7_Line") {
          measureMax = 21;
          stepValue = 3;
        } else if (canvasID === "sbqr_Line") {
          measureMax = 18;
          stepValue = 3;
        } else if (canvasID === "psqi_Line") {
          measureMax = 21;
          stepValue = 3;
        } else {
          measureMax = 27;
          stepValue = 3;
        }

        if (existingChart) {
            existingChart.data.datasets[0].data = data;
            existingChart.update();
        } else {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'], 
                    datasets: [
                        {
                            label: label,
                            data: data,
                            fill: false,
                            borderWidth: 3,
                            backgroundColor: '#8884d8',
                            borderColor: '#8884d8',
                        },
                    ],
                },
                options: {
                    tooltips: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: false,
                            },
                            min: 0,
                            max: measureMax,
                            ticks: {
                                stepSize: stepValue,
                            },
                            border: {
                                lineWidth: 2,
                                color: 'grey',
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                            },
                            border: {
                                lineWidth: 2,
                                color: 'grey',
                            }
                        },
                    },
                    plugins: {
                        legend: {
                            display: false,
                        },
                    },
                },
            });
        }
    };

    const createGaugeChart = (canvasID, average, measureCutoff, measureMax) => {
        const ctx = document.getElementById(canvasID);
        const existingChart = Chart.getChart(ctx);

        if (existingChart) {
            existingChart.data.datasets[0].data = [average, measureMax - average];
            existingChart.update();
        } else {
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                  datasets: [
                    {
                      data: [average, measureMax - average],
                      backgroundColor: [average >= measureCutoff ? '#E54B4B' : '#8884d8', 'grey'],
                      borderWidth: 0,
                    },
                  ],
                },
                options: {
                  cutout: "70%",
                  circumference: 180,
                  rotation: -90,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  tooltips: {
                    enabled: false,
                  },
                },
            });
        }
    };
    
    useEffect(() => {
        getReportTrajectoryData(patientFilter !== '' ? parseInt(patientFilter.split('-')[1]) : '');
    }, [])

    useEffect(() => {
        setTimeout(() => {
            createLineChart('phq9_Line', 'PHQ-9', phq9TrajectoryData);
        }, 50)
    }, [phq9TrajectoryData]);

    useEffect(() => {
        setTimeout(() => {
            createLineChart('phq15_Line', 'PHQ-15', phq15TrajectoryData);
        }, 50)
    }, [phq15TrajectoryData]);

    useEffect(() => {
        setTimeout(() => {
            createLineChart('gad7_Line', 'GAD-7', gad7TrajectoryData);
        }, 50)
    }, [gad7TrajectoryData]);

    useEffect(() => {
        setTimeout(() => {
            createLineChart('sbqr_Line', 'SBQ-R', sbqrTrajectoryData);
        }, 50)
    }, [sbqrTrajectoryData]);

    useEffect(() => {
        setTimeout(() => {
            createLineChart('psqi_Line', 'PSQI', psqiTrajectoryData);
        }, 50)
    }, [psqiTrajectoryData]);

    useEffect(() => {
        setTimeout(() => {
            createGaugeChart('phq9_Gauge', phq9Average, 20, 27);
        }, 50)
    }, [phq9Average]);

    useEffect(() => {
        setTimeout(() => {
            createGaugeChart('phq15_Gauge', phq15Average, 15, 30);
        }, 50)
    }, [phq15Average]);

    useEffect(() => {
        setTimeout(() => {
            createGaugeChart('gad7_Gauge', gad7Average, 15, 21);
        }, 50)
    }, [gad7Average]);

    useEffect(() => {
        setTimeout(() => {
            createGaugeChart('sbqr_Gauge', sbqrAverage, 8, 18);
        }, 50)
    }, [sbqrAverage]);

    useEffect(() => {
        setTimeout(() => {
            createGaugeChart('psqi_Gauge', psqiAverage, 5, 21);
        }, 50)
    }, [psqiAverage]);

    function formatDate() {
        const now = new Date();
    
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); 
        const day = now.getDate().toString().padStart(2, '0');
        const year = now.getFullYear();
    
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
    
        hours = hours % 12;
        hours = hours ? hours : 12; 
        hours = hours.toString().padStart(2, '0');
    
        return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
    }
    
    useEffect(() => {
        document.body.classList.add('reportPageBody');
        return () => {
          document.body.classList.remove('reportPageBody');
        };
    }, []);

    return (
            
        <div>
            <div className="reportTopNavBar" ref={headerRef} style={{ backgroundColor: '#002' }}>
                <div className="outcomesReportTitleWrapper">
                    <label className="outcomesReportTitle">{organizationHeader.split('-')[0]}</label>
                    <label className="outcomesReportSubtitle">ID: {organizationHeader.split('-')[1]}</label>
                </div>

                <button className="exportReportButton" onClick={generatePDF}>
                    <FontAwesomeIcon className="downloadReportIcon" icon={faDownload}/>
                    <label className="downloadReportText">Download Report as PDF</label>
                </button>
            </div>

            <br/>
            <br/>
            <br/>

            <div className="outcomesInterpretationContainer" ref={phq9Ref} style={{ backgroundColor: '#002' }}>
                <div className="reportOutcomesTrajectoryChartContainer">
                    <label className="reportHeader">Patient Health Questionnaire - Depression (PHQ-9)</label>
                    <div className="trajectoryLineContainer">
                        <canvas className="outcomesTrajectoryChart" id="phq9_Line"></canvas>
                    </div>
                </div>

                <div className="reportPatientInterpretationFlex">
                    <div className="reportThresholdChartContainer">
                        <canvas id="phq9_Gauge"></canvas>
                        <div className="reportValueBlock">
                        <div className="reportMeasureValue">{`${phq9Average.toFixed(1)}`}</div>
                        <div className="reportMeasureLabel">PHQ-9</div>
                        <div className="reportMeasureTitle">{(patientFilter && patientFilter !== '') ? `${patientFilter}` : "All Patients"}</div>
                        </div>
                    </div>
                    <div className='outcomesThresholdSummaryContainer'>{phq9Interpretation}</div>
                </div>
            </div>

            <div className="outcomesInterpretationContainer" ref={phq15Ref} style={{ backgroundColor: '#002' }}>
                <div className="reportOutcomesTrajectoryChartContainer">
                    <label className="reportHeader">Patient Health Questionnaire - Somatization (PHQ-15)</label>
                    <div className="trajectoryLineContainer">
                        <canvas className="outcomesTrajectoryChart" id="phq15_Line"></canvas>
                    </div>
                </div>

                <div className="reportPatientInterpretationFlex">
                    <div className="reportThresholdChartContainer">
                        <canvas id="phq15_Gauge"></canvas>
                        <div className="reportValueBlock">
                            <div className="reportMeasureValue">{`${phq15Average.toFixed(1)}`}</div>
                            <div className="reportMeasureLabel">PHQ-15</div>
                            <div className="reportMeasureTitle">{(patientFilter && patientFilter !== '') ? `${patientFilter}` : "All Patients"}</div>
                        </div>
                    </div>
                    <div className='outcomesThresholdSummaryContainer'>{phq15Interpretation}</div>
                </div>
            </div>

            <div className="outcomesInterpretationContainer" ref={gad7Ref} style={{ backgroundColor: '#002' }}>
                <div className="reportOutcomesTrajectoryChartContainer">
                    <label className="reportHeader">Generalized Anxiety Disorder 7 (GAD-7)</label>
                    <div className="trajectoryLineContainer">
                        <canvas className="outcomesTrajectoryChart" id="gad7_Line"></canvas>
                    </div>
                </div>

                <div className="reportPatientInterpretationFlex">
                    <div className="reportThresholdChartContainer">
                        <canvas id="gad7_Gauge"></canvas>
                        <div className="reportValueBlock">
                            <div className="reportMeasureValue">{`${gad7Average.toFixed(1)}`}</div>
                            <div className="reportMeasureLabel">GAD-7</div>
                            <div className="reportMeasureTitle">{(patientFilter && patientFilter !== '') ? `${patientFilter}` : "All Patients"}</div>
                        </div>
                        
                    </div>
                    <div className='outcomesThresholdSummaryContainer'>{gad7Interpretation}</div>
                </div>
            </div>

            <div className="outcomesInterpretationContainer" ref={sbqrRef} style={{ backgroundColor: '#002' }}>
                <div className="reportOutcomesTrajectoryChartContainer">
                    <label className="reportHeader">Suicide Behaviors Questionnaire - Revised (SBQ-R)</label>
                    <div className="trajectoryLineContainer">
                        <canvas className="outcomesTrajectoryChart" id="sbqr_Line"></canvas>
                    </div>
                </div>

                <div className="reportPatientInterpretationFlex">
                    <div className="reportThresholdChartContainer">
                        <canvas id="sbqr_Gauge"></canvas>
                        <div className="reportValueBlock">
                        <div className="reportMeasureValue">{`${sbqrAverage.toFixed(1)}`}</div>
                        <div className="reportMeasureLabel">SBQR-R</div>
                        <div className="reportMeasureTitle">{(patientFilter && patientFilter !== '') ? `${patientFilter}` : "All Patients"}</div>
                        </div>
                    </div>
                    <div className='outcomesThresholdSummaryContainer'>{sbqrInterpretation}</div>
                </div>
            </div>

            <div className="outcomesInterpretationContainer" ref={psqiRef} style={{ backgroundColor: '#002' }}>
                <div className="reportOutcomesTrajectoryChartContainer">
                    <label className="reportHeader">Pittsburgh Sleep Quality Index (PSQI)</label>
                    <div className="trajectoryLineContainer">
                        <canvas className="outcomesTrajectoryChart" id="psqi_Line"></canvas>
                    </div>
                </div>

                <div className="reportPatientInterpretationFlex">
                    <div className="reportThresholdChartContainer">
                        <canvas id="psqi_Gauge"></canvas>
                        <div className="reportValueBlock">
                        <div className="reportMeasureValue">{`${psqiAverage.toFixed(1)}`}</div>
                        <div className="reportMeasureLabel">PSQI</div>
                        <div className="reportMeasureTitle">{(patientFilter && patientFilter !== '') ? `${patientFilter}` : "All Patients"}</div>
                        </div>
                    </div>
                    <div className='outcomesThresholdSummaryContainer'>{psqiInterpretation}</div>
                </div>
            </div>

            <div className="reportBottomNavBar" ref={footerRef} style={{ backgroundColor: '#002' }}> 
                <label className="outcomesReportTimestamp">Outcomes Report - Generated on {formatDate()}</label>

                <div className="dinoLabsTag"> 
                    <label className="dinoLabsTextTag">Generated by Dino Labs</label>
                    <img className="dinoLabsIconTag" src={DinoLabsLogoWhite}/>
                </div>
            </div>

            
        </div>
    );
};

export default Report; 