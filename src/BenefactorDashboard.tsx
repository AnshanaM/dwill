// code written by the group

import React, { useState } from 'react';
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

  const handleAssign = (beneficiaryList: { beneficiaryAddress: string; }[]) => {
    setLoading(true);
    const uniqueAddresses = new Set<string>();
    beneficiaryList.forEach(beneficiary => {
      const trimmedAddress = beneficiary.beneficiaryAddress.trim();
      if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
        uniqueAddresses.add(trimmedAddress);
      }
    });
    const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));
    console.log(uniqueBeneficiaries);
    uniqueBeneficiaries.forEach(async beneficiary => {
      try {
        await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress, { from: walletAddress });
          console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);    
          //benefactor notify beneficiary to generate their keys
          //beneficiary must go to their dashboard and click generate keys button
      } catch (error) {
        alert("Beneficiary already exists or some other error");
          console.error(`Error adding beneficiary ${beneficiary.beneficiaryAddress}:`, error);
      }
      finally{
        setLoading(false);
      }
    });
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

  return (
    <main>
      {loading && <Loader lockScroll={true}/>}
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>
                <h2>COUNTDOWN</h2>
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