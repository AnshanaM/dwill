// code written by the group

import React from "react";
import { ConnectWallet, ThirdwebProvider, embeddedWallet, localWallet, metamaskWallet, useAddress, useContract } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";


interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const navigate = useNavigate();
  console.log("client id: ",constants.DWILL_CLIENT_ID);
  console.log("HELO ",constants.DWILL_CLIENT_ID);
  const address = useAddress();

  const redirectToUploadPage = () => {
    //CHECK FOR SUBSCRIPTION STATUS AND REGISTRATION HERE
    if (address != null) {
      navigate("/upload");
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
      setTimeout(() => {
        window.alert("Please connect your wallet to continue.");
      }, 50);
    }
  };

  const redirectToRegisterPage = () => {
    if (address != null) {
      navigate("/register");
    }
  };
  
  

  return (
    <>
      <div className="container">
        <div className="header">
          <div className="logo-container">
            <img className="logo" src="/images/dwill-logo.png" alt="dWill logo"/>
            <h1 className="title">dWill</h1>
          </div>
          <p className="subtitle">Your will, at your fingertips.</p>
          {(!isInStandaloneMode()) && (
            <div>
              <button className="installButton" onClick={handleInstallClick}>Install App</button>
            </div>
          )}
          <div>
            <ConnectWallet />
          </div>
          <p>verify if benefactor or beneficiary and display login button</p>
          <p className="subtitle">Not a User? <u onClick={redirectToRegisterPage}>Register Now</u></p>
        </div>
        <img className="main-animation" src="/images/dribbble-animation.gif" alt="dribble animation"/>
      </div>

      <h1 className="sub-header">Our Features & Services.</h1>

      <div className="grid">
        <a className="card" target="_blank" rel="noopener noreferrer">
          <img className="icon" src="/images/subscribe.png" alt="subscribe image" />
          <div className="card-text">
            <h2 className="gradient-text-1">Register and subscribe</h2>
            <p>Subscribe to our service and become a benefactor!</p>
          </div>
        </a>
        <div className="card">
          <img className="icon" src="/images/upload-files.png" alt="upload file image"/>
          <div className="card-text">
            <h2 className="gradient-text-2">Upload your files</h2>
            <p>Encrypt and upload your files to the IPFS network.</p>
          </div>
        </div>
        <a className="card" target="_blank" rel="noopener noreferrer">
          <img className="icon" src="/images/add-beneficiary.png" alt="add beneficiary image"/>
          <div className="card-text">
            <h2 className="gradient-text-3">Assign your beneficiaries</h2>
            <p>Distribute your secret keys and assign your beneficiaries files dedicated just for them.</p>
          </div>
        </a>
        <a className="card" target="_blank" rel="noopener noreferrer">
          <img className="icon" src="/images/enable-switch.png" alt="enable switch image"/>
            <div className="card-text">
              <h2 className="gradient-text-3">Enable your switch</h2>
              <p>Enable your very own dead mans switch.</p>
            </div>
        </a>
      </div>

      <div className="build-container">
        <video autoPlay muted loop>
          <source src="/images/bg3.mp4" type="video/mp4" />
        </video>
        <div className="build-header">
          <h1 className="sub-header" style={{marginTop: 0}}>Start building your dead man's switch now!</h1>
          <p style={{fontSize :"20px"}}>Take control of your digital legacy with our decentralized solution.</p>
        </div>
        <button className="installButton" onClick={redirectToUploadPage}>Build</button>
      </div>

      <div className="footer-container">
        {/* <a href="https://lordicon.com/" className="attribution">Icons by Lordicon.com</a> */}
        <p>&copy;Nott-a-Copyright</p>
      </div>
    </>
  );
};

export default MainContent;
