import React, { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/Page-template.css";
import { ConnectWallet, darkTheme, useAddress } from '@thirdweb-dev/react';
import { TiUpload, TiThMenu, TiHome, TiStopwatch, TiThLarge, TiDownload } from "react-icons/ti";
import { SiLetsencrypt } from "react-icons/Si";
import { FaWallet } from "react-icons/fa";
import signalABI from '../smart-contracts/SignalABI.json';
import benefactorRegistrationABI from '../smart-contracts/RegistrationABI.json';
import { ethers } from 'ethers';
import * as constants from "../constants";

interface PageTemplateProps {
    pageTitle: ReactNode;
    pageContent: ReactNode;
    // user:string;
    address: string;
}

const PageTemplateBenefactor: React.FC<PageTemplateProps> = ({ pageTitle, pageContent, address}) => {
    const WalletAddress: string = useAddress() || ""; 
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar visibility
    const navigate = useNavigate();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const communicationContract = new ethers.Contract(
        constants.SIGNAL,
        signalABI,
        signer
    );
    const benefactorRegistrationContract = new ethers.Contract(
        constants.OWNER_REGISTRATION, 
        benefactorRegistrationABI, 
        signer
    );

    if (WalletAddress == null) {
        navigate("/");
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
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
    

    return (
        <div className="screen">
            <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="logo-content">
                    <Link to="/">
                        <img className={`logo ${isSidebarOpen ? 'open' : 'closed'}`} src={isSidebarOpen ? "/images/logo.png" : "/images/icon-192x192.png"} alt="dWill logo" />
                    </Link>
                </div>
                <ul>
                    <li>
                        <div className="sidebar-toggle" onClick={toggleSidebar}>
                            <TiThMenu className='icon' />
                            {
                                isSidebarOpen ? <span>Menu</span> : <></>
                            }
                        </div>
                    </li>
                    <li>
                        <Link to="/">
                            <TiHome className='icon' />
                            {
                                isSidebarOpen ? <span>Home</span> : <></>
                            }
                        </Link>
                    </li>

                    <li>
                        <Link to="/Benefactordashboard">
                            <TiThLarge className='icon' />
                            {
                                isSidebarOpen ? <span>Dashboard</span> : <></>
                            }
                        </Link>
                    </li>
                    <li>
                        <Link to="/upload">
                            <TiUpload className='icon' />
                            {
                                isSidebarOpen ? <span>Upload</span> : <></>
                            }
                        </Link>
                    </li>
                    
                </ul>
                <div className="wallet">
                    {isSidebarOpen ? 
                    <ConnectWallet
                        auth={{
                            loginOptional: true,
                            onLogin(token: any) {
                                console.log("user logged in", token);
                                navigate("/Benefactordashboard");
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
                                connectedButtonBgHover: "#645c82",
                                secondaryButtonText: "#bab4d2",
                            },
                        })}
                        modalTitleIconUrl={""}
                        />
                    :
                    <div>
                        <FaWallet className='icon' onClick={toggleSidebar} />
                    </div>
                }
                </div>
            </div>
            <div className='page-container'>
                <div className="page-title">
                    {pageTitle}
                </div>
                <div className="page-content">
                    {pageContent}
                </div>
            </div>
        </div>
    );
};

export default PageTemplateBenefactor;
