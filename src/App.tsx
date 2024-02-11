import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet } from "@thirdweb-dev/react";
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import UploadPage from "./UploadPage";

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => void;
}

const App: React.FC<AppProps> = ({ isAppInstalled, handleInstallClick }) => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ThirdwebProvider
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
          <Route path="upload" element={<UploadPage />} />
        </Routes>
    </BrowserRouter>
    </>
  );
};

export default App;