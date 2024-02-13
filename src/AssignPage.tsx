// code written by the group

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, useAddress, useStorageUpload } from '@thirdweb-dev/react';


const AssignPage: React.FC = () => {

  const address = useAddress();
  const navigate = useNavigate();
  const redirectToHomePage = () => {
    navigate("/");
  };

  const redirectToDashboard = () => {
    navigate("/dashboard");
  }

  if (address == null) {
    redirectToHomePage();
  }

  return (
    <main>
      <div style={{margin: '1rem'}}>
        <h1>Assign Beneficiaries</h1>
        <div>
          {address && (
            <ConnectWallet/>
          )}
        </div>
        <div>
          <img className="icon" src="/images/home.gif" alt="home icon" onClick={redirectToHomePage}/>
        </div>
        <div>
          <img className="icon" src="/images/dashboard.gif" alt="dashboard icon" onClick={redirectToDashboard}/>
        </div>
        <div>!Display countdown here!</div>
        <div style={{margin: "1rem"}}>
          <button>Create Switch</button>
        </div>

      </div>
    </main>
  );
};

export default AssignPage;