// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';

const Dashboard: React.FC = () => {

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
          <PageTemplate pageTitle={<h1>Dashboard</h1>} pageContent={
            <div>
              <div>
                <h2>Display files here </h2>
              </div>
    
              <div>!Display countdown here for both benefactor and beneficiaries!</div>
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', width: '10rem', margin: '1rem'}}>
                <button>Disable switch for owner</button>
                <button>Enable switch for trustee</button>
              </div>
          </div>
          }
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Dashboard;