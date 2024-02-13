// code written by the group

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, useAddress } from '@thirdweb-dev/react';


const Dashboard: React.FC = () => {

  const address = useAddress();
  const navigate = useNavigate();
  const redirectToHomePage = () => {
    navigate("/");
  };

  if (address == null) {
    redirectToHomePage();
  }

  return (
    <main>
      <div style={{margin: '1rem'}}>
        <h1>Dashboard</h1>
        <div>
          {address && (
            <ConnectWallet/>
          )}
        </div>
        <div>
          <img className="icon" src="/images/home.gif" alt="home icon" onClick={redirectToHomePage}/>
        </div>
        
        <div>
          <h2>Display files here </h2>
        </div>

        <div>!Display countdown here for both benefactor and beneficiaries!</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', width: '10rem', margin: '1rem'}}>
          <button>Disable switch for owner</button>
          <button>Enable switch for trustee</button>
        </div>
        

      </div>
    </main>
  );
};

export default Dashboard;