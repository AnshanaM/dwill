// code written by the group

import React, { useState } from 'react';
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
  const searchParams = new URLSearchParams(location.search);

  const [loading, setLoading] = useState(false);

  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const [benefactorAddress, setBenefactor] = useState('');
  const [beneficiaryPrivateKey, setBeneficiaryPrivateKey] = useState('');

//   const { diffieHellman } = useDiffieHellman();


  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }


  const handleAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactor(event.target.value);
  };

  const handleKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryPrivateKey(event.target.value);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    setLoading(true);
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
    finally{
      setLoading(false);
    }
  }

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
      const beneficiaryPublicKey = generatePublicKey(privateKey);
      // store beneficiary public key in contract
      await dmsContract.addBeneficiaryPublicKey(benefactorAddress,walletAddress,beneficiaryPublicKey.toString());
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
                <h2>COUNTDOWN</h2>
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
              </div>
            </div>
          } pageContent={
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
          user={"beneficiary"}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default BeneficiaryDashboard;
                