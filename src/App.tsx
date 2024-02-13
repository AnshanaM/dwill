// code written by the group

import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Upload from "./UploadPage";
import Dashboard from "./Dashboard";
import AssignPage from "./AssignPage";

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => void;
}

const App: React.FC<AppProps> = ({ isAppInstalled, handleInstallClick }) => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
          <ThirdwebProvider
            clientId={import.meta.env.VITE_TEMPLATE_CLIENT_ID}
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
            <MainContent handleInstallClick={handleInstallClick} />
          </ThirdwebProvider>} />
          <Route path="upload" element={<ThirdwebProvider clientId={import.meta.env.VITE_TEMPLATE_CLIENT_ID}><Upload /></ThirdwebProvider>} />
          <Route path="dashboard" element={<ThirdwebProvider clientId={import.meta.env.VITE_TEMPLATE_CLIENT_ID}><Dashboard /></ThirdwebProvider>}/>
          <Route path="assign" element={<ThirdwebProvider clientId={import.meta.env.VITE_TEMPLATE_CLIENT_ID}><AssignPage /></ThirdwebProvider>}/>
        </Routes>
    </BrowserRouter>
    </>
  );
};

export default App;