// code written by the group

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';

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

  const handleAssign = (beneficiaryList: { beneficiaryAddress: string; }[]) => {
    //create a set to store unique addresses
    const uniqueAddresses = new Set<string>();
    //iterate and add non-empty unique addresses to the set
    beneficiaryList.forEach(beneficiary => {
      const trimmedAddress = beneficiary.beneficiaryAddress.trim();
      if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
        uniqueAddresses.add(trimmedAddress);
      }
    });
    //convert the set to arrray
    const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));
    console.log(uniqueBeneficiaries);
    uniqueBeneficiaries.forEach(async beneficiary => {
      try {
          await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress);
          console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);
      } catch (error) {
        alert("Beneficiary already exists or some other error");
          console.error(`Error adding beneficiary ${beneficiary.beneficiaryAddress}:`, error);
      }
    });
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
    // handleSendTriggerEmail();
    // setEmailSent(true);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    try{
      console.log(_benefactor);
      if (dmsContract.checkAliveStatus(_benefactor)){
        await dmsContract.enableSwitch(_benefactor,{from: signer.getAddress()}); 
        handleTriggerCountdown();
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


  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const targetDate = new Date();
      targetDate.setMinutes(targetDate.getMinutes() + 1);

      const updateCountdown = () => {
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
      updateCountdown(); //update to display countdown initially
      const interval = setInterval(updateCountdown, 1000); //update countdown every second
      // clean up the interval when the component unmounts or the countdown ends
      return () => {
        clearInterval(interval);
        if (countdownEnded) {
          setCountdownStarted(false);
        }
      };
    }
  }, [countdownStarted, countdownEnded]);

  // const handleSendTriggerEmail = async () => {
  //   try {
  //     await sendTriggerEmail(); // Call the sendEmail function
  //     alert('Email sent successfully!');
  //   } catch (error) {
  //     console.error('Email failed to send:', error);
  //     alert('Failed to send email. Please try again later.');
  //   }
  // };

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