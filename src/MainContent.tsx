import React from "react";
import { ConnectWallet } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";

interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {
  const RegisterUser = () => {
    // registration logic here
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
            <div className="connect">
              <button className="installButton" onClick={handleInstallClick}>Install App</button>
            </div>
          )}
          <div className="connect">
            <ConnectWallet />
          </div>
          <p className="subtitle">Not a User? <u onClick={RegisterUser}>Register Now</u></p>
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
        <a className="card" target="_blank" rel="noopener noreferrer">
          <img className="icon" src="/images/upload-files.png" alt="upload file image"/>
          <div className="card-text">
            <h2 className="gradient-text-2">Upload your files</h2>
            <p>Encrypt and upload your files to the IPFS network.</p>
          </div>
        </a>
        <a className="card" target="_blank" rel="noopener noreferrer">
          <img className="icon" src="/images/add-beneficiary.png" alt="add beneficiary image"/>
          <div className="card-text">
            <h2 className="gradient-text-3">Assign your beneficiaries</h2>
            <p>Assign your trustees to the files dedicated just for them.</p>
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

      <div className="footer-container">
        {/* <a href="https://lordicon.com/" className="attribution">Icons by Lordicon.com</a> */}
        <p>&copy;Nott-a-Copyright</p>
      </div>
    </>
  );
};

export default MainContent;
