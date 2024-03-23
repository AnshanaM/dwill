// code written by the group

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import { createDiffieHellman, DiffieHellman } from 'crypto';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userType: string | null = searchParams.get("userType");

  const benefactor = userType=="benefactor" ? 1 : 0;

  const [beneficiaries,setBeneficiary] = useState([{beneficiaryAddress:""}])

  const [benefactorAddress, setBenefactor] = useState('');

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const [countdown, setCountdown] = useState("00:00:01:00");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }

  const handleAdd=()=>{
      //checks if the prev is not blank
      if (beneficiaries.length === 0 || beneficiaries[beneficiaries.length - 1].beneficiaryAddress.trim() !== '') {
      setBeneficiary([...beneficiaries, { beneficiaryAddress: '' }]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const { name, value } = e.target;
    const updatedBeneficiaries = [...beneficiaries];
    updatedBeneficiaries[i][name] = value;
    setBeneficiary(updatedBeneficiaries);
  };
  
  const handleRemove=(i: number)=>{
    const deleteBeneficiary = [...beneficiaries];
    deleteBeneficiary.splice(i,1);
    setBeneficiary(deleteBeneficiary);
  };

  const handleAssign = async (beneficiaryList: { beneficiaryAddress: string; }[]) => {
    try {
        const uniqueAddresses = new Set<string>();
        beneficiaryList.forEach(beneficiary => {
            const trimmedAddress = beneficiary.beneficiaryAddress.trim();
            if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
                uniqueAddresses.add(trimmedAddress);
            }
        });
        const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));

        // Perform asynchronous operations inside a loop using Promise.all
        await Promise.all(uniqueBeneficiaries.map(async beneficiary => {
            try {
                const overrides = {
                    gasLimit: 10000000 // Increase gas limit as needed
                };
                await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress, overrides);
                console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);

                const beneficiaryDH: DiffieHellman = createDiffieHellman(15);
                beneficiaryDH.generateKeys();
                const beneficiaryPublicKey = beneficiaryDH.getPublicKey('hex');
                await dmsContract.addBeneficiaryPublicKey(walletAddress, beneficiary.beneficiaryAddress, beneficiaryPublicKey);
                console.log(`Stored public key for beneficiary ${beneficiary.beneficiaryAddress}`);
            } catch (error) {
                // Handle specific errors
                if (error.code === -32000 && error.data && error.data.code === -32000 && error.data.data) {
                    // Gas estimation error, transaction may fail or require manual gas limit
                    alert("Gas estimation error. Transaction may fail or require manual gas limit.");
                    console.error("Gas estimation error:", error);
                } else {
                    // Other errors
                    alert("Error adding beneficiary. Please try again later.");
                    console.error(`Error adding beneficiary ${beneficiary.beneficiaryAddress}:`, error);
                }
            }
        }));
    } catch (error) {
        // Handle unexpected errors
        alert("An unexpected error occurred. Please try again later.");
        console.error("Unexpected error in handleAssign:", error);
    }
  };


  const handleDisableSwitch = () => {
    try{
      dmsContract.respondToSwitch({from: signer.getAddress()}); 
      alert("Succesfully responded to your switch.");
    }
    catch(error){
      alert("An error occured when responding to your switch.");
    } 
  }

  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactor(event.target.value);
  };

  const handleTriggerCountdown = () => {
    setCountdownStarted(true);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    try {
      console.log(_benefactor);
      await dmsContract.enableSwitch(_benefactor);
      if (dmsContract.checkAliveStatus(_benefactor)) {
        const remainingCountdown = await dmsContract.getRemainingCountdownTime(_benefactor);
        setCountdownStarted(true);
        setCountdownEnded(false);
        setCountdown(formatCountdown(remainingCountdown));
        alert("Successfully enabled your benefactor's dead man's switch.");
      } else {
        alert("Benefactor does not exist.");
      }
    } catch (error) {
      alert("An error occurred when enabling your benefactor's switch.");
    }
  }

  const formatCountdown = (remainingTimeInSeconds: number): string => {
    const days = Math.floor(remainingTimeInSeconds / (60 * 60 * 24));
    const hours = Math.floor((remainingTimeInSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((remainingTimeInSeconds % (60 * 60)) / 60);
    const seconds = remainingTimeInSeconds % 60;
    let formattedCountdown = '';
    if (days > 0) {
      formattedCountdown += `${days} day${days !== 1 ? 's' : ''} `;
    }
    if (hours > 0) {
      formattedCountdown += `${hours} hour${hours !== 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
      formattedCountdown += `${minutes} min${minutes !== 1 ? 's' : ''} `;
    }
    if (seconds > 0) {
      formattedCountdown += `${seconds} sec${seconds !== 1 ? 's' : ''}`;
    }
    return formattedCountdown.trim();
  }
  

  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const updateCountdown = async () => {
        try {
          const remainingCountdown = await dmsContract.getRemainingCountdownTime(benefactorAddress);
          if (remainingCountdown <= 0) {
            setCountdown("COUNTDOWN");
            setCountdownEnded(true);
          } else {
            const formattedCountdown = formatCountdown(remainingCountdown);
            setCountdown(formattedCountdown);
          }
        } catch (error) {
          console.error("Error updating countdown:", error);
        }
      };
  
      updateCountdown(); //update to display countdown initially
      const interval = setInterval(updateCountdown, 1000); //update countdown every second
  
      //clean up the interval when the component unmounts or the countdown ends
      return () => {
        clearInterval(interval);
        if (countdownEnded) {
          setCountdownStarted(false);
        }
      };
    }
  }, [countdownStarted, countdownEnded, dmsContract, benefactorAddress]);
  

  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>

                <h2>{countdown}</h2>

                {benefactor ? 
                  //benefactor
                  <button onClick={() => handleDisableSwitch()}>Disable switch</button>
                :
                  //beneficiary
                  <div className='beneficiary-right'>
                    <input 
                      type="text" 
                      value={benefactorAddress} 
                      onChange={(e) => handleAddressChange(e)} 
                      placeholder="Enter benefactor address" 
                    />
                    {!countdownStarted && !countdownEnded &&
                      <button 
                        onClick={() => handleEnableSwitch(benefactorAddress.toString())} 
                        disabled={!benefactorAddress}
                      >
                        Enable switch
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          } pageContent={
            <div>


              {/* delete this later */}
              {userType!=null ? <h3>User Type: {userType}</h3> : null}

              {benefactor ?
                <>
                  <div>
                    <h2>Display files here </h2>
                  </div>

                  <br/>
                  <div>
                    <button onClick={handleAdd}>Add beneficiary</button>
                    {
                      beneficiaries.map((val,i)=>
                      <div>
                        <input name="beneficiaryAddress" value={val.beneficiaryAddress} onChange={(e)=>handleChange(e,i)}/>
                        <button onClick={()=>handleRemove(i)}><b>&times;</b></button>
                      </div>
                      )
                    }
                    <button onClick={() => handleAssign(beneficiaries)}>Assign</button>
                  </div>
                </>

                : //beneficiary section

                <>
                  <div>
                    <h3>when countdown is over and benefactor is assumed dead, enable the download button</h3>
                    <button>Download</button>
                  </div>
                </>
              }

          </div>
          }
          user={userType==null ? "" : userType}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Dashboard;