// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import PageTemplate from './components/PageTemplate';
import { useAddress} from '@thirdweb-dev/react';
import crypto from 'crypto';
import * as constants from "./constants";
import { createDiffieHellman, DiffieHellman } from 'crypto';
import { ethers } from 'ethers';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';

const Encrypt: React.FC = () => {

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncryptionKey(e.target.value);
  };

  const handleBeneficiaryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryAddress(e.target.value);
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
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const fileContent = reader.result.toString();
          //encrypt file content with provided key
          // const encryptedFile = CryptoJS.AES.encrypt(fileContent, encryptionKey).toString();

          const encryptedFile = encrypt(fileContent).toString();

          // create a temporary link for downloading the encrypted file
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

  const generateKeys = async () => {
    console.log(`Beneficiary address: ${beneficiaryAddress}`);
    const benefactorDH: DiffieHellman = createDiffieHellman(15);
    benefactorDH.generateKeys();
    await dmsContract.addBenefactorPublicKey(walletAddress,beneficiaryAddress,benefactorDH.getPublicKey('hex'));
    const beneficiaryPublicKey = dmsContract.getBeneficiaryPublicKey(walletAddress,beneficiaryAddress);
    const benefactorSecret: string = benefactorDH.computeSecret(beneficiaryPublicKey, 'hex', 'hex');
    console.log(benefactorSecret)
    setEncryptionKey(benefactorSecret)
  };

  return (
    <main>
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Encrypt Files</h1>} pageContent={            
            <div>
                <input
                    type="text"
                    placeholder="Enter Beneficiary Address: "
                    value={beneficiaryAddress}
                    onChange={handleBeneficiaryAddressChange}
                />
                <button onClick={generateKeys}><b>Generate Keys</b></button>

                <br />

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