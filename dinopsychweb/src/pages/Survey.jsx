import { useState, useEffect  } from "react"; 
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DinoLabsLogoBlack from "../assets/dinoLabsLogo_black.png"; 

import "../styles/Survey.css"; 

const Survey = () => {
    const { surveyKey } = useParams();
    const [isKeyAccessed, setIsKeyAccessed] = useState(false);
    const [patientID, setPatientID] = useState('');
    const [organizationID, setOrganizationID] = useState(''); 
    const [incrementedTimepoint, setIncrementedTimepoint] = useState(''); 
    const [surveyError, setSurveyError] = useState('');
    const [lockSurvey, setLockSurvey] = useState(''); 
    const validTimepoints = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']

      const checkAccessKey = async (surveyKey) => {
        try {
          const response = await fetch('http://10.111.26.70:3001/check-access-key', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              surveyKey,
            }),
          });
      
          if (response.status !== 200) {
            setIsKeyAccessed(true);
          }
      
          const data = await response.json();
          setPatientID(data.patientID);
          setOrganizationID(data.organizationID);
        } catch (error) {
          return;
        }
      };

      const incrementTimepoint = async () => {
        try {
          const response = await fetch('http://10.111.26.70:3001/increment-timepoint', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patientID,
              organizationID,
            }),
          });
      
          if (response.status !== 200) {
            throw new Error('Internal server error.');
          }
      
          const data = await response.json();
          setIncrementedTimepoint(data.incrementedTimepoint);
      } catch (error) {
        return; 
      }
    };

    const handleScores = async () => {
      try {
        const response = await fetch('http://10.111.26.70:3001/score-and-store', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientID,
            organizationID,
            surveyKey,
            timepoint: incrementedTimepoint,
            phq15Responses: answers_phq15,
            phq9Responses: answers_phq9,
            phq9_10: selectedPHQ9_10,
            gad7Responses: answers_gad7,
            gad7_8A: selectedGAD7_8A,
            gad7ResponsesSupplement: answers_gad7_supplement,
            psqi_1: `${bedtimeHour}:${bedtimeMinutes} ${bedtimeTOD}`,
            psqi_2: timeToSleep,
            psqi_3: `${waketimeHour}:${waketimeMinutes} ${waketimeTOD}`,
            psqi_4: totalSleepTime,
            psqi_5Responses: answers_psqi,
            psqi_6: selectedPSQI_6,
            psqi_7: selectedPSQI_7,
            psqi_8: selectedPSQI_8,
            psqi_9: selectedPSQI_9,
            sbqr_1: selectedSBQR_1,
            sbqr_2: selectedSBQR_2,
            sbqr_3: selectedSBQR_3,
            sbqr_4: selectedSBQR_4
          }),
        });
    
        if (response.status !== 200) {
          throw new Error('Internal server error.');
        } else {
          window.location.reload();
        }
    
      } catch (error) {
        return; 
      }
    };
    
    useEffect(() => {
      checkAccessKey(); 
    }, [surveyKey]);

    useEffect(() => {
      incrementTimepoint();
    }, [patientID, organizationID])

    const [selectedSurveyState, setSelectedSurveyState] = useState('phq15');
    const [navigationButtonOpacity, setNavigationButtonOpacity] = useState(0.6);

    const [answers_phq15, setAnswers_phq15] = useState({});
    const [questions_phq15, setQuestions_phq15] = useState([
      {
        id: 'phq15_1',
        text: '1. Stomach pain',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_2',
        text: '2. Back pain',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_3',
        text: '3. Pain in your arms, legs, or joints (knees, hips, etc.)',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_4',
        text: '4. Feeling tired or having little energy',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_5',
        text: '5. Troublbe sleeping or staying asleep, or sleeping too much',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_6',
        text: '6. Pain or problems during sexual intercourse',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_7',
        text: '7. Headaches',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_8',
        text: '8. Chest pain',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_9',
        text: '9. Dizziness',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_10',
        text: '10. Fainting spells',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_11',
        text: '11. Feeling your heart pound or race',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_12',
        text: '12. Shortness of breath',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_13',
        text: '13. Constipation, loose bowels, or diarrhea',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
      {
        id: 'phq15_14',
        text: '14. Nausea, gas, or indigestion',
        type: 'multipleChoice',
        options: ['Not bothered at all', 'Bothered a little', 'Bothered a lot'],
      },
    ]);

    const [selectedPHQ9_10, setSelectedPHQ9_10] = useState(null);
    const [answers_phq9, setAnswers_phq9] = useState({});
    const [questions_phq9, setQuestions_phq9] = useState([
      {
        id: 'phq9_1',
        text: '1. Little interest or pleasure in doing things',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_2',
        text: '2. Feeling down, depressed, or hopeless',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_3',
        text: '3. Trouble falling or staying asleep, or sleeping too much',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_4',
        text: '4. Feeling tired or having little energy',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_5',
        text: '5. Poor appetite or overeating',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_6',
        text: '6. Feeling bad about yourself - or that you are a failure or have let yourself or your family down',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_7',
        text: '7. Trouble concentrating on things, such as reading the newspaper or watching television',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_8',
        text: '8. Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'phq9_9',
        text: '9. Thoughts that you would be better off dead or of hurting yourself in some way',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
    ]);

    const [selectedGAD7_8A, setSelectedGAD7_8A] = useState(null);
    const [answers_gad7, setAnswers_gad7] = useState({});
    const [questions_gad7, setQuestions_gad7] = useState([
      {
        id: 'gad7_1',
        text: '1. Feeling nervous, anxious, or on edge',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_2',
        text: '2. Not being able to stop or control worrying',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_3',
        text: '3. Worrying too much about different things',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_4',
        text: '4. Trouble relaxing',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_5',
        text: "5. Being so restless tht it's hard to sit still",
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_6',
        text: '6. Becoming easily annoyed or irritable',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'gad7_7',
        text: '7. Feeling afraid as if something awful might happen',
        type: 'multipleChoice',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
    ]);
    const [answers_gad7_supplement, setAnswers_gad7_supplement] = useState({});
    const [questions_gad7_supplement, setQuestions_gad7_supplement] = useState([
        {
          id: 'gad7_8B',
          text: 'b. Has this ever happened before?',
          type: 'multipleChoice',
          options: ['No', 'Yes'],
        },
        {
          id: 'gad7_8C',
          text: "c. Do some of these attacks come suddenly out of the blue -- that is, in situations where you don't expect to be nervous or uncomfortable?",
          type: 'multipleChoice',
          options: ['No', 'Yes'],
        },
        {
          id: 'gad7_8D',
          text: 'd. Do these attacks bother you a lot or are you worried about having another attack?',
          type: 'multipleChoice',
          options: ['No', 'Yes'],
        },
        {
          id: 'gad7_8E',
          text: 'e. During your last bad anxiety attack, did you have symptoms like shortness of breath, sweating, or your heart racing, pounding or skipping?',
          type: 'multipleChoice',
          options: ['No', 'Yes'],
        },
    ]);

    const [selectedPSQI_6, setSelectedPSQI_6] = useState(null);
    const [selectedPSQI_7, setSelectedPSQI_7] = useState(null);
    const [selectedPSQI_8, setSelectedPSQI_8] = useState(null);
    const [selectedPSQI_9, setSelectedPSQI_9] = useState(null);
    const [bedtimeHour, setBedtimeHour] = useState(null); 
    const [bedtimeMinutes, setBedtimeMinutes] = useState(null); 
    const [bedtimeTOD, setBedtimeTOD] = useState(null); 
    const [waketimeHour, setWaketimeHour] = useState(null); 
    const [waketimeMinutes, setWaketimeMinutes] = useState(null); 
    const [waketimeTOD, setWaketimeTOD] = useState(null); 
    const [timeToSleep, setTimeToSleep] = useState(null); 
    const [totalSleepTime, setTotalSleepTime] = useState(null); 

    const [answers_psqi, setAnswers_psqi] = useState({});
    const [questions_psqi, setQuestions_psqi] = useState([
      {
        id: 'psqi_5A',
        text: 'A. Cannot get to sleep within 30 minutes',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5B',
        text: 'B. Wake up in the middle of the night or early in the morning',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5C',
        text: 'C. Have to get up to use the bathroom',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5D',
        text: 'D. Cannot breathe comfortably',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5E',
        text: 'E. Cough or snore loudly',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5F',
        text: 'F. Feel too cold',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5G',
        text: 'G. Feel to hot',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5H',
        text: 'H. Had bad dreams',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
      {
        id: 'psqi_5I',
        text: 'I. Have pain',
        type: 'multipleChoice',
        options: ['Not during the past month', 'Less than once a week', 'Once or twice a week', 'Three or more times a week'],
      },
    ]);

    const [selectedSBQR_1, setSelectedSBQR_1] = useState(null);
    const [selectedSBQR_2, setSelectedSBQR_2] = useState(null);
    const [selectedSBQR_3, setSelectedSBQR_3] = useState(null);
    const [selectedSBQR_4, setSelectedSBQR_4] = useState(null);

    useEffect(() => {
      const handleBeforeUnload = (event) => {
        const unsavedChanges = Object.values(answers_phq15).some(
          (answer) => answer !== null && answer !== undefined && answer !== ''
        );
  
        if (unsavedChanges) {
          const message = 'You have unsaved changes. Are you sure you want to leave?';
          event.returnValue = message;
          return message;
        }
      };
  
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, [answers_phq15, answers_phq9, answers_gad7, answers_psqi]);

    useEffect(() => {
      document.body.classList.add('surveyPageBody');
      return () => {
        document.body.classList.remove('surveyPageBody');
      };
    }, []);

    const handleInputChangePHQ15 = (questionId, selectedOption) => {
        setAnswers_phq15({
            ...answers_phq15,
            [questionId]: selectedOption,
        });
    };

    const handleInputChangePHQ9 = (questionId, selectedOption) => {
      setAnswers_phq9({
            ...answers_phq9,
            [questionId]: selectedOption,
        });
    };

    const handleInputChangeGAD7 = (questionId, selectedOption) => {
      setAnswers_gad7({
          ...answers_gad7,
          [questionId]: selectedOption,
      });
    };

    const handleInputChangeGAD7Supplement = (questionId, selectedOption) => {
      setAnswers_gad7_supplement({
          ...answers_gad7_supplement,
          [questionId]: selectedOption,
      });
    };

    const handleInputChangePSQI = (questionId, selectedOption) => {
      setAnswers_psqi({
          ...answers_psqi,
          [questionId]: selectedOption,
      });
    };

    const handlePHQ9_10 = (buttonId) => {
        if (selectedPHQ9_10 === buttonId) {
          setSelectedPHQ9_10(null);
        } else {
          setSelectedPHQ9_10(buttonId);
        }
    };

    const handleGAD7_8A = (buttonId) => {
      if (selectedGAD7_8A === buttonId) {
        setSelectedGAD7_8A(null);
      } else {
        setSelectedGAD7_8A(buttonId);
      }
    };

    const handlePSQI_6 = (buttonId) => {
      if (selectedPSQI_6 === buttonId) {
          setSelectedPSQI_6(null);
      } else {
        setSelectedPSQI_6(buttonId);
      }
    };

    const handlePSQI_7 = (buttonId) => {
      if (selectedPSQI_7 === buttonId) {
          setSelectedPSQI_7(null);
      } else {
        setSelectedPSQI_7(buttonId);
      }
    };

    const handlePSQI_8 = (buttonId) => {
      if (selectedPSQI_8 === buttonId) {
          setSelectedPSQI_8(null);
      } else {
        setSelectedPSQI_8(buttonId);
      }
    };

    const handlePSQI_9 = (buttonId) => {
      if (selectedPSQI_9 === buttonId) {
          setSelectedPSQI_9(null);
      } else {
        setSelectedPSQI_9(buttonId);
      }
    };

    const handleSBQR_1 = (buttonId) => {
      if (selectedSBQR_1 === buttonId) {
          setSelectedSBQR_1(null);
      } else {
          setSelectedSBQR_1(buttonId);
      }
    };

    const handleSBQR_2 = (buttonId) => {
      if (selectedSBQR_2 === buttonId) {
          setSelectedSBQR_2(null);
      } else {
          setSelectedSBQR_2(buttonId);
      }
    };

    const handleSBQR_3 = (buttonId) => {
      if (selectedSBQR_3 === buttonId) {
          setSelectedSBQR_3(null);
      } else {
          setSelectedSBQR_3(buttonId);
      }
    };

    const handleSBQR_4 = (buttonId) => {
      if (selectedSBQR_4 === buttonId) {
          setSelectedSBQR_4(null);
      } else {
          setSelectedSBQR_4(buttonId);
      }
    };

    const renderSquareButtonPHQ9_10 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonPHQ9 ${selectedPHQ9_10 === buttonId ? 'selected' : ''}`}
          onClick={() => handlePHQ9_10(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonGAD7_8A = (label, buttonId) => (
      <button
          className={`squareSurveyButtonGAD7 ${selectedGAD7_8A === buttonId ? 'selected' : ''}`}
          onClick={() => handleGAD7_8A(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonPSQI_6 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonPSQI ${selectedPSQI_6 === buttonId ? 'selected' : ''}`}
          onClick={() => handlePSQI_6(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonPSQI_7 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonPSQI ${selectedPSQI_7 === buttonId ? 'selected' : ''}`}
          onClick={() => handlePSQI_7(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonPSQI_8 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonPSQI ${selectedPSQI_8 === buttonId ? 'selected' : ''}`}
          onClick={() => handlePSQI_8(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonPSQI_9 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonPSQI ${selectedPSQI_9 === buttonId ? 'selected' : ''}`}
          onClick={() => handlePSQI_9(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonSBQR_1 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonSBQR ${selectedSBQR_1 === buttonId ? 'selected' : ''}`}
          onClick={() => handleSBQR_1(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonSBQR_2 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonSBQR ${selectedSBQR_2 === buttonId ? 'selected' : ''}`}
          onClick={() => handleSBQR_2(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonSBQR_3 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonSBQR ${selectedSBQR_3 === buttonId ? 'selected' : ''}`}
          onClick={() => handleSBQR_3(buttonId)}
      >
          {label}
      </button>
    );

    const renderSquareButtonSBQR_4 = (label, buttonId) => (
      <button
          className={`squareSurveyButtonSBQR ${selectedSBQR_4 === buttonId ? 'selected' : ''}`}
          onClick={() => handleSBQR_4(buttonId)}
      >
          {label}
      </button>
    );

    const handleNavigationNextClick = () => {
      if (selectedSurveyState === 'phq15' && Object.keys(answers_phq15).length === 14) {
        setSelectedSurveyState('phq9');
        setNavigationButtonOpacity(1);
        setSurveyError('');
      } else {
        setSurveyError('Please answer all questions.');
      }
      
      if (selectedSurveyState === 'phq9' && Object.keys(answers_phq9).length === 9 && selectedPHQ9_10) {
        setSelectedSurveyState('gad7'); 
        setSurveyError('');
      } else {
        setSurveyError('Please answer all questions.');
      }

      if (selectedSurveyState === 'gad7' && Object.keys(answers_gad7).length === 7 && selectedGAD7_8A) {
        setSelectedSurveyState('psqi');
        setSurveyError('');
      } else {
        setSurveyError('Please answer all questions.');
      }
      
      if (selectedSurveyState === 'psqi' && bedtimeHour && bedtimeMinutes && bedtimeTOD && waketimeHour && waketimeMinutes && waketimeTOD && timeToSleep && totalSleepTime && selectedPSQI_6 && selectedPSQI_7 && selectedPSQI_8 && selectedPSQI_9 && Object.keys(answers_psqi).length === 9) {
        setSelectedSurveyState('sbqr');
        setSurveyError('');
      } else {
        setSurveyError('Please answer all questions.');
      }
      
      if (selectedSurveyState === 'sbqr' && selectedSBQR_1 && selectedSBQR_2 && selectedSBQR_3 && selectedSBQR_4) {
        handleScores();
        setSurveyError('');
      } else {
        setSurveyError('Please answer all questions.');
      }
    }; 

    const handleNavigationPreviousClick = () => {
      if (selectedSurveyState === 'sbqr') {
        setSelectedSurveyState('psqi'); 
      } else if (selectedSurveyState === 'psqi') {
        setSelectedSurveyState('gad7'); 
      } else if (selectedSurveyState === 'gad7') {
        setSelectedSurveyState('phq9'); 
      } else if (selectedSurveyState === 'phq9') {
        setSelectedSurveyState('phq15'); 
        setNavigationButtonOpacity(0.6);
      }
    }

    return (
        
        <div>
          
          <div className="surveyWrapper">

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && selectedSurveyState === 'phq15' && (
              <>
                <div className="surveyTitle">Patient Health Questionnaire - Somatization (PHQ-15)</div>
                <div className="surveyPromptInstructions">
                    The questions below ask how often you have been bothered by a list of symptoms during the past week. Please respond to each item by marking one box per row.
                </div>
                <div className="surveyPromptQuestion">
                    During the past week, how much have you been bothered by any of the following problems?
                </div>
                <div className="likertTableWrapper">
                    <table className="likertQuestionTable">
                      <thead className="likertTableHeaders">
                        <tr>
                          <th></th>
                          {questions_phq15[0].options.map((option, index) => (
                              <th className="likertPromptWrappers" key={index}>
                              {option}
                              </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                          {questions_phq15.map((question) => (
                          <tr key={question.id} className="likertTableContent">
                              <td className="likertQuestionText">{question.text}</td>
                              {question.options.map((option, index) => (
                              <td className="likertPromptWrappers" key={index}>
                                  <label>
                                  <input
                                      className="likertRadioInput"
                                      type="radio"
                                      name={`${question.id}`}
                                      value={option}
                                      checked={answers_phq15[question.id] === option}
                                      onChange={() => handleInputChangePHQ15(question.id, option)}
                                  />
                                  </label>
                              </td>
                              ))}
                          </tr>
                          ))}
                      </tbody>
                    </table>
                </div>
              </>
            )}

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && selectedSurveyState === 'phq9' && (
              <>
                <div className="surveyTitle">Patient Health Questionnaire - Depression (PHQ-9)</div>
                <div className="surveyPromptQuestion">
                    Over the last week, how often have you been bothered by any of the following problems?
                </div>
                <div className="likertTableWrapper">
                    <table className="likertQuestionTable">
                        <thead className="likertTableHeaders">
                            <tr>
                            <th></th>
                            {questions_phq9[0].options.map((option, index) => (
                                <th className="likertPromptWrappers" key={index}>
                                {option}
                                </th>
                            ))}
                            </tr>
                        </thead>
                    <tbody>
                        {questions_phq9.map((question) => (
                        <tr key={question.id} className="likertTableContent">
                            <td className="likertQuestionText">{question.text}</td>
                            {question.options.map((option, index) => (
                            <td className="likertPromptWrappers" key={index}>
                                <label>
                                <input
                                    className="likertRadioInput"
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    checked={answers_phq9[question.id] === option}
                                    onChange={() => handleInputChangePHQ9(question.id, option)}
                                />
                                </label>
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                
                <div className="surveyPromptQuestion">
                    If you checked off any problems on this page, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?
                </div>

                <br></br>

                <div className="surveySquareButtonContainerFourButton">
                    {renderSquareButtonPHQ9_10('Not difficult at all', 'phq9_NotDifficult')}
                    {renderSquareButtonPHQ9_10('Somewhat difficult', 'phq9_SomewhatDifficult')}
                    {renderSquareButtonPHQ9_10('Very difficult', 'phq9_VeryDifficult')}
                    {renderSquareButtonPHQ9_10('Extremely difficult', 'phq9_ExtremelyDifficult')}
                </div>
              </>
            )}

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && selectedSurveyState === 'gad7' && (
              <>
                <div className="surveyTitle">Generalized Anxiety Disorder 7-Item (GAD-7)</div>
                <div className="surveyPromptQuestion">
                    Over the last week, how often have you been bothered by any of the following problems?
                </div>
                <div className="likertTableWrapper">
                  <table className="likertQuestionTable">
                    <thead className="likertTableHeaders">
                        <tr>
                          <th></th>
                          {questions_gad7[0].options.map((option, index) => (
                              <th className="likertPromptWrappers" key={index}>
                              {option}
                              </th>
                          ))}
                        </tr>
                    </thead>
                    <tbody>
                        {questions_gad7.map((question) => (
                        <tr key={question.id} className="likertTableContent">
                            <td className="likertQuestionText">{question.text}</td>
                            {question.options.map((option, index) => (
                            <td className="likertPromptWrappers" key={index}>
                                <label>
                                  <input
                                      className="likertRadioInput"
                                      type="radio"
                                      name={`question_${question.id}`}
                                      value={option}
                                      checked={answers_gad7[question.id] === option}
                                      onChange={() => handleInputChangeGAD7(question.id, option)}
                                  />
                                </label>
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <br></br>
                
                <div className="surveyPromptQuestion">
                    Question about anxiety attack...<br /><br />
                    a. In the last week, have you had an anxiety attack -- suddenly feeling fear or panic?
                </div>

                <div className="surveySquareButtonContainerTwoButton">
                    {renderSquareButtonGAD7_8A('No', 'gad7_NoAnxietyAttack')}
                    {renderSquareButtonGAD7_8A('Yes', 'gad7_YesAnxietyAttack')}
                </div>

                {selectedGAD7_8A === 'gad7_YesAnxietyAttack' && (
                  <div className="likertTableWrapper">
                    <table className="likertQuestionTable">
                      <thead className="likertTableHeaders">
                          <tr>
                            <th></th>
                            {questions_gad7_supplement[0].options.map((option, index) => (
                                <th className="likertPromptWrappers" key={index}>
                                {option}
                                </th>
                            ))}
                          </tr>
                      </thead>
                      <tbody>
                        {questions_gad7_supplement.map((question) => (
                          <tr key={question.id} className="likertTableContent">
                              <td className="likertQuestionText">{question.text}</td>
                              {question.options.map((option, index) => (
                              <td className="likertSupplementalPromptWrappers" key={index}>
                                  <label>
                                    <input
                                        className="likertRadioInput"
                                        type="radio"
                                        name={`question_${question.id}`}
                                        value={option}
                                        checked={answers_gad7_supplement[question.id] === option}
                                        onChange={() => handleInputChangeGAD7Supplement(question.id, option)}
                                    />
                                  </label>
                              </td>
                              ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && selectedSurveyState === 'psqi' && (
              <>
                <div className="surveyTitle">Pittsburgh Sleep Quality Index (PSQI)</div>
                <div className="surveyPromptInstructions">
                  The following questions_psqi relate to your usual sleep habits During the past week only. Your answers should indicate the most accurate reply for the majority of days and nights dring the past week. Please answer all questions.
                </div>

                <div className="surveyPromptQuestion">
                    1. During the past week, what time have you usually gone to bed at night?
                </div>

                <div className="timeframeSelectBlock">
                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">Hour</label>

                        <select
                            className="timeframeSelect"
                            value={bedtimeHour}
                            onChange={(e) => setBedtimeHour(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="1">1</option>
                            <option className="timeframeSelect" value="2">2</option>
                            <option className="timeframeSelect" value="3">3</option>
                            <option className="timeframeSelect" value="4">4</option>
                            <option className="timeframeSelect" value="5">5</option>
                            <option className="timeframeSelect" value="6">6</option>
                            <option className="timeframeSelect" value="7">7</option>
                            <option className="timeframeSelect" value="8">8</option>
                            <option className="timeframeSelect" value="9">9</option>
                            <option className="timeframeSelect" value="10">10</option>
                            <option className="timeframeSelect" value="11">11</option>
                            <option className="timeframeSelect" value="12">12</option>
                        </select>
                    </div>

                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">Minute</label>

                        <select
                            className="timeframeSelect"
                            value={bedtimeMinutes}
                            onChange={(e) => setBedtimeMinutes(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="00">00</option>
                            <option className="timeframeSelect" value="15">15</option>
                            <option className="timeframeSelect" value="30">30</option>
                            <option className="timeframeSelect" value="45">45</option>
                        </select>
                    </div>

                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">AM/PM</label>

                        <select
                            className="timeframeSelect"
                            value={bedtimeTOD}
                            onChange={(e) => setBedtimeTOD(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="AM">AM</option>
                            <option className="timeframeSelect" value="PM">PM</option>
                        </select>
                    </div>
                </div>

                <div className="surveyPromptQuestion">
                    2. During the past week, how long (in # of minutes) has it taken you to fall asleep each night?
                </div>

                <input 
                    className="timeframeInput" 
                    type="text" 
                    value={timeToSleep}
                    onChange={(e) => setTimeToSleep(e.target.value)}
                />

                <div className="surveyPromptQuestion">
                  3. During the past week, what time have you usually gotten up in the morning?
                </div>

                <div className="timeframeSelectBlock">
                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">Hour</label>

                        <select
                            className="timeframeSelect"
                            value={waketimeHour}
                            onChange={(e) => setWaketimeHour(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="1">1</option>
                            <option className="timeframeSelect" value="2">2</option>
                            <option className="timeframeSelect" value="3">3</option>
                            <option className="timeframeSelect" value="4">4</option>
                            <option className="timeframeSelect" value="5">5</option>
                            <option className="timeframeSelect" value="6">6</option>
                            <option className="timeframeSelect" value="7">7</option>
                            <option className="timeframeSelect" value="8">8</option>
                            <option className="timeframeSelect" value="9">9</option>
                            <option className="timeframeSelect" value="10">10</option>
                            <option className="timeframeSelect" value="11">11</option>
                            <option className="timeframeSelect" value="12">12</option>
                        </select>
                    </div>

                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">Minute</label>

                        <select
                            className="timeframeSelect"
                            value={waketimeMinutes}
                            onChange={(e) => setWaketimeMinutes(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="00">00</option>
                            <option className="timeframeSelect" value="15">15</option>
                            <option className="timeframeSelect" value="30">30</option>
                            <option className="timeframeSelect" value="45">45</option>
                        </select>
                    </div>

                    <div className="timeframeSelectFlex">
                        <label className="timeframeLabel">AM/PM</label>

                        <select
                            className="timeframeSelect"
                            value={waketimeTOD}
                            onChange={(e) => setWaketimeTOD(e.target.value)}
                        >
                            <option className="timeframeSelect" hidden={true} value=""></option>
                            <option className="timeframeSelect" value="AM">AM</option>
                            <option className="timeframeSelect" value="PM">PM</option>
                        </select>
                    </div>
                </div>

                <div className="surveyPromptQuestion">
                    4. During the past week, how many hours of actual sleep did you get at night? (This may be different than the number of hours you spent in bed.)
                </div>

                <input 
                    className="timeframeInput" 
                    type="text" 
                    value={totalSleepTime}
                    onChange={(e) => setTotalSleepTime(e.target.value)}
                />

                <div className="surveyPromptQuestion">
                    5. During the past week, how often have you had trouble sleeping because you...
                </div>

                <div className="likertTableWrapper">
                    <table className="likertQuestionTable">
                        <thead className="likertTableHeaders">
                            <tr>
                            <th></th>
                            {questions_psqi[0].options.map((option, index) => (
                                <th className="likertPromptWrappers" key={index}>
                                {option}
                                </th>
                            ))}
                            </tr>
                        </thead>
                    <tbody>
                        {questions_psqi.map((question) => (
                        <tr key={question.id} className="likertTableContent">
                            <td className="likertQuestionText">{question.text}</td>
                            {question.options.map((option, index) => (
                            <td className="likertPromptWrappers" key={index}>
                                <label>
                                <input
                                    className="likertRadioInput"
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    checked={answers_psqi[question.id] === option}
                                    onChange={() => handleInputChangePSQI(question.id, option)}
                                />
                                </label>
                            </td>
                            ))}
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                <div className="surveyPromptQuestion">
                    6. During the past week, how would you rate your sleep quality overall?
                </div>

                <div className="surveySquareButtonContainerThreeButton">
                    {renderSquareButtonPSQI_6('Very good', 'psqi_6A')}
                    {renderSquareButtonPSQI_6('Fairly good', 'psqi_6B')}
                    {renderSquareButtonPSQI_6('Fairly bad', 'psqi_6C')}
                    {renderSquareButtonPSQI_6('Very bad', 'psqi_6D')}
                </div>

                <div className="surveyPromptQuestion">
                    7. During the past week, how often have you taken medicine to help you sleep (prescribed or "over the counter")?
                </div>

                <div className="surveySquareButtonContainerThreeButton">
                    {renderSquareButtonPSQI_7('Not during the past week', 'psqi_7A')}
                    {renderSquareButtonPSQI_7('Once or twice a week', 'psqi_7B')}
                    {renderSquareButtonPSQI_7('Three or more times a week', 'psqi_7C')}
                </div>

                <div className="surveyPromptQuestion">
                    8. During the past week, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?
                </div>

                <div className="surveySquareButtonContainerThreeButton">
                    {renderSquareButtonPSQI_8('Not during the past week', 'psqi_8A')}
                    {renderSquareButtonPSQI_8('Once or twice a week', 'psqi_8B')}
                    {renderSquareButtonPSQI_8('Three or more times a week', 'psqi_8C')}
                </div>

                <div className="surveyPromptQuestion">
                    9. During the past week, how much of a problem has it been for you to keep up enough enthusiasm to get things done?
                </div>

                <div className="surveySquareButtonContainerThreeButton">
                    {renderSquareButtonPSQI_9('Not a problem at all', 'psqi_9A')}
                    {renderSquareButtonPSQI_9('Only a very slight problem', 'psqi_9B')}
                    {renderSquareButtonPSQI_9('Somewhat of a problem', 'psqi_9C')}
                    {renderSquareButtonPSQI_9('A very big problem', 'psqi_9D')}
                </div>
              </>
            )}

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && selectedSurveyState === 'sbqr' && (
              <>
                <div className="surveyTitle">Suicide Behaviors Questionnaire - Revised (SBQ-R)</div>
                <div className="surveyPromptInstructions">
                    Instructions: Please check the number beside the statement or phrase that best applies to you.
                </div>

                <div className="surveyPromptQuestion">
                    1. Have you thought about or attempted to kill yourself in the past week?
                </div>

                <div className="blockMultipleChoiceSelect">
                    {renderSquareButtonSBQR_1('Never', 'sbqr_1A')}
                    {renderSquareButtonSBQR_1('It was just a brief passing thought', 'sbqr_1B')}
                    {renderSquareButtonSBQR_1('I have had a plan at least once to kill myself but did not try to do it', 'sbqr_1C')}
                    {renderSquareButtonSBQR_1('I have had a plan at least once to kill myself and really wanted to die', 'sbqr_1D')}
                    {renderSquareButtonSBQR_1('I have attempted to kill myself, but did not want to die', 'sbqr_1E')}
                    {renderSquareButtonSBQR_1('I have attempted to kill myself, and really hoped to die', 'sbqr_1F')}
                </div>

                <div className="surveyPromptQuestion">
                    2. How often have you thought about killing yourself in the past week?
                </div>

                <div className="blockMultipleChoiceSelect">
                    {renderSquareButtonSBQR_2('Never', 'sbqr_2A')}
                    {renderSquareButtonSBQR_2('Rarely (1 time)', 'sbqr_2B')}
                    {renderSquareButtonSBQR_2('Sometimes (2 times)', 'sbqr_2C')}
                    {renderSquareButtonSBQR_2('Often (3-4 times)', 'sbqr_2D')}
                    {renderSquareButtonSBQR_2('Very Often (5 or ore times)', 'sbqr_2E')}
                </div>

                <div className="surveyPromptQuestion">
                    3. Have you told someone in the past week that you were going to commit suicide, or that you might do it?
                </div>

                <div className="blockMultipleChoiceSelect">
                    {renderSquareButtonSBQR_3('No', 'sbqr_3A')}
                    {renderSquareButtonSBQR_3('Yes, at one time, but did not really want to die', 'sbqr_3B')}
                    {renderSquareButtonSBQR_3('Yes, at one time, and really wanted to die', 'sbqr_3C')}
                    {renderSquareButtonSBQR_3('Yes, more than once, but did not want to do it', 'sbqr_3D')}
                    {renderSquareButtonSBQR_3('Yes, more than once, and really wanted to do it', 'sbqr_3E')}
                </div>

                <div className="surveyPromptQuestion">
                    4. How likely is it that you will attempt suicide someday?
                </div>

                <div className="blockMultipleChoiceSelect">
                    {renderSquareButtonSBQR_4('Never', 'sbqr_4A')}
                    {renderSquareButtonSBQR_4('No chance at all', 'sbqr_4B')}
                    {renderSquareButtonSBQR_4('Rather Unlikely', 'sbqr_4C')}
                    {renderSquareButtonSBQR_4('Unlikely', 'sbqr_4D')}
                    {renderSquareButtonSBQR_4('Likely', 'sbqr_4E')} 
                    {renderSquareButtonSBQR_4('Rather Likely', 'sbqr_4F')}
                    {renderSquareButtonSBQR_4('Very Likely', 'sbqr_4G')}
                </div>
              </>
            )}

            {isKeyAccessed == false && validTimepoints.includes(incrementedTimepoint) && (
              <div className="surveyNavigationWrapper"> 
                <button className="surveyPreviousButton" onClick={handleNavigationPreviousClick} style={{'opacity': navigationButtonOpacity}}>
                    <span className="navigationArrow">&larr;</span>
                    <span className="navigationTextPrevious">Previous</span>
                </button>

                <div className="surveyError">{surveyError}</div>

                <button className="surveyNextButton" onClick={handleNavigationNextClick}>
                    <span className="navigationTextNext">Next</span>
                    <span className="navigationArrow">&#8594;</span>
                </button>
              </div>
            )}

            {!validTimepoints.includes(incrementedTimepoint) && (
              <div className="loggedOutContainer">
                <img className="loggedOutLogo" src={DinoLabsLogoBlack} alt="Dino Labs Logo"></img>
                <div className="surveyCompletedPrompt">This program has been completed.</div>
                <div className="surveyCompletedSubheader">Thanks for your time!</div>
              </div>
            )}
            
            {isKeyAccessed === true && (
              <div className="loggedOutContainer">
                <img className="loggedOutLogo" src={DinoLabsLogoBlack} alt="Dino Labs Logo"></img>
                <div className="surveyCompletedPrompt">This survey has been completed.</div>
                <div className="surveyCompletedSubheader">Thanks for your time!</div>
              </div>
              
            )}

            <br></br>
            <br></br>
            <br></br>
          </div>
            
        </div>
    );
};
export default Survey;