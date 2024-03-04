// code written by the group

import React, { useRef, useState } from "react";
import { ConnectWallet, darkTheme, useAddress } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";
import {scroller } from "react-scroll";
import subscriptionABI from './smart-contracts/SubscriptionABI.json';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from "ethers";



interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const SUBSCRIPTION_PAYMENT = '0.001';
  const RENEWAL_PAYMENT = '0.0005';

  const [successBenefactor, setSuccessBenefactor] = useState(false); 
  const [showPopup, setShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();
  console.log("client id: ",constants.DWILL_CLIENT_ID);

  const address = useAddress();

  const redirectToDashboard = (userType: string) => {
    if (address!=null){
      navigate(`/dashboard?userType=${userType}`);
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
          redirectToDashboard("benefactor");
        } else if (status === "within grace period, requires renewal") {
          if (confirm("Your subscription is within the grace period. Click confirm to renew your subscription.")){
            handleRenewal();
          }
          else{
            redirectToDashboard("benefactor");
          }
        } else if (status === "no need to renew, subscription is valid") {
          alert("Your subscription is valid. Redirecting to dashboard.");
          redirectToDashboard("benefactor");
        }
      });
      //call the checkSubscriptionStatus function
      await contract.checkSubscriptionStatus(signer.getAddress());
  
    } catch (error) {
      console.error('Error subscribing:', error);
      (address === null) ? alert('Connect your wallet to continue.') : alert('Error.');
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
      const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
      await dmsContract.setBenefactor();
      setSuccessBenefactor(true);
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
          redirectToDashboard("benefactor");
        }
      });
      //call the checkSubscriptionStatus function
      await contract.checkSubscriptionStatus(signer.getAddress());
  
    } catch (error) {
      console.error('Error renewing:', error);
      (address === null) ? alert('Connect your wallet to renew.') : alert('Error.');
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
      setSuccessBenefactor(true);
    } catch (error) {
      console.error('Error renewing:', error);
      alert('Error renewing');
    }
  };

  const handleRegister = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {
        const contract = new ethers.Contract(constants.SUBSCRIPTION_CONTRACT, subscriptionABI, signer);
        //subscribe to the Status event
        contract.on("Status", async (subscriber, status) => {
          console.log("Subscription status:", status);
          if (status === "expired" || status === "not subscribed") {
            alert("The address you have provided does not belong to a subscribed benefactor.");
          } else {
            const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
            const isBeneficiary = await dmsContract.isBeneficiary(inputValue,signer.getAddress());
            const benefactorIsAlive = await dmsContract.checkAliveStatus(inputValue);
            isBeneficiary && benefactorIsAlive ? redirectToDashboard("beneficiary") : alert("You are not a beneficiary of the specified benefactor or the benefactor does not exist.");
          }
        });
        //call the checkSubscriptionStatus function
        await contract.checkSubscriptionStatus(signer.getAddress());
      } catch (error) {
        console.error('Error:', error);
        (address === null) ? alert('Connect your wallet to continue.') : alert('Error.');
      }
      handleClosePopUp();
  };

  const handleOpenPopUp = async () => {
    setShowPopup(true);
  };

  const handleClosePopUp = async () => {
    setShowPopup(false);
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
              {successBenefactor ? 
              <button onClick={redirectToDashboard("benefactor")}>Dashboard</button>:
              <button onClick={handleSubscribe}>Subscribe</button>
              }
              {/* <button onClick={handleSubscribe}>Subscribe</button> */}
              <p>Already subscribed? <u onClick={handleRenewal}>Renew here.</u></p>
          </div>
          <div className="beneficiary">
              <h2>I am a beneficiary.</h2>
              <img src="../images/beneficiary-1.png"/>
              <h3>I am here to claim my assets.</h3>
              <button onClick={handleOpenPopUp}>Dashboard</button>
              <p>Already registered? <u onClick={handleOpenPopUp}>Login here.</u></p>
          </div>
            {showPopup && 
              <div className="popup">
                <button className="close-btn" onClick={handleClosePopUp}><b>&times;</b></button>
                <h3>Enter your benefactor's address:</h3>
                <input
                  className="input-popup"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <button onClick={handleRegister} className="landing-button">Log in</button>
              </div>
            }
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

        <div className="video-container">
          <h1 className="sub-header">What is dWill?</h1>
          <iframe width="100%" height="100%" 
                  src="https://www.youtube.com/embed/olUxebermWw?si=dHH4n5-sucnibDCI" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen></iframe>
        </div>

        <div className="footer-container">
          <p>&copy;Nott-a-Copyright</p>
        </div>
        
      </main>

    </>
  );
};

export default MainContent;
