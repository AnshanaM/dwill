// code written by the group

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplateBeneficiary';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import sendTriggerEmail from './components/TriggerEmail';
import benefactorRegistrationABI from './smart-contracts/RegistrationABI.json';
import signalABI from './smart-contracts/SignalABI.json';
import signal2ABI from './smart-contracts/Signal2ABI.json';
import signal3ABI from './smart-contracts/Signal3ABI.json';
import { send } from 'vite';

const BeneficiaryDashboard: React.FC = () => {

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const benefactorRegistrationContract = new ethers.Contract(constants.OWNER_REGISTRATION, benefactorRegistrationABI, signer);
  const StopCountdownContract = new ethers.Contract(constants.SIGNAL2, signal2ABI, signer);
  const TriggerCountdownContract = new ethers.Contract(constants.SIGNAL3, signal3ABI, signer);
  const communicationContract = new ethers.Contract(
      constants.SIGNAL,
      signalABI,
      signer
  );

  const [isBeneficiary, setIsBeneficiary] = useState<boolean | null>(null);
  const [inactivityCountdown, setinactivityCountdown] = useState("10:00:00:00");
  const [inactivityCountdownStarted, setInactivityCountdownStarted] = useState(true);
  const [inactivityCountdownEnded, setInactivityCountdownEnded] = useState(false);
  const [countdown, setCountdown] = useState("00:00:01:00");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const navigate = useNavigate();

  if (walletAddress==null){
    navigate("/");
  }

  const [benefactorAddresstoswitch, setBenefactor] = useState('');
  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactor(event.target.value);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    try{
      console.log(_benefactor);
      if (dmsContract.checkAliveStatus(_benefactor)){
        await dmsContract.enableSwitch(_benefactor,{from: signer.getAddress()}); 
        alert("Successfully enabled your benefactor's dead mans switch.");
      }
      else{
        alert("Benefactor does not exist.");
      }
    }
    catch (error){
      alert("An error occured when enabling your benefactor's switch.");
    }
    
  }

  const handleTriggerCountdown = () => {
    if (!inactivityCountdownEnded) {
        alert("Please wait for the inactivity countdown to end before triggering the beneficiary countdown.");
    } else{
        sendtrrigercountdown();
        setCountdownStarted(true);
        handleSendTriggerEmail();
        setEmailSent(true);
    }
  };

  const sendtrrigercountdown = async () => {
    try {
        // Call the sendMessage function on the smart contract
        await TriggerCountdownContract.sendMessage("Beneficiary start countdown");
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message. Please try again.");
    }
  };

  // const handleInactivityCountdown = () => {
  //   setInactivityCountdownStarted(true);
  // };

  const handlebenefactorstopcountdown = () => {
    setCountdownStarted(false);
    setCountdownEnded(true);
    setCountdown("00:00:01:00");
    setInactivityCountdownStarted(false);
    setInactivityCountdownEnded(true);
    setinactivityCountdown("10:00:00:00");
  };

  const handlecheckusertype = async (sender: string): Promise<boolean> => {
    try {
        const isBeneficiary = await benefactorRegistrationContract.isBeneficiary(sender);

        if (isBeneficiary) {
            setIsBeneficiary(true);
            console.log("you are beneficiary of :", sender);
        } else {
            setIsBeneficiary(false);
            console.log("you are not beneficiary of :", sender);
        }

        return isBeneficiary; // Return the boolean value
    } catch (error) {
        console.error('Error checking user status:', error);
        alert('An error occurred while checking user status. Please try again.');
        return false; // Return false in case of error
    }
}

  useEffect(() => {
    // Listen for MessageSent events emitted by the smart contract
    communicationContract.on("MessageSent", async (sender, message) => {
        console.log("Message received:", sender, message);

        try {
            const isBeneficiary = await handlecheckusertype(sender);

            if (isBeneficiary) {
                localStorage.setItem(`logoutTime`, message);
                setInactivityCountdownStarted(true);
                setInactivityCountdownEnded(false);
            } else {
                console.log("you are not beneficiary of :", sender);
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            alert('An error occurred while checking user status. Please try again.');
        }
        // handleInactivityCountdown();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
        communicationContract.removeAllListeners("MessageSent");
    };
}, []);

  const storedValue = localStorage.getItem(`logoutTime`);
  let targetDate: Date | null = null;

  if (storedValue !== null) {
      const lastLogout = new Date(storedValue).getTime();
      targetDate = new Date(lastLogout);
    } else {
      console.log("No logout time found in localStorage.");
  }

  useEffect(() => {
    // Listen for MessageSent events emitted by the smart contract
    StopCountdownContract.on("MessageSent", (sender, message) => {
        console.log("Message received:", sender, message);
        handlebenefactorstopcountdown();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
        StopCountdownContract.removeAllListeners("MessageSent");
    };
  }, []);

  //trigger countdown logic
  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const targetDate = new Date();
      targetDate.setMinutes(targetDate.getMinutes() + 1);

      const updatetriggerCountdown = () => {
        const currentDate = new Date().getTime();
        const difference = targetDate.getTime() - currentDate;

        if (difference <= 0) {
          setCountdown("00:00:00:00");
          setCountdownEnded(true);
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          const formattedCountdown = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          setCountdown(formattedCountdown);
        }
      };

      // Update the countdown initially
      updatetriggerCountdown();

      // Update the countdown every second
      const interval = setInterval(updatetriggerCountdown, 1000);

      // Clean up the interval when the component unmounts or the countdown ends
      return () => {
        clearInterval(interval);
        if (countdownEnded) {
          setCountdownStarted(false);
        }
      };
    }
  }, [countdownStarted, countdownEnded]);

  useEffect(() => {
    if (inactivityCountdownStarted && !inactivityCountdownEnded) {
      if (!targetDate) {
        console.error("Target date is null.");
        return;
      }
      targetDate.setMinutes(targetDate.getMinutes() + 14400);  

      const updateCountdown = () => {
        if (!targetDate) {
          return;
        }
        const currentDate = new Date().getTime();
        const difference = targetDate.getTime() - currentDate;

        if (difference <= 0) {
          setinactivityCountdown("00:00:00:00");
          setInactivityCountdownEnded(true);
          console.log("Countdown ended.");
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          const formattedCountdown = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          setinactivityCountdown(formattedCountdown);
        }
      };

      // Update the countdown initially
      updateCountdown();

      // Update the countdown every second
      const interval = setInterval(updateCountdown, 1000);

      // Clean up the interval when the component unmounts or the countdown ends
      return () => {
        clearInterval(interval);
        if (inactivityCountdownEnded) {
          setInactivityCountdownStarted(false);
        }
      };
    }
  }, [inactivityCountdownStarted, inactivityCountdownEnded, targetDate]);

  const handleSendTriggerEmail = async () => {
    try {
      await sendTriggerEmail(); // Call the sendEmail function
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Email failed to send:', error);
      alert('Failed to send email. Please try again later.');
    }
  };

  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={<div className='page-title'><h1>Dashboard</h1></div>} pageContent={
            <div className='page-content'>

                <div>
                    <p>Benefactor Inactivity Countdown: {inactivityCountdown}</p>
                    <p>Beneficiary Countdown: {countdown}</p>
                    {!countdownStarted && !countdownEnded && <button onClick={handleTriggerCountdown}>Trigger Countdown</button>}  
                    {/* {!inactivityCountdownStarted && !inactivityCountdownEnded && <button onClick={handleInactivityCountdown}>Inactivity Countdown</button>} */}
                </div>

                <div>
                    <h3>when countdown is over and benefactor is assumed dead, enable the download button</h3>
                    <button>Download</button>
                  </div> 
              
                  <div style={{paddingTop: "20px"}}>
                  <input className="benefactor-address" type="text" value={benefactorAddresstoswitch} onChange={(e)=>handleAddressChange(e)} placeholder="Enter benefactor address" />
                  <button style={{marginTop: "20px"}}onClick={() => handleEnableSwitch(benefactorAddresstoswitch.toString())}>Enable switch</button>
                </div>

          </div>
          }
          address={walletAddress} 
          />
        }
      </div>
    </main>
  );
};

export default BeneficiaryDashboard;