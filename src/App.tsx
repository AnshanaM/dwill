// code written by the group

import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet, ConnectWallet, darkTheme, ThirdwebSDKProvider } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Upload from "./Upload";
import Encrypt from "./Encrypt";
import Dashboard from "./Dashboard";
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
      sdkOptions = {{
        gasless: {
          openzeppelin: {
            relayerUrl: "https://api.defender.openzeppelin.com/actions/70ae7380-4054-4d94-8315-5cbcead43541/runs/webhook/2faa3202-68cb-44dd-87c0-73dc37bee14b/VFZKX2W1zc8mL7Ndgvhqtw"
          }
        }
      }}
      supportedWallets={[
        metamaskWallet(),
        embeddedWallet({
          auth: {
            options: ["email", "google"]
          }
        }),
        localWallet()
      ]}
    >
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainContent handleInstallClick={handleInstallClick} />}/>
            <Route path="upload" element={<Upload />} />
            <Route path="dashboard" element={<Dashboard />}/>
            <Route path="encrypt" element={<Encrypt />}/>
          </Routes>
      </BrowserRouter>

    </ThirdwebProvider>
    </>
    
  );
};

export default App;