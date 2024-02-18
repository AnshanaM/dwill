// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Download.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';

const Download: React.FC = () => {

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
          <PageTemplate pageTitle={<h1>Download Files</h1>} pageContent={
            <div>
              <div>Download</div>
            </div>
          }
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Download;