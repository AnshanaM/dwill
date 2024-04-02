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
import { useDiffieHellman } from './DiffieHellmanContext';

const Encrypt: React.FC = () => {

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();


  const { computeSecret, generatePublicKey } = useDiffieHellman();

  const { diffieHellman } = useDiffieHellman();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  const [beneficiaryAddress, setBeneficiaryAddress] = useState<string>('');

  const [benefactorPrivateKey, setBenefactorPrivateKey] = useState<string>('');

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const handleEncryptionKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEncryptionKey(e.target.value);
  };

  const handleBeneficiaryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiaryAddress(e.target.value);
  };

  const handleBenefactorPrivateKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBenefactorPrivateKey(e.target.value);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const algorithm = 'aes-128-ctr';

  const deriveIV = (buffer: crypto.BinaryLike) => {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest().slice(0, 16);
}

  // //encrypt function
  const encrypt = (buffer: crypto.BinaryLike) => {
      //create an initialization vector
      const initVector = deriveIV(buffer);
      console.log(`init vector for encryption: ${initVector}`);
      const key = encryptionKey.slice(0,16);
      console.log("16 bytes key: ",key);
      //create new cipher using algo, key and initVector
      const cipher = crypto.createCipheriv(algorithm,key,initVector);
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

  const generateSecretKeys = async () => {
      console.log(`Beneficiary address: ${beneficiaryAddress}`);
      console.log(`Benefactor private key: ${benefactorPrivateKey}`);
      // get benefactors private key
      const privateKey = parseInt(benefactorPrivateKey, 16);
      console.log(`Private key: ${privateKey}`);
      // generate public key from private key
      const benefactorPublicKey = generatePublicKey(privateKey);
      // store benefacotrs public key in the contract
      await dmsContract.addBenefactorPublicKey(walletAddress,beneficiaryAddress,benefactorPublicKey.toString());
      console.log(`Benefactor public key: ${benefactorPublicKey}`);
      // get beneficiary's public key from smart contract
      const beneficiaryPublicKey = await dmsContract.getBeneficiaryPublicKey(walletAddress,beneficiaryAddress);
      console.log(`Beneficiary public key: ${beneficiaryPublicKey}`);
      // generate the secret key using beneficiarys public key and benefactors private key
      const secretKey = computeSecret(parseInt(beneficiaryPublicKey), privateKey);
      console.log(`Secret key: ${secretKey}`);
      // ensure secretKey is not null before setting encryption key state variable
      if (secretKey !== null) {
          // set the encryption key state variable as this secret key
          setEncryptionKey(secretKey.toString());
      } else {
          console.error("Failed to compute secret key.");
      }
  };

  return (
    <main>
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Encrypt Files</h1>} pageContent={            
            <div>
                <input
                    type="text"
                    placeholder="Enter Beneficiary Address "
                    value={beneficiaryAddress}
                    onChange={handleBeneficiaryAddressChange}
                />
                <input
                    type="text"
                    placeholder="Enter your private key "
                    value={benefactorPrivateKey}
                    onChange={handleBenefactorPrivateKeyChange}
                />

                {/* only render this button if the beneficiary has already generated their keys!! */}
                <button onClick={generateSecretKeys}><b>Generate Keys</b></button>

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