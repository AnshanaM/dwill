import React from "react";
import MainContent from "./MainContent";
import { ThirdwebProvider, metamaskWallet, embeddedWallet, localWallet } from "@thirdweb-dev/react";

interface AppProps {
  isAppInstalled: boolean;
  handleInstallClick: () => void;
}

const App: React.FC<AppProps> = ({ isAppInstalled, handleInstallClick }) => {
  return (
    <>
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
      </ThirdwebProvider>
    </>
  );
};

export default App;
