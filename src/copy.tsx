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


const BenefactorDashboard: React.FC = () => {

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const [countdown, setCountdown] = useState("Benefactor is alive.");
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [countdownEnded, setCountdownEnded] = useState(false);

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

  // const handleAssign = (beneficiaryList: { beneficiaryAddress: string; }[]) => {
  //   setLoading(true);
  //   const uniqueAddresses = new Set<string>();
  //   beneficiaryList.forEach(beneficiary => {
  //     const trimmedAddress = beneficiary.beneficiaryAddress.trim();
  //     if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
  //       uniqueAddresses.add(trimmedAddress);
  //     }
  //   });
  //   const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));
  //   console.log(uniqueBeneficiaries);
  //   uniqueBeneficiaries.forEach(async beneficiary => {
  //     try {
  //       await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress, { from: walletAddress });
  //         console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);    
  //         //benefactor notify beneficiary to generate their keys
  //         //beneficiary must go to their dashboard and click generate keys button
  //     } catch (error) {
  //       alert("Beneficiary already exists or some other error");
  //         console.error(`Error adding beneficiary ${beneficiary.beneficiaryAddress}:`, error);
  //     }
  //     finally{
  //       setLoading(false);
  //     }
  //   });
  // };

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


  const handleDisableSwitch = () => {
    setLoading(true);
    try{
      dmsContract.respondToSwitch({from: signer.getAddress()}); 
      alert("Succesfully responded to your switch.");
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

  // useEffect(() => {
  //   if (!isAlive){
  //     navigate("/");
  //     alert("Benefactor is dead");
  //   }
  //   else{
  //     setCountdown("Benefactor is alive")
  //   }
  // },[]);

  // useEffect(() => {
  //   const getData = async () => {
  //     setLoading(true);
  //     try {
  //       const tx = await dmsContract.getBenefactorData(walletAddress);
  //       const receipt = await tx.wait(); // Wait for the transaction to be confirmed
  //       console.log("Receipt:", receipt);
  //       console.log("Events in receipt:", receipt.events);
  //       const event = receipt.events.find(event => event.event === "BenefactorsData"); // Assuming your contract emits an event with the return values
  //       console.log("Event:", event);
  //       if (event) {
  //         const { switchStatus, beneficiaries, remainingTime, isAlive} = event.args; // Access the return values from the event
  //         console.log('Switch status:', switchStatus);
  //         console.log('Beneficiaries:', beneficiaries);
  //         console.log('Remaining time:', remainingTime);
  //         console.log('Is alive?', isAlive);
  //         setAliveStatus(isAlive);
  //         setRemainingTime(remainingTime);
  //         setCountdownStarted(true);
  //         setCountdownEnded(false);
  //         (isAlive) ? setCountdown("Benefactor is alive") : setCountdown(formatCountdown(remainingTime));
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
        const tx = await dmsContract.getBenefactorData(walletAddress);
        const receipt = await tx.wait();
        const event = receipt.events.find(event => event.event === "BenefactorsData");
        if (event) {
          const { switchStatus, beneficiaries, remainingTime, isAlive} = event.args;
          // setCountdown(isAlive ? "Benefactor is alive." : formatCountdown(remainingTime));
          setCountdown(!isAlive  ? "Benefactor is dead." : switchStatus ? formatCountdown(remainingTime) : "Benefactor is alive.");
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
            <div>
                <>
                  <div>
                    <h2>Display files here </h2>
                  </div>

                  <div>
                    <h3>when atleast 1 file is selected, enable the encrypt button</h3>
                    <button>Encrypt</button>
                  </div>

                  
                    <div>
                      <button onClick={() => handleDisableSwitch()}>Disable switch</button>
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