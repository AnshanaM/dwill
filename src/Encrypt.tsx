// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Encrypt.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';

const Encrypt: React.FC = () => {

  const walletAddress = useAddress();
  const navigate = useNavigate();

  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }
  
  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={<h1>Encrypt files here</h1>} pageContent={
            <div>
              <div>Files</div>
            </div>
          }
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Encrypt;