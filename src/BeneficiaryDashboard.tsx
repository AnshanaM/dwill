// code written by the group

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { useAddress} from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import { useDiffieHellman} from './DiffieHellmanContext';
import Loader from './components/Loader';


const BeneficiaryDashboard: React.FC = () => {
  const location = useLocation();
  const benefactorAddress = (location.state as any)?.benefactorAddress;

  const [countdown, setCountdown] = useState("Benefactor is alive.");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

  const [remainingTime,setRemainingTime] = useState(0);
  const [isAlive,setAliveStatus] = useState(true);
  const [publicKey,setBeneficiaryPublicKey] = useState("");


  const [loading, setLoading] = useState(false);

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const [beneficiaryPrivateKey, setBeneficiaryPrivateKey] = useState('');

//   const { diffieHellman } = useDiffieHellman();


  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }


  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryPrivateKey(event.target.value);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    setLoading(true);
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
    }finally{
      setLoading(false);
      window.location.reload();
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
  
  // useEffect(() => {
  //   if (!isAlive && remainingTime == 0){
  //     setCountdown("Benefactor is dead.");
  //     alert("Benefactor is dead");
  //   }
  // },[isAlive]);

  // useEffect(() => {
  //   const getData = async () => {
  //     setLoading(true);
  //     try {
  //       const tx = await dmsContract.getBeneficiaryData(benefactorAddress);
  //       const receipt = await tx.wait(); // Wait for the transaction to be confirmed
  //       console.log("Receipt:", receipt);
  //       console.log("Events in receipt:", receipt.events);
  //       const event = receipt.events.find(event => event.event === "BeneficiariesData"); // Assuming your contract emits an event with the return values
  //       console.log("Event:", event);
  //       if (event) {
  //         const { switchStatus, remainingTime, isAlive } = event.args; // Access the return values from the event
  //         console.log('Switch status:', switchStatus);
  //         console.log('Remaining time:', remainingTime);
  //         console.log('IsAlive:',isAlive);
  //         setIsAlive(isAlive);
  //         setRemainingTime(remainingTime);
  //         setCountdownStarted(true);
  //         setCountdownEnded(false);
  //         setCountdown(formatCountdown(remainingTime));
  //       } 
  //     } catch (error) {
  //       console.error('Error fetching data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  
  //   if (walletAddress) {
  //     getData(); // Call getData function when wallet address is available
  //   }
  // }, []);

  // useEffect(() => {
  //   if (countdownStarted && !countdownEnded) {
  //     const interval = setInterval(() => {
  //       setRemainingTime(prevTime => {
  //         if (prevTime <= 0) {
  //           setCountdownEnded(true);
  //           return 0;
  //         } else {
  //           return prevTime - 1;
  //         }
  //       });
  //     }, 1000);
  
  //     return () => {
  //       clearInterval(interval);
  //     };
  //   }
  // }, [countdownStarted, countdownEnded]);
  
  // useEffect(() => {
  //   if (countdownStarted && !countdownEnded) {
  //     const formattedCountdown = formatCountdown(remainingTime);
  //     setCountdown(formattedCountdown);
  //   }
  // }, [remainingTime]);
  

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
        const tx = await dmsContract.getBeneficiaryData(benefactorAddress,walletAddress);
        const receipt = await tx.wait();
        const event = receipt.events.find(event => event.event === "BeneficiariesData");
        if (event) {
          const { switchStatus, remainingTime, isAlive, publicKey} = event.args;
          // setCountdown(isAlive  ? "Benefactor is alive." : formatCountdown(remainingTime));
          setCountdown(!isAlive  ? "Benefactor is dead." : switchStatus ? formatCountdown(remainingTime) : "Benefactor is alive.");
          switchStatus ? setCountdownStarted(true): setCountdownStarted(false);
          setRemainingTime(remainingTime);
          setAliveStatus(isAlive);
          setBeneficiaryPublicKey(publicKey);
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

    if (walletAddress) {
      getData();
    }
  }, []);
  
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
  }, [remainingTime]);
  
  



  const generateSecretKey = async () => {
    setLoading(true);
    try{
    // get benefactor public key from contract
      const benefactorPublicKey = await dmsContract.getBenefactorPublicKey(benefactorAddress,walletAddress);
      console.log(`Benefactor public key: ${benefactorPublicKey}`)
      // generate the secret key using beneficiarys public key and benefactors private key
      console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`)
      const privateKey = parseInt(beneficiaryPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      const secretKey = computeSecret(parseInt(benefactorPublicKey), privateKey);
      console.log(`Secret key: ${secretKey}`);
      // beneficiary notify benefactor that keys are already generated
    }
    catch(error){
      console.log(`error in generating secret key: ${error}`);
    }
    finally{
      setLoading(false);
    }
  }

  const generateBPublicKey = async () => {
    setLoading(true);
    try{
      console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`)
      // generate the public key using the beneficiary entered private key
      const privateKey = parseInt(beneficiaryPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      const beneficiaryPublicKey = generatePublicKey(privateKey).toString();
      setBeneficiaryPublicKey(beneficiaryPublicKey);
      // store beneficiary public key in contract
      await dmsContract.addBeneficiaryPublicKey(benefactorAddress,walletAddress,beneficiaryPublicKey);
      console.log(`Beneficiary public key: ${beneficiaryPublicKey}`)
      return beneficiaryPublicKey;
    }
    catch(error){
      console.log(`error in generating public key: ${error}`);
    }
    finally{
      setLoading(false);
    }
  }

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
                  <div className='beneficiary-right'>
                    {!countdownStarted && !countdownEnded &&
                      <button 
                        onClick={() => handleEnableSwitch(benefactorAddress.toString())} 
                        disabled={!benefactorAddress}
                      >
                        Enable switch
                      </button>
                    }
                  </div>
              </div>
            </div>
          } pageContent={
                <>
                  <div>
                    <h3>when countdown is over and benefactor is assumed dead, enable the download button</h3>
                    <button>Download</button>
                  </div>

                  

                    {publicKey=="" ? 
                    <div>
                        <input 
                          type="text" 
                          value={beneficiaryPrivateKey} 
                          onChange={(e) => handleKeyChange(e)} 
                          placeholder="Your private key..." 
                        />
                        <button onClick={generateBPublicKey}>Generate Public Key</button>
                      </div>
                    : <></>}

                    
                    {!isAlive && 
                    // only render the following if the benefactor died already
                      <button onClick={generateSecretKey}>Generate Secret Key</button>
                    }
                    
                  

                </>
          }
          user={"beneficiary"}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default BeneficiaryDashboard;
                