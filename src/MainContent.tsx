// code written by the group

import React, { useState } from "react";
import { ConnectWallet, ThirdwebProvider, Web3Button, darkTheme, embeddedWallet, localWallet, metamaskWallet, useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";
import { FEATURE_NFT_SHARED_METADATA } from "@thirdweb-dev/sdk/dist/declarations/src/evm/constants/erc721-features";


interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const navigate = useNavigate();
  console.log("client id: ",constants.DWILL_CLIENT_ID);

  const address = useAddress();

  const {contract} = useContract(constants.OWNER_REGISTRATION);

  // const [newValue, setNewValue] = useState((address!=null) ? address : "" );


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

  const redirectToDashboard = () => {
    if (address!=null){
      navigate("/dashboard");
    }
    else{
      navigate("/");
    }
  }

  const redirectToRegister = () => {
    if (address!=null){
      navigate("/upload");
    }
    else{
      navigate("/");
    }
  }

  const {
    data: isRegistered,
    isLoading: isLoading,
    error: error
  } = useContractRead(contract, "isBenefactor",[],{
    blockTag: "latest",
    from: address,
    }
  );
  

  return (
    <>
      <div className="container">
        <video autoPlay muted loop>
          <source src="/images/bg2-with-overlay.mp4" type="video/mp4" />
        </video>

        <div className="nav-bar">
          <img className="logo" src="/images/logo.png" alt="dWill logo"/>
          <p className="nav-bar-item">Home</p>
          <p className="nav-bar-item">About</p>
          {(!isInStandaloneMode()) && (
            <p className="nav-bar-item" onClick={handleInstallClick}>Install</p>
          )}
          <div className="nav-bar-item">
              {isRegistered
                ? 
                <button className="installButton" onClick={redirectToRegister}>Login</button> 
                :
                address && 
                  <Web3Button
                    contractAddress = {constants.OWNER_REGISTRATION}
                    action={(contract)=> contract.call("registerBenefactor")}
                    onError={() => alert("Insufficient funds.")}
                    onSuccess={() => {redirectToRegister}}
                    >Sign up
                  </Web3Button>
                
              }
          </div>
          <p className="nav-bar-item" >
          <ConnectWallet
            theme={darkTheme({
                colors: {
                primaryText: "#d9d9d9",
                accentText: "##707ddb",
                accentButtonBg: "#706ddb",
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
                },
            })}
            modalTitleIconUrl={""}
            />
          </p>

        </div>
        <div className="header">
          <h1 className="title">Your will, at your fingertips.</h1>
          <p className="title-p"><b>Seize control of your legacy: dWill makes will creation and management simple and secure</b></p>
        </div>
        {/* <img className="main-animation" src="/images/dribbble-animation.gif" alt="dribble animation"/> */}
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

      <div className="build-container">
        {/* <video autoPlay muted loop>
          <source src="/images/bg3.mp4" type="video/mp4" />
        </video> */}
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
