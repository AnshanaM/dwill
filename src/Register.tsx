// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";

const Register: React.FC = () => {

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
      <div style={{margin: '1rem'}}>
        <h1>Register</h1>
        <div>
          {address && (
            <div>
              <ConnectWallet/>
              <img className="icon" src="/images/home.gif" alt="home icon" onClick={redirectToHomePage}/>
              {isRegisterContractLoading ? (
                <p>Loading...</p>
              ) : (
                <div>
                  <div>
                    <input type="text" id="register-address" placeholder={address} />                   
                  </div>
                  <img className="icon" src="/images/dashboard.gif" alt="dashboard icon" onClick={redirectToDashboard}/>
                </div>
              )}

            </div>
          )}
          
          
        </div>
       
        

      </div>
    </main>
  );
};

export default Register;