// code written by the group

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, ThirdwebProvider, Web3Button, useAddress, useContract, useContractRead, useSigner, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import axios from 'axios';
import { ethers } from 'ethers';
import UploadABI from './smart-contracts/UploadABI.json';

const Upload: React.FC = () => {

  const walletAddress = useAddress();

  if (walletAddress==null){
    const navigate = useNavigate();
    navigate("/");
  }


  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);
  const contract = new ethers.Contract(constants.UPLOAD_CONTRACT,UploadABI,useSigner());

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();

    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: constants.PINATA_API_KEY,
            pinata_secret_api_key: constants.PINATA_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });
        
        const ImgHash = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
        isConfirmed = true;
        // uploadConfirmation();
        console.log(ImgHash);

        contract.add(walletAddress, ImgHash);
        console.log(ImgHash);

        alert("Successfully Image Uploaded");
        // setFileName("No image selected");
        setFile(null);
      } catch (e) {
        alert("Unable to upload image to Pinata");
      }
    }
    // alert("Successfully Image Uploaded");
    // setFileName("No image selected");
    setFile(null);

  };

  const retrieveFile = (e: { target: { files: { name: React.SetStateAction<null>; }[]; }; preventDefault: () => void; }) => {
    const data = e.target.files[0]; //files array of files object
    // console.log(data);
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(e.target.files[0]);
    };
    setFileName(e.target.files[0].name);
    e.preventDefault();
  };

  const activeChain = 'mumbai'
  const clientId = constants.DWILL_CLIENT_ID;
  let isConfirmed = false;

  // pop up window

  const uploadConfirmation = () => {
    if (isConfirmed) {
      console.log("Upload confirmed");
      return (
        <div className="w-80 h-80 bg-white rounded-xl shadow-md flex flex-col justify-center items-center">
          <p className="textArea">Image: {fileName}</p>
        </div>
      )
    } else {
      return null;
    }
  }
  
  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={<h1>Upload</h1>} pageContent={
            <ThirdwebProvider
            activeChain={activeChain}
            clientId={clientId}>
            <div>
              <form onSubmit={handleSubmit}>
                <label htmlFor="file-upload" className="newBtn">
                  Choose File
                </label>
                <input
                  type="file"
                  id="file-upload"
                  name="data"
                  onChange={retrieveFile}
                />
                <p className="text-white">File: {fileName}</p>
                <button type="submit" className="newBtn" disabled={!file}>
                  Upload File
                </button>
              </form>
            </div>
          </ThirdwebProvider>
            

          } address={walletAddress} user='benefactor'/>
        }
      </div>
    </main>
  );
};

export default Upload;