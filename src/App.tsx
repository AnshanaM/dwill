// code written by the group

import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet, ConnectWallet, darkTheme, ThirdwebSDKProvider } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Upload from "./Upload";
import BeneficiaryDashboard from "./BeneficiaryDashboard";
import BenefactorDashboard from "./BenefactorDashboard";
import * as constants from "./constants";
import {ethers} from "ethers";

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => void;
}

const App: React.FC<AppProps> = ({ isAppInstalled, handleInstallClick }) => {

  return (
    <>
    <ThirdwebProvider
      clientId={constants.DWILL_CLIENT_ID}
      activeChain="mumbai"
      supportedWallets={[
        metamaskWallet(),
        embeddedWallet({
          auth: {
            options: ["email", "google"]
          }
        }),
        localWallet()
      ]}
      authConfig={{
        authUrl: "/api/auth",
        domain: "http://localhost:5173",
      }}
    >
      
        <BrowserRouter>
          <Routes>

            <Route path="/" element={<MainContent handleInstallClick={handleInstallClick} />}/>
            <Route path="upload" element={<Upload />} />
            <Route path="Beneficiarydashboard" element={<BeneficiaryDashboard />}/>
            <Route path="Benefactordashboard" element={<BenefactorDashboard />}/>
            
          </Routes>
        </BrowserRouter>
    </ThirdwebProvider>
    </>
    
  );
};

export default App;