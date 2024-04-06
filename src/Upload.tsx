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
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import crypto from 'crypto';
import Loader from './components/Loader';

const Upload: React.FC = () => {

  const [loading, setLoading] = useState(false);

  const walletAddress = useAddress();

  if (walletAddress == null) {
    const navigate = useNavigate();
    navigate("/");
  }

  const signer = useSigner();

  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);
  const contract = new ethers.Contract(constants.UPLOAD_CONTRACT, UploadABI, signer);

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState(null);

  const [beneficiaryAddressInput, setBeneficiaryAddressInput] = useState("");


  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (file) {
      setLoading(true);
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



        console.log(beneficiaryAddressInput);
        try {
          dmsContract.addIpfsCID(beneficiaryAddressInput, ImgHash, { from: walletAddress });
        }
        catch (e) {
          console.log("error: ", e);
        }

        alert("Successfully uploaded data.");

        let dataArray = await contract.display(walletAddress);
        console.log(dataArray);
        setFile(null);

      } catch (e) {
        alert("Unable to upload image to Pinata");
        console.log(e);
      }
      finally {
        setLoading(false);
      }
    }
    setFile(null);
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0]; //files array of files object
    console.log(data);
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(e.target.files[0]);
    };
    setFileName(e.target.files[0].name);
    e.preventDefault();
  };

  let isConfirmed = false;


  return (
    <main>
      {loading && <Loader lockScroll={true}/>}
      <div>
        {walletAddress &&
          <PageTemplate pageTitle={<h1>Upload</h1>} pageContent={

              <div>
                <form onSubmit={handleSubmit}>

                  <label htmlFor="file-upload">
                    Choose File
                  </label>

                  <input
                    type="file"
                    id="file-upload"
                    name="data"
                    onChange={retrieveFile}
                    className="invisible" />
                  <p className="text-white">File: {fileName}</p>

                  <h3>Enter beneficiary address to assign to:</h3>
                    <input
                      type="text"
                      value={beneficiaryAddressInput}
                      onChange={(e) => setBeneficiaryAddressInput(e.target.value)}
                    />

                  <button type="submit" className="newBtn" disabled={!file}>
                    Upload File
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