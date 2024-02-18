// code written by the group

import React, { useRef, useState } from "react";
import { ConnectWallet, ThirdwebProvider, Web3Button, darkTheme, embeddedWallet, localWallet, metamaskWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";
import { Link, scroller } from "react-scroll";


interface MainContentProps {
  handleInstallClick: () => boolean;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const navigate = useNavigate();
  console.log("client id: ",constants.DWILL_CLIENT_ID);

  const address = useAddress();
  const {contract} = useContract(constants.OWNER_REGISTRATION);

  const redirectToDashboard = () => {
    if (address!=null){
      navigate("/dashboard");
    }
    else{
      navigate("/");
    }
  }

  // const buildContainerRef = useRef<HTMLDivElement>(null);
  // const handleStartNowClick = () => {
  //   if (buildContainerRef.current) {
  //     scroller.scrollTo("split-section", {
  //       duration: 800,
  //       smooth: true,
  //     });
  //   }
  // };

  const {
    data: isRegistered,
    isLoading: isLoading,
    error: error
  } = useContractRead(contract, "isBenefactor",[],{
    blockTag: "latest",
    from: address,
    }
  );

  const subscribe  =() => {

  }

  const register  =() => {

  }
  

  return (
    <>
      <div className="container">
        <video autoPlay muted loop>
          <source src="/images/blocks-bg.mp4" type="video/mp4" />
        </video>

        <div className="nav-bar">
          <img className="logo" src="/images/logo.png" alt="dWill logo"/>
          <p className="nav-bar-item">Home</p>
          <p className="nav-bar-item">About</p>
          {(!isInStandaloneMode()) && (
            handleInstallClick() ? 
            <p className="nav-bar-item" onClick={handleInstallClick}>Install</p> : <></>
          )}
          <div className="nav-bar-item">
              {isRegistered
                ? 
                <p className="nav-bar-item" onClick={redirectToDashboard}>Dashboard</p>
                :
                address && 
                  <Web3Button
                    contractAddress = {constants.OWNER_REGISTRATION}
                    action={(contract)=> contract.call("registerBenefactor")}
                    onError={() => alert("Insufficient funds.")}
                    onSuccess={() => {navigate("/")}}
                    >Sign up
                  </Web3Button>
              }
          </div>
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
        <div className="header">
          <div className="benefactor">
              <h2>Distribute your assets.</h2>
              <h3>Secure your will.</h3>
              <p>As a benefactor, you hold the power to secure your assets. Subscribe to our service to begin building your dead mans switch today.</p>
              <button onClick={subscribe}>Subscribe</button>
              <p>Already a subscriber? <u>Renew here.</u></p>
          </div>
          <div className="beneficiary">
              <h2>Claim my assets.</h2>
              <h3>Ensure your inheritance.</h3>
              <p>As a beneficiary, you can easily gain access to your designated assets. Register to secure your rightful inheritance with ease.</p>
              <button onClick={register}>Register</button>
              <p>Already registered? <u>Login here.</u></p>
          </div>
        </div>
      </div>


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

      {/* <div className="split-section" ref={buildContainerRef}>
      </div> */}

      <div className="footer-container">
        <p>&copy;Nott-a-Copyright</p>
      </div>

    </>
  );
};

export default MainContent;
