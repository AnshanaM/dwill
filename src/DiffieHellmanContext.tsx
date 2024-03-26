import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { createDiffieHellman, DiffieHellman } from 'crypto';

// Define the type for Diffie-Hellman object
type DiffieHellmanType = DiffieHellman | null; // Adjust this to match the type of your Diffie-Hellman object

interface DiffieHellmanContextType {
  diffieHellman: DiffieHellmanType;
  setDiffieHellman: (dh: DiffieHellmanType) => void;
}

// Create the context with an initial value of null
const DiffieHellmanContext = createContext<DiffieHellmanContextType>({
  diffieHellman: null,
  setDiffieHellman: () => {},
});

// Provider component to manage the Diffie-Hellman context
export const DiffieHellmanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diffieHellman, setDiffieHellman] = useState<DiffieHellmanType>(null);

  // You can initialize diffieHellman here if needed
  useEffect(() => {
    setDiffieHellman(createDiffieHellman(256));
  }, []);
  

  return (
    <DiffieHellmanContext.Provider value={{ diffieHellman, setDiffieHellman }}>
      {children}
    </DiffieHellmanContext.Provider>
  );
};

// Custom hook to access the Diffie-Hellman context
export const useDiffieHellman = () => useContext(DiffieHellmanContext);
