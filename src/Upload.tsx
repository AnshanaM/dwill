import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, ThirdwebProvider, Web3Button, useAddress, useContract, useContractRead, useSigner, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import axios from 'axios';
import { ethers } from 'ethers';
import UploadABI from './smart-contracts/UploadABI.json';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import crypto from 'crypto';
import Loader from './components/Loader';

const Upload: React.FC = () => {

  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState([]);

  const walletAddress = useAddress();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const signer = useSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const contract = new ethers.Contract(constants.UPLOAD_CONTRACT, UploadABI, signer);

  const [beneficiaryAddressInput, setBeneficiaryAddressInput] = useState("");

  const [secretKey, setSecretKey] = useState("");

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (files.length > 0) {
      setLoading(true);
      try {
        const formDataArray = files.map(file => {
          const formData = new FormData();
          formData.append("file", file);
          return formData;
        });
  
        const uploadPromises = formDataArray.map(formData => {
          return axios({
            method: "post",
            url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data: formData,
            headers: {
              pinata_api_key: constants.PINATA_API_KEY,
              pinata_secret_api_key: constants.PINATA_SECRET_KEY,
              "Content-Type": "multipart/form-data",
            },
          });
        });
  
        const resFiles = await Promise.all(uploadPromises);
        const imgHashes = resFiles.map(resFile => resFile.data.IpfsHash);
  
        const encryptHashes = (imgHashes, secretKey) => {
          const encryptedHashes = imgHashes.map(hash => {
            const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(secretKey, 'utf8'), Buffer.alloc(16));
            let encrypted = cipher.update(hash, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted;
          });
          return encryptedHashes;
        };
        
        
        const encryptedHashes = encryptHashes(imgHashes,secretKey);
        console.log(`Encrypted hashes: ${encryptedHashes}`);
        decryptHashes(encryptedHashes,secretKey);
        await dmsContract.addIpfsCIDs(beneficiaryAddressInput, encryptedHashes, { from: walletAddress });
  
        alert("Successfully uploaded data.");
  
        let dataArray = await contract.display(walletAddress);
        console.log(dataArray);
        setFiles([]);
        setFileNames([]);
  
      } catch (e) {
        alert("Unable to upload image to Pinata");
        console.log(e);
      }
      finally {
        setLoading(false);
      }
    }
  };
  

  const retrieveFiles = (e) => {
    const fileList = e.target.files;
    const fileArray = Array.from(fileList);
    setFiles(fileArray);

    const fileNameArray = fileArray.map(file => file.name);
    setFileNames(fileNameArray);
    e.preventDefault();
  };

  const decryptHashes = (encryptedHashes, secretKey) => {
    const decryptedHashes = encryptedHashes.map(encryptedHash => {
      const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(secretKey, 'utf8'), Buffer.alloc(16));
      let decrypted = decipher.update(encryptedHash, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    });
    console.log(`decrypted: ${decryptedHashes}`);
  };
  

  return (
    <main>
      {loading && <Loader lockScroll={true} />}
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Upload</h1>} pageContent={

            <div>
              <form onSubmit={handleSubmit}>

                <label htmlFor="file-upload">
                  Choose File(s)
                </label>

                <input
                  type="file"
                  id="file-upload"
                  name="data"
                  onChange={retrieveFiles}
                  className="invisible"
                  multiple
                />
                <p className="text-white">Files: {fileNames.join(', ')}</p>

                <h3>Enter beneficiary address to assign to:</h3>
                <input
                  type="text"
                  value={beneficiaryAddressInput}
                  onChange={(e) => setBeneficiaryAddressInput(e.target.value)}
                />
                <h3>Enter secret key to encrypt hash:</h3>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                />

                <button type="submit" className="newBtn" disabled={files.length === 0}>
                  Upload File(s)
                </button>

              </form>
            </div>

          } address={walletAddress} user='benefactor' />
        }
      </div>
    </main>
  );
};

export default Upload;