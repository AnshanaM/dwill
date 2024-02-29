// code written by the group

import React, { useRef, useState } from "react";
import { ConnectWallet, ThirdwebProvider, Web3Button, darkTheme, embeddedWallet, localWallet, metamaskWallet, useAddress, useContract, useContractRead,useSDK } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";
import { Link, scroller } from "react-scroll";
import signer from './App';
import subscriptionABI from './smart-contracts/SubscriptionABI.json';
import registrationABI from './smart-contracts/RegistrationABI.json';
import Web3 from 'web3';
import { ethers } from "ethers";
import { sign } from "web3/lib/commonjs/eth.exports";



interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const SUBSCRIPTION_PAYMENT = '0.001';
  const RENEWAL_PAYMENT = '0.0005';

  const [success, setSuccess] = useState(false); 

  const navigate = useNavigate();
  console.log("client id: ",constants.DWILL_CLIENT_ID);

  const address = useAddress();

  const redirectToDashboard = () => {
    if (address!=null){
      navigate("/dashboard");
    }
    else{
      navigate("/");
    }
  }

  const buildContainerRef = useRef<HTMLDivElement>(null);
  const handleStartNowClick = () => {
    if (buildContainerRef.current) {
      scroller.scrollTo("container", {
        duration: 800,
        smooth: true,
      });
    }
  };

  const handleSubscribe = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
      const contract = new ethers.Contract(constants.SUBSCRIPTION_CONTRACT, subscriptionABI, signer);
  
      //subscribe to the Status event
      contract.on("Status", (subscriber, status) => {
        console.log("Subscription status:", status);
        if (status === "expired" || status === "not subscribed") {
          //subscription status is EXPIRED or NEW, proceed with subscription
          subscribe(contract, signer);
        } else if (status === "within grace period, requires renewal") {
          if (confirm("Your subscription is within the grace period. Click confirm to renew your subscription.")){
            handleRenewal();
          }
          else{
            redirectToDashboard();
          }
        } else if (status === "no need to renew, subscription is valid") {
          alert("Your subscription is valid. Redirecting to dashboard.");
          redirectToDashboard();
        }
      });
  
      //call the checkSubscriptionStatus function
      await contract.checkSubscriptionStatus(signer.getAddress());
  
    } catch (error) {
      console.error('Error subscribing:', error);
      (address == null) ? alert('Connect your wallet to continue.') : alert('Error.');
    }
  };
  
  const subscribe = async (contract, signer) => {
    try {
      //subscription status is either NEW or EXPIRED, proceed with subscription
      const transaction = await contract.subscribe({
        value: ethers.utils.parseEther(SUBSCRIPTION_PAYMENT)
      });
      await transaction.wait();
      console.log('Subscription successful');
      alert('Subscription successful');
      const registerContract = new ethers.Contract(constants.OWNER_REGISTRATION,registrationABI,signer);
      await registerContract.registerBenefactor();
      setSuccess(true);
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Error subscribing');
    }
  };
  
  const handleRenewal = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    try {
      const contract = new ethers.Contract(constants.SUBSCRIPTION_CONTRACT, subscriptionABI, signer);
  
      //subscribe to the Status event
      contract.on("Status", (subscriber, status) => {
        console.log("Subscription status:", status);
        if (status === "expired" || status === "not subscribed") {
          alert("You are not subscribed.");
        } else if (status === "within grace period, requires renewal") {
          alert("Your subscription is within the grace period. Renewing your subscription...");
          renew(contract, signer);
        } else if (status === "no need to renew, subscription is valid") {
          alert("Your subscription is valid. Redirecting to dashboard.");
          redirectToDashboard();
        }
      });
      //call the checkSubscriptionStatus function
      await contract.checkSubscriptionStatus(signer.getAddress());
  
    } catch (error) {
      console.error('Error renewing:', error);
      (address == null) ? alert('Connect your wallet to renew.') : alert('Error.');
    }
  }

const renew = async (contract, signer) => {
    try {
      const transaction = await contract.subscribe({
        value: ethers.utils.parseEther(RENEWAL_PAYMENT)
      });
      await transaction.wait();
      console.log('Renewal successful');
      alert('Renewal successful');
      setSuccess(true);
    } catch (error) {
      console.error('Error renewing:', error);
      alert('Error renewing');
    }
  };

  const handleRegister = async () => {

  };

  return (
    <>
    <main>
      <div className="nav-bar">
        <img className="logo" src="/images/logo.png" alt="dWill logo"/>
        <p className="nav-bar-item">Home</p>
        <p className="nav-bar-item">About</p>
        {(!isInStandaloneMode()) && (
          handleInstallClick ? 
          <p className="nav-bar-item" onClick={handleInstallClick}>Install</p> : <></>
        )}
        <p className="nav-bar-item" onClick={redirectToDashboard}>Dashboard</p>
        <p className="nav-bar-item" >
        <ConnectWallet
          theme={darkTheme({
              colors: {
              primaryText: "#d9d9d9",
              accentText: "#707ddb",
              accentButtonBg: "#bab4d2",
              modalBg: "#21212c",
              danger: "#db6d6d",
              secondaryText: "#bab4d2",
              accentButtonText: "#d9d9d9",
              primaryButtonBg: "#bab4d2",
              primaryButtonText: "#21212c",
              secondaryButtonBg: "#191a1f",
              secondaryButtonHoverBg: "#21212c",
              connectedButtonBg: "#191a1f",
              connectedButtonBgHover: "#21212c",
              secondaryButtonText: "#bab4d2",
              },
          })}
          modalTitleIconUrl={""}
          />
        </p>
      </div>

      <div className="landing-page">
        <video autoPlay muted loop>
          <source src="/images/bg-landing-pg.mp4" type="video/mp4" />
        </video>
        <h1>Your will, at your fingertips.</h1>
        {/* <div className="button-container"> */}
          <button className="landing-button" onClick={handleStartNowClick}>Start now!</button>
        {/* </div> */}
      </div>

          
      <div className="container" ref={buildContainerRef}>
        <div className="choice">
          <div className="benefactor">
              <h2>I am a benefactor.</h2>
              <img src="../images/benefactor-1.png"/>
              <h3>I am here to allot my assets.</h3>
              {success?
              <button onClick={redirectToDashboard}>Dashboard</button>:
              <button onClick={handleSubscribe}>Subscribe</button>
              }
              <p>Already subscribed? <u onClick={handleSubscribe}>Login here.</u></p>
          </div>
          <div className="beneficiary">
              <h2>I am a beneficiary.</h2>
              <img src="../images/beneficiary-1.png"/>
              <h3>I am here to claim my assets.</h3>

              {/* get benefactor address first and then check if benefactor exists */}
              {/* if so, then pass into isBeneficiary in benefactor registration contract */}
              <button onClick={handleRegister}>Register</button>
              <p>Already registered? <u>Login here.</u></p>
          </div>
        </div>
      </div>

        <div>
          <h1 className="sub-header">Our Features & Services.</h1>
          <div className="grid">
            <a className="card" target="_blank" rel="noopener noreferrer">
              <img className="icon" src="/images/subscribe.png" alt="subscribe image" />
              <div className="card-text">
                <h2 className="card-text-color">Register and subscribe</h2>
                <p>Subscribe to our service and become a benefactor!</p>
              </div>
            </a>
            <div className="card">
              <img className="icon" src="/images/upload-files.png" alt="upload file image"/>
              <div className="card-text">
                <h2 className="card-text-color">Upload your files</h2>
                <p>Encrypt and upload your files to the IPFS network.</p>
              </div>
            </div>
            <a className="card" target="_blank" rel="noopener noreferrer">
              <img className="icon" src="/images/add-beneficiary.png" alt="add beneficiary image"/>
              <div className="card-text">
                <h2 className="card-text-color">Assign your beneficiaries</h2>
                <p>Distribute your secret keys and assign your beneficiaries files dedicated just for them.</p>
              </div>
            </a>
            <a className="card" target="_blank" rel="noopener noreferrer">
              <img className="icon" src="/images/enable-switch.png" alt="enable switch image"/>
                <div className="card-text">
                  <h2 className="card-text-color">Enable your switch</h2>
                  <p>Enable your very own dead mans switch.</p>
                </div>
            </a>
          </div>
        </div>

        <div className="footer-container">
          <p>&copy;Nott-a-Copyright</p>
        </div>
        
      </main>

    </>
  );
};

export default MainContent;
