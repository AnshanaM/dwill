// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import PageTemplate from './components/PageTemplate';
import { useAddress} from '@thirdweb-dev/react';
import crypto from 'crypto';

const Encrypt: React.FC = () => {

  const walletAddress = useAddress();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncryptionKey(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const algorithm = 'aes-256-ctr';

  // //encrypt function
  const encrypt = (buffer) => {
      //create an initialization vector
      const initVector = crypto.randomBytes(16);
      //create new cipher using algo, key and initVector
      const cipher = crypto.createCipheriv(algorithm,encryptionKey,initVector);
      //create new encrypted buffer
      const result = Buffer.concat([initVector,cipher.update(buffer),cipher.final()]);
      return result;
  }

  const handleDownload = () => {
    if (encryptionKey && file) {
      // Read file content
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const fileContent = reader.result.toString();
          // Encrypt file content with provided key
          // const encryptedFile = CryptoJS.AES.encrypt(fileContent, encryptionKey).toString();

          const encryptedFile = encrypt(fileContent).toString();

          // Create a temporary link for downloading the encrypted file
          const downloadLink = document.createElement('a');
          downloadLink.href = `data:application/octet-stream,${encodeURIComponent(encryptedFile)}`;
          downloadLink.download = 'encrypted_file';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      reader.readAsText(file);
    }
  };

//   const signer = useSigner();
//   const activeChain = 'mumbai'
//   const clientId = constants.DWILL_CLIENT_ID;

  return (
    <main>
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Encrypt Files</h1>} pageContent={

            // <ThirdwebProvider
            //   activeChain={activeChain}
            //   clientId={clientId}>
            //   <div>
            //   </div>
            // </ThirdwebProvider>
            
            <div>
                <input
                    type="text"
                    placeholder="Enter encryption key"
                    value={encryptionKey}
                    onChange={handleEncryptionKeyChange}
                />
                <br />
                <input type="file" onChange={handleFileUpload} />
                <br />
                <button onClick={handleDownload} disabled={!encryptionKey || !file}>
                    Download Encrypted File
                </button>
            </div>

          } address={walletAddress} user='benefactor' />
        }
      </div>
    </main>
  );
};

export default Encrypt;