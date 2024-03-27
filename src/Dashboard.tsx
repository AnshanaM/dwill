// code written by the group

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import { useDiffieHellman} from './DiffieHellmanContext';


const Dashboard: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userType: string | null = searchParams.get("userType");

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const benefactor = userType=="benefactor" ? 1 : 0;

  const [beneficiaries,setBeneficiary] = useState([{beneficiaryAddress:""}])

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const [benefactorAddress, setBenefactor] = useState('');
  const [beneficiaryPrivateKey, setBeneficiaryPrivateKey] = useState('');

  const { diffieHellman } = useDiffieHellman();


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
        await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress, { from: walletAddress });
          console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);    
          //benefactor notify beneficiary to generate their keys
          //beneficiary must go to their dashboard and click generate keys button
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

  const handleAddressChange = (event) => {
    setBenefactor(event.target.value);
  };

  const handleKeyChange = (event) => {
    setBeneficiaryPrivateKey(event.target.value);
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

  const generateSecretKey = async () => {
    // get benefactor public key from contract
    const benefactorPublicKey = await dmsContract.getBenefactorPublicKey(benefactorAddress,walletAddress);
    console.log(`Benefactor public key: ${benefactorPublicKey}`)
    // generate the secret key using beneficiarys public key and benefactors private key
    console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`)
    const privateKey = parseInt(beneficiaryPrivateKey, 16);
    const secretKey = computeSecret(benefactorPublicKey, privateKey);
    console.log(`Secret key: ${secretKey}`);

    // beneficiary notify benefactor that keys are already generated

  }

  const generateBPublicKey = async () => {
    console.log(`Beneficiary private key: ${beneficiaryPrivateKey}`)
    // generate the public key using the beneficiary entered private key
    const privateKey = parseInt(beneficiaryPrivateKey, 16);
    const beneficiaryPublicKey = generatePublicKey(privateKey, diffieHellman.prime, diffieHellman.generator);
    // store beneficiary public key in contract
    await dmsContract.addBeneficiaryPublicKey(benefactorAddress,walletAddress,beneficiaryPublicKey);
    console.log(`Beneficiary public key: ${beneficiaryPublicKey}`)
    return beneficiaryPublicKey;
  }

  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>
                <h2>COUNTDOWN</h2>
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
                    <button 
                      onClick={() => handleEnableSwitch(benefactorAddress.toString())} 
                      disabled={!benefactorAddress}
                    >
                      Enable switch
                    </button>
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

                : //beneficiary section

                <>
                  <div>
                    <h3>when countdown is over and benefactor is assumed dead, enable the download button</h3>
                    <button>Download</button>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      value={benefactorAddress} 
                      onChange={(e) => handleAddressChange(e)} 
                      placeholder="Enter benefactor address" 
                    />
                    <input 
                      type="text" 
                      value={beneficiaryPrivateKey} 
                      onChange={(e) => handleKeyChange(e)} 
                      placeholder="Enter your private key" 
                    />
                    {/* check if public key in contract is "", if so then render the following, otherwise dont render it at all */}
                    <button onClick={generateBPublicKey}>Generate Public Key</button>
                    {/* only render the following if the benefactor died already */}
                    <button onClick={generateSecretKey}>Generate Secret Key</button>
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