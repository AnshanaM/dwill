// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';

const Register: React.FC = () => {

  const walletAddress = useAddress();

  // registration logic here
  // after registration, redirect to home page and maybe prompt to connect wallet?
  const {
    data: contract,
    isLoading: isRegisterContractLoading
  } = useContract(constants.OWNER_REGISTRATION);


  function register() {
    //use contract write to add to smart contract

  }
  
  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={<h1>Register</h1>} pageContent={<div>hello world</div>} address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Register;