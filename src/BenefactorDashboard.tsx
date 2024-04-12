// code written by the group

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import Loader from './components/Loader';
import { useDiffieHellman } from './DiffieHellmanContext';

const BenefactorDashboard: React.FC = () => {

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const [countdown, setCountdown] = useState("Benefactor is alive.");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

  const [benefactorPrivateKey, setBenefactorPrivateKey] = useState<string>('');
  const [benefactorPublicKey, setBenefactorPublicKey] = useState<string>('');

  const [triggerSwitch,setTriggerSwitch] = useState(false);

  const [remainingTime,setRemainingTime] = useState(0);
  const [isAlive,setAliveStatus] = useState(true);

  const [loading, setLoading] = useState(false);

  const [beneficiaries,setBeneficiary] = useState([{beneficiaryAddress:""}])

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);


  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }

  const handleBenefactorPrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactorPrivateKey(e.target.value);
  };

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

    const handleAssign = async (beneficiaryList) => {
      setLoading(true);
      const uniqueAddresses = new Set();
      beneficiaryList.forEach(beneficiary => {
          const trimmedAddress = beneficiary.beneficiaryAddress.trim();
          if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
              uniqueAddresses.add(trimmedAddress);
          }
      });
      const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));
      console.log(uniqueBeneficiaries);
      try {
          await dmsContract.addBeneficiaries(uniqueBeneficiaries.map(b => b.beneficiaryAddress), { from: walletAddress });
          console.log('Beneficiaries added successfully');
          // You can add any additional logic here after adding beneficiaries
      } catch (error) {
          alert("Error adding beneficiaries");
          console.error('Error adding beneficiaries:', error);
      } finally {
          setLoading(false);
      }
    };

    const generateBPublicKey = async () => {
      setLoading(true);
      try{
      console.log(`Benefactor private key: ${benefactorPrivateKey}`);
      // get benefactors private key
      const privateKey = parseInt(benefactorPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      // generate public key from private key
      const benefactorPublicKey = generatePublicKey(privateKey).toString();
      setBenefactorPublicKey(benefactorPublicKey);
      // store benefacotrs public key in the contract
      await dmsContract.addBenefactorPublicKey(walletAddress,benefactorPublicKey);
      console.log(`Benefactor public key: ${benefactorPublicKey}`);
      }catch(e){
        console.log(`error generating your public key: ${e}`);
      }
      finally{
        setLoading(false);
      }
      return benefactorPublicKey;
    }

  const handleDisableSwitch = () => {
    setLoading(true);
    try{
      dmsContract.respondToSwitch({from: signer.getAddress()}); 
      alert("Succesfully responded to your switch.");
      setTriggerSwitch(true);
    }
    catch(error){
      alert("An error occured when responding to your switch.");
    }
    finally{
      setLoading(false);
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
    if (!isAlive) {
      navigate("/");
      alert("Benefactor is dead");
    }
  },[isAlive]);
  
  useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const tx = await dmsContract.getBenefactorData(walletAddress);
        const receipt = await tx.wait();
        const event = receipt.events.find(event => event.event === "BenefactorsData");
        if (event) {
          const { switchStatus, beneficiaries, remainingTime, isAlive, publicKey } = event.args;
          setCountdown(!isAlive ? "Benefactor is dead." : switchStatus ? formatCountdown(remainingTime) : "Benefactor is alive.");
          switchStatus ? setCountdownStarted(true): setCountdownStarted(false);
          setRemainingTime(remainingTime);
          setAliveStatus(isAlive);
          setBenefactorPublicKey(publicKey);
        } else {
          setCountdown("Data not found.");
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setCountdown("Error fetching data.");
      } finally {
        setLoading(false);
      }
    };
    if(triggerSwitch) {
      getData();
    }
    if (walletAddress) {
      getData();
    }
  }, []); // Run this effect only once when the component mounts
  
  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const interval = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 0) {
            setCountdownEnded(true);
            return 0;
          } else {
            return prevTime - 1;
          }
        });
      }, 1000);
  
      return () => {
        clearInterval(interval);
      };
    }
  }, [countdownStarted, countdownEnded]);
  
  useEffect(() => {
    if (countdownStarted && !countdownEnded) {
      const formattedCountdown = formatCountdown(remainingTime);
      setCountdown(formattedCountdown);
    }
    if (triggerSwitch && !countdownStarted && countdownEnded){
      setCountdown("Benefactor is alive.");
    }
  }, [remainingTime, triggerSwitch, countdownStarted, countdownEnded]);
  

  return (
    <main>
      {loading && <Loader lockScroll={true}/>}
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>
                <h2>{countdown}</h2>
                <button onClick={() => handleDisableSwitch()}>Disable switch</button>
              </div>
            </div> 
          } pageContent={
            <div className='content'>
                  {
                    benefactorPublicKey == '' ? 
                    <div className='privateKey'>
                      <input
                        type="text"
                        placeholder="Enter your private key "
                        value={benefactorPrivateKey}
                        onChange={handleBenefactorPrivateKeyChange}
                        className='input-priv-key'
                      />
                      <button onClick={generateBPublicKey}>Generate Public Key</button>
                    </div>
                    :
                    <></>
                  }

                  <div>
                    <h2>Display files here </h2>
                  </div>

                  <h2>Assign beneficiaries:</h2>

                  <div className='assignment-container'>
                  <div className='buttons'>
                    <button className='assign-button' onClick={handleAdd}>Add</button>
                    <button className='assign-button' onClick={() => handleAssign(beneficiaries)}>Assign All</button>
                  </div>
                  <div className='assignment'>
                    {beneficiaries.map((val, i) => (
                      <div key={i}>
                        <div className="input-container">
                          <img src={"/images/beneficiary.png"} className='assign-img' />
                          <div className='input-data'>
                            <input className="assign-input" name="beneficiaryAddress" value={val.beneficiaryAddress} onChange={(e) => handleChange(e, i)} />
                            <button onClick={() => handleRemove(i)} className='assign-remove'><b>&times;</b></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


            </div>
            
          }
          user={"benefactor"}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default BenefactorDashboard;