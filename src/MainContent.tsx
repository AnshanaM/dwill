// code written by the group

import React, { useRef, useState, useEffect } from "react";
import { ConnectWallet, darkTheme, useAddress } from "@thirdweb-dev/react";
import "./styles/Home.css";
import { isInStandaloneMode } from "./utils";
import { useNavigate } from "react-router-dom";
import * as constants from "./constants";
import {scroller } from "react-scroll";
import subscriptionABI from './smart-contracts/SubscriptionABI.json';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import benefactorRegistrationABI from './smart-contracts/RegistrationABI.json';
import signalABI from './smart-contracts/SignalABI.json';
import { ethers } from "ethers";

interface MainContentProps {
  handleInstallClick: () => void;
}

const MainContent: React.FC<MainContentProps> = ({ handleInstallClick }) => {

  const SUBSCRIPTION_PAYMENT = '0.001';
  const RENEWAL_PAYMENT = '0.0005';
  const [copied, setCopied] = useState(false); // Track whether address is copied
  const [benefactorAddress, setBenefactorAddress] = useState('');
  // Instantiate the BenefactorRegistration contract
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const benefactorRegistrationContract = new ethers.Contract(
    constants.OWNER_REGISTRATION, 
    benefactorRegistrationABI, 
    signer
  );
  const communicationContract = new ethers.Contract(
    constants.SIGNAL,
    signalABI,
    signer
  );

  const [isBeneficiary, setIsBeneficiary] = useState<boolean | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showCheckPopup, setCheckShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const navigate = useNavigate();
  // console.log("client id: ",constants.DWILL_CLIENT_ID);

  const WalletAddress: string = useAddress() || ""; 

  console.log("address: ", WalletAddress);

  const buildContainerRef = useRef<HTMLDivElement>(null);

  const handleStartNowClick = () => {
    if (buildContainerRef.current) {
      scroller.scrollTo("container", {
        duration: 800,
        smooth: true,
      });
    }
  };

  const sendMessageToBeneficiary = async (logoutTime: string) => {
    try {
        // Call the sendMessage function on the smart contract with the logout time as the message
        await communicationContract.sendMessage(logoutTime);  
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Error sending message. Please try again.");
    }
  };

  const handlelogout = async () => {
    console.log("user logged out");
    // Store current date and time to localStorage
    const logoutTime = new Date().toISOString();
    localStorage.setItem(`logoutTime_${WalletAddress}`, logoutTime);
    alert("Please confirm Metamask transaction before leaving the page.");
    sendMessageToBeneficiary(logoutTime);
  };

  const registerAsBenefactor = async () => {
    try {
        // Call the isBenefactor function from the smart contract
        const isRegistered = await benefactorRegistrationContract.isBenefactor();
        if (isRegistered) {
            alert("You are already registered as a benefactor.");
            navigate("/BenefactorDashboard");
        } else {
            // If not registered, register the user as a benefactor
            const transaction = await benefactorRegistrationContract.registerBenefactor();
            await transaction.wait();
            alert("You have successfully registered as a benefactor.");
            navigate("/BenefactorDashboard");
        }
    } catch (error) {
        console.error("Error registering as a benefactor:", error);
        alert("Error registering as a benefactor. Please try again.");
    }
  };

  const handlenavigatedashboard = async () => {
    const isRegistered = await benefactorRegistrationContract.isBenefactor();
    if (isRegistered) {
        navigate("/BenefactorDashboard");
    } else {
        alert("Please subcscribe.");
    }  
  };

  const handleSubscribe = async () => {
    registerAsBenefactor();
  };

  const handleBeneficiary = async () => {
    try {
      // Call the isBeneficiary function from the smart contract
      const isBeneficiary = await benefactorRegistrationContract.isBeneficiary(inputValue);

      if (isBeneficiary) {
        // User is a beneficiary, navigate to the dashboard
        navigate("/BeneficiaryDashboard");
      } else {
        // User is not a beneficiary, display an error message
        alert('You are not a beneficiary of the entered benefactor.');
      }
    } catch (error) {
      console.error('Error checking beneficiary status:', error);
      alert('An error occurred while checking beneficiary status. Please try again.');
    }
  };

  const handleCheckBeneficiary = async () => {
    try {
      // Call the isBeneficiary function from the smart contract
      const benefactorAddress = await benefactorRegistrationContract.getBenefactorAddress(WalletAddress);
      const isBeneficiary = await benefactorRegistrationContract.isBeneficiary(benefactorAddress);

      if (isBeneficiary) {
        // User is a beneficiary, navigate to the dashboard
        setBenefactorAddress(benefactorAddress);
        handleOpenCheckPopUp();
        console.log('Benefactor address:', benefactorAddress);
      } else {
        // User is not a beneficiary, display an error message
        alert('You are not a beneficiary of any benefactor.');
      }
      
    } catch (error) {
      console.error('Error checking beneficiary status:', error);
      alert('An error occurred while checking beneficiary status. Please try again.');
    }
  };

  const handlecheckusertype = async (sender: string): Promise<boolean> => {
    try {
        const isBeneficiary = await benefactorRegistrationContract.isBeneficiary(sender);

        if (isBeneficiary) {
            setIsBeneficiary(true);
            console.log("you are beneficiary of :", sender);
        } else {
            setIsBeneficiary(false);
            console.log("you are not beneficiary of :", sender);
        }

        return isBeneficiary; // Return the boolean value
    } catch (error) {
        console.error('Error checking user status:', error);
        alert('An error occurred while checking user status. Please try again.');
        return false; // Return false in case of error
    }
}


  const handleOpenPopUp = async () => {
    setShowPopup(true);
  };

  const handleClosePopUp = async () => {
    setShowPopup(false);
  };

  const handleOpenCheckPopUp = async () => {
    setCheckShowPopup(true);
  };

  const handleCloseCheckPopUp = async () => {
    setCheckShowPopup(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(benefactorAddress);
      setCopied(true); // Update state to indicate address is copied
      setTimeout(() => setCopied(false), 3000); // Reset copied state after 3 seconds
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('An error occurred while copying to clipboard. Please try again.');
    }
  };

  useEffect(() => {
    // Listen for MessageSent events emitted by the smart contract
    communicationContract.on("MessageSent", async (sender, message) => {
        console.log("Message received:", sender, message);

        try {
            const isBeneficiary = await handlecheckusertype(sender);

            if (isBeneficiary) {
                localStorage.setItem(`logoutTime`, message);
            } else {
                console.log("you are not beneficiary of :", sender);
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            alert('An error occurred while checking user status. Please try again.');
        }
        // handleInactivityCountdown();
    });

    // Cleanup the event listener when the component unmounts
    return () => {
        communicationContract.removeAllListeners("MessageSent");
    };
  }, []);


  return (
    <>
    <main>
      <div className="nav-bar">
        <img className="logo" src="/images/logo.png" alt="dWill logo"/>
        <p className="nav-bar-item">Home</p>
        <p className="nav-bar-item">About</p>        
        <p className="nav-bar-item">Install</p> 
        <p className="nav-bar-item">
        <ConnectWallet
            auth={{
              loginOptional: true,
              onLogin(token: any) {
                  console.log("user logged in", token);
              },
              onLogout: handlelogout,
            }}
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
              <button onClick={handleSubscribe}>Subscribe</button>
              <p>Already subscribed? <u onClick={handlenavigatedashboard}>Go to dashboard.</u></p>
          </div>
          <div className="beneficiary">
              <h2>I am a beneficiary.</h2>
              <img src="../images/beneficiary-1.png"/>
              <h3>I am here to claim my assets.</h3>
              <button onClick={handleOpenPopUp}>Dashboard</button>
              <p>Are you a beneficiary? <u onClick={handleCheckBeneficiary}>Check here.</u></p>
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
                <button onClick={handleBeneficiary} className="landing-button">Log In</button>
              </div>
            }
            {showCheckPopup && 
              <div className="popup">
                <button className="close-btn" onClick={handleCloseCheckPopUp}><b>&times;</b></button>
                    <h3>Your benefactor's address:</h3>
                    <p>{benefactorAddress}</p>
                <button onClick={copyToClipboard} className="landing-button">{copied ? 'Copied' : 'Copy'}</button>
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
