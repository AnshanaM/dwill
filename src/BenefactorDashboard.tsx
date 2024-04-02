// code written by the group

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplateBenefactor';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import benefactorRegistrationABI from './smart-contracts/RegistrationABI.json';
import signal2ABI from './smart-contracts/Signal2ABI.json';
import signal3ABI from './smart-contracts/Signal3ABI.json';
import { ethers } from 'ethers';

interface Beneficiary {
  beneficiaryAddress: string;
  [key: string]: string; // Index signature
}

const BenefactorDashboard: React.FC = () => {

  const walletAddress = useAddress();
  const [beneficiaryAddress, setBeneficiaryAddress] = useState(""); 
  const [beneficiaries, setBeneficiaries] = useState<string[]>([]); 
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  // const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const benefactorRegistrationContract = new ethers.Contract(constants.OWNER_REGISTRATION, benefactorRegistrationABI, signer);
  const StopCountdownContract = new ethers.Contract(constants.SIGNAL2, signal2ABI, signer);
  const TriggerCountdownContract = new ethers.Contract(constants.SIGNAL3, signal3ABI, signer);

  const [inactivitycountdown, setinactivityCountdown] = useState("00:00:00:00");
  const [inactivitycountdownStarted, setinactivityCountdownStarted] = useState(true);
  const [inactivitycountdownEnded, setinactivityCountdownEnded] = useState(false);

  const [countdown, setCountdown] = useState("00:00:00:00");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

  const navigate = useNavigate();

  if (walletAddress==null){
    navigate("/");
  }

  const handleAssign = async () => {
    try {
      // Check if the beneficiary address is valid
      if (!ethers.utils.isAddress(beneficiaryAddress)) {
        alert("Invalid beneficiary address!");
        return;
      }
      // Call the smart contract function to add beneficiary
      await benefactorRegistrationContract.addBeneficiary(beneficiaryAddress);
      // Retrieve the list of beneficiaries associated with the current user's wallet address
      const benefactorBeneficiaries = await benefactorRegistrationContract.getBeneficiaries(walletAddress);
      // Filter out invalid beneficiaries and update the list
      const validBeneficiaries = benefactorBeneficiaries.filter((address: string) => ethers.utils.isAddress(address));
      setBeneficiaries(validBeneficiaries);
      // Clear the beneficiary address input field
      setBeneficiaryAddress("");
      alert("Beneficiary added successfully!");
    } catch (error: any) {
      if (error.message.includes("already added")) {
        // Alert the user if the beneficiary is already added
        alert("Beneficiary already added!");
      } else {
        console.error("Error assigning beneficiary:", error);
        alert("Error assigning beneficiary. Please try again.");
      }
    }
  };
  
  const handleRemoveBeneficiary = async (beneficiaryToRemove: string) => {
    try {
      // Call the smart contract function to remove beneficiary
      await benefactorRegistrationContract.removeBeneficiary(beneficiaryToRemove);
      // Update the list of beneficiaries by filtering out the removed beneficiary
      setBeneficiaries(prevBeneficiaries => prevBeneficiaries.filter(beneficiary => beneficiary !== beneficiaryToRemove));
      alert("Beneficiary removed successfully!");
    } catch (error) {
      console.error("Error removing beneficiary:", error);
      alert("Error removing beneficiary. Please try again.");
    }
  };

  const resetcountdown = async () => {
    try {
        // Call the sendMessage function on the smart contract
        await StopCountdownContract.sendMessage("Benefactor reset countdown");
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message. Please try again.");
    }
  };

  const handleTriggerCountdown = async () => {
    setCountdownStarted(true);
  };

  useEffect(() => {
    // Fetch the list of beneficiaries associated with the current user's wallet address
    const fetchBeneficiaries = async () => {
      try {
        const benefactorBeneficiaries = await benefactorRegistrationContract.getBeneficiaries(walletAddress);
        // Update the list of beneficiaries
        setBeneficiaries(benefactorBeneficiaries);
      } catch (error) {
        console.error("Error fetching beneficiaries:", error);
        // Handle error fetching beneficiaries
      }
    };
  
    // Call the function to fetch beneficiaries when the component mounts or when the wallet address changes
    fetchBeneficiaries();
  }, [benefactorRegistrationContract, walletAddress]);

  const storedValue = localStorage.getItem(`logoutTime_${walletAddress}`);
  let targetDate: Date | null = null;

  if (storedValue !== null) {
      const lastLogout = new Date(storedValue).getTime();
      targetDate = new Date(lastLogout);
    } else {
      console.log("No logout time found in localStorage.");
  }

  //inactivity countdown logic
  useEffect(() => {
    if (inactivitycountdownStarted && !inactivitycountdownEnded) {
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
          setinactivityCountdownEnded(true);
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
        if (inactivitycountdownEnded) {
          setinactivityCountdownStarted(false);
        }
      };
    }
  }, [inactivitycountdownStarted, inactivitycountdownEnded, targetDate]);

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
    // Listen for MessageSent events emitted by the smart contract
    TriggerCountdownContract.on("MessageSent", (sender, message) => {
        console.log("Message received:", sender, message);
        handleTriggerCountdown();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
        TriggerCountdownContract.removeAllListeners("MessageSent");
    };
  }, []);

  const handlestopcountdown = async () => {
    resetcountdown();
    setinactivityCountdownStarted(false);
    setinactivityCountdownEnded(true);
    setinactivityCountdown("00:00:00:00");
    setCountdownStarted(false);
    setCountdownEnded(true);
    setCountdown("00:00:00:00");
  };
  
  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={<div className='page-title'><h1>Dashboard</h1></div>} pageContent={
            <div className='page-content'>

              <div>
                <h2>Inactivity Countdown</h2>
                <p>{inactivitycountdown}</p>
                <button onClick={handlestopcountdown}>Reset Countdown</button>
              </div>

              <div>
                <h2>Beneficiary Countdown</h2>
                <p>{countdown}</p>
              </div>

                <>
                  <div>
                    <h2>Display files here </h2>
                  </div>

                  <div>
                    <h3>when atleast 1 file is selected, enable the encrypt button</h3>
                    <button>Encrypt</button>
                  </div>                                   

                  <br/>

                  <div>
                    <h2>Assign Beneficiaries</h2>
                    
                      <div>
                        <input 
                        name="beneficiary-address"
                        value={beneficiaryAddress}
                        onChange={(e) => setBeneficiaryAddress(e.target.value)}
                        />
                      </div>            

                      <br/>

                      <button onClick={handleAssign}>Assign</button>
                  </div>

                  <div>
                    <h2>Beneficiaries' Wallet Address</h2>
                    <ul>
                      {beneficiaries.map((beneficiary, index) => (
                        // Check if the beneficiary address is not equal to the specific address
                        beneficiary !== "0x0000000000000000000000000000000000000000" && (
                          <li key={index}>
                            {beneficiary}
                            {/* Render the Remove button */}
                            <button onClick={() => handleRemoveBeneficiary(beneficiary)}>Remove</button>
                          </li>
                        )
                      ))}
                    </ul>
                  </div>
                </>

          </div>
          }
          address={walletAddress} 
          />
        }
      </div>
    </main>
  );
};

export default BenefactorDashboard;