// code written by the group

import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet, ConnectWallet, darkTheme } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Upload from "./Upload";
import Dashboard from "./Dashboard";
import AssignPage from "./AssignPage";
import Download from "./Download";
import Encrypt from "./Encrypt";
import MySwitch from "./MySwitch";
import * as constants from "./constants";

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => boolean;
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
    >
      
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainContent handleInstallClick={handleInstallClick} />}/>
            <Route path="encrypt" element={<Encrypt />} />
            <Route path="upload" element={<Upload />} />
            <Route path="download" element={<Download />} />
            <Route path="my-switch" element={<MySwitch />} />
            <Route path="dashboard" element={<Dashboard />}/>
            <Route path="assign" element={<AssignPage />}/>

          </Routes>
      </BrowserRouter>
    </ThirdwebProvider>
    </>
    
  );
};

export default App;