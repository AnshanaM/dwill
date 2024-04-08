// code written by the group

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "./styles/Dashboard.css";
import { ConnectWallet, MediaRenderer, Web3Button, useAddress, useContract, useContractRead, useStorageUpload } from '@thirdweb-dev/react';
import * as constants from "./constants";
import PageTemplate from './components/PageTemplate';
import dmsABI from './smart-contracts/DeadMansSwitchABI.json';
import { ethers } from 'ethers';
import { PINATA_API_KEY, PINATA_SECRET_KEY } from './constants'; 
import axios from 'axios';
import JSZip from 'jszip';
import ipfsClient from 'ipfs-http-client';
import fileType from 'file-type';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userType: string | null = searchParams.get("userType");

  const benefactor = userType=="benefactor" ? 1 : 0;
  const [imageUrl, setImageUrl] = useState('');

  const [beneficiaries,setBeneficiary] = useState([{beneficiaryAddress:""}])

  const walletAddress = useAddress();
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const dmsContract = new ethers.Contract(constants.DEAD_MANS_SWITCH_CONTRACT, dmsABI, signer);

  const [ipfsCid, setIpfsCid] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  console.log(imageUrl);

  // Function to get file extension
  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop() || '';
  };

  // Function to render file icons based on file type
  const renderFileIcon = (fileName: string) => {
    const extension = getFileExtension(fileName).toLowerCase();
    return (
      <div>
        {/* <p>File Name: {fileName}</p> */}
        {/* <p>Extension: {extension}</p> */}
        {/* <img src={`/icons/${extension}.png`} alt={`${extension} icon`} /> */}
      </div>
  )};

  const navigate = useNavigate();
  function redirectToHomePage(): void {
    navigate("/");
  }  

  if (walletAddress==null){
    redirectToHomePage();
  }

  const handleAdd=()=>{
      //checks if the prev is not blank
      if (beneficiaries.length === 0 || beneficiaries[beneficiaries.length - 1].beneficiaryAddress.trim() !== '') {
      setBeneficiary([...beneficiaries, { beneficiaryAddress: '' }]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const { name, value } = e.target;
    const updatedBeneficiaries = [...beneficiaries];
    updatedBeneficiaries[i][name] = value;
    setBeneficiary(updatedBeneficiaries);
  };
  
  const handleRemove=(i: number)=>{
    const deleteBeneficiary = [...beneficiaries];
    deleteBeneficiary.splice(i,1);
    setBeneficiary(deleteBeneficiary);
  };

  const handleAssign = (beneficiaryList: { beneficiaryAddress: string; }[]) => {
    //create a set to store unique addresses
    const uniqueAddresses = new Set<string>();
    //iterate and add non-empty unique addresses to the set
    beneficiaryList.forEach(beneficiary => {
      const trimmedAddress = beneficiary.beneficiaryAddress.trim();
      if (trimmedAddress !== '' && !uniqueAddresses.has(trimmedAddress)) {
        uniqueAddresses.add(trimmedAddress);
      }
    });
    //convert the set to arrray
    const uniqueBeneficiaries = Array.from(uniqueAddresses).map(address => ({ beneficiaryAddress: address }));
    console.log(uniqueBeneficiaries);
    uniqueBeneficiaries.forEach(async beneficiary => {
      try {
          await dmsContract.addBeneficiary(beneficiary.beneficiaryAddress);
          console.log(`Added beneficiary: ${beneficiary.beneficiaryAddress}`);
      } catch (error) {
        alert("Beneficiary already exists or some other error");
          console.error(`Error adding beneficiary ${beneficiary.beneficiaryAddress}:`, error);
      }
    });

    //0xb3a97A66169B3D37218e1C65b738cabCFA0bbfca
    //0x3f8724A29fc72Dc694DfdfeE43668f36Df807726
  };

  const handleDisableSwitch = () => {
    try{
      dmsContract.respondToSwitch({from: signer.getAddress()}); 
      alert("Succesfully responded to your switch.");
    }
    catch(error){
      alert("An error occured when responding to your switch.");
    }
      
  }

  const [benefactorAddress, setBenefactor] = useState('');
  const handleAddressChange = (event) => {
    setBenefactor(event.target.value);
  };

  const handleEnableSwitch = async (_benefactor: string) => {
    try{
      console.log(_benefactor);
      if (dmsContract.checkAliveStatus(_benefactor)){
        await dmsContract.enableSwitch(_benefactor,{from: signer.getAddress()}); 
        alert("Successfully enabled your benefactor's dead mans switch.");
      }
      else{
        alert("Benefactor does not exist.");
      }
    }
    catch (error){
      alert("An error occured when enabling your benefactor's switch.");
    }
    

  }

  const handleRetrieveIpfsCid = () => {
    // Make an API call to retrieve the IPFS CIDs or hashes
    axios
      .get('https://api.pinata.cloud/data/pinList?status=pinned', {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      })
      .then(response => {
        const fileCids = response.data.rows.map(row => row.ipfs_pin_hash);
        setIpfsCid(fileCids);
        if (fileCids.length > 0) {
          const cid = fileCids[0]; // Assuming the first CID corresponds to the image
          const imageUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
          setImageUrl(imageUrl);
        }
      })
      .catch(error => {
        console.error('Error retrieving IPFS CIDs:', error);
      });
  };
  
  const handleDownloadFiles = () => {
    // Assuming you have the IPFS CIDs stored in the state variable `ipfsCid`
    if (ipfsCid && ipfsCid.length > 0) {
        // Iterate over each IPFS CID and download the corresponding file
        ipfsCid.forEach(cid => {
            // Generate the IPFS URL for the file
            const ipfsUrl = `https://ipfs.io/ipfs/${cid}`;

            // Fetch the file from IPFS using the CID
            fetch(ipfsUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to download file');
                    }
                    return response.blob(); // Convert response to blob
                })
                .then(blob => {
                    // Create a temporary URL for the blob
                    const blobUrl = URL.createObjectURL(blob);

                    // Create a link element
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';

                    // Set the download attribute to specify the filename
                    link.setAttribute('download', `file_${cid}`);

                    // Trigger file download
                    link.dispatchEvent(new MouseEvent('click'));

                    // Clean up: revoke the temporary URL
                    URL.revokeObjectURL(blobUrl);
                })
                .catch(error => {
                    console.error('Error downloading file:', error);
                });
        });
    } else {
        console.error('IPFS CIDs are empty');
    }
};

const handleDownloadZip = async () => {
  if (ipfsCid && ipfsCid.length > 0) {
      const zip = new JSZip();

      // Iterate over each IPFS CID and add the file to the zip folder
      await Promise.all(
          ipfsCid.map(async (cid, index) => {
              try {
                  const response = await fetch(`https://ipfs.io/ipfs/${cid}`, {
                      responseType: 'blob',
                  });

                  if (!response.ok) {
                      throw new Error('Failed to download file');
                  }

                  const blob = await response.blob();

                  // Get the file name from the CID
                  const fileName = `file_${cid}`;

                  // Add the file to the zip folder
                  zip.file(fileName, blob);
              } catch (error) {
                  console.error(`Error downloading file with CID ${cid}:`, error);
              }
          })
      );

      // Generate the zip file and trigger the download
      zip.generateAsync({ type: 'blob' }).then(blob => {
          const downloadUrl = URL.createObjectURL(blob);

          // Create a temporary link element and trigger the download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = 'ipfs_files.zip';
          link.click();

          // Clean up the temporary URL object
          URL.revokeObjectURL(downloadUrl);
      });
  } else {
      console.error('IPFS CIDs are empty');
  }
};
  useEffect(() => {
    // Retrieve the IPFS CIDs when the component mounts
    handleRetrieveIpfsCid();
  }, []);

  
  return (
    <main>
      <div>
        {walletAddress && 
          <PageTemplate pageTitle={
            <div className='title-container'>
              <h1>Dashboard</h1>
              <div className='right-content'>
                <h2>COUNTDOWN</h2>
                {benefactor ? 
                  //benefactor
                  <button onClick={() => handleDisableSwitch()}>Disable switch</button>
                :
                  //beneficiary
                  <div className='beneficiary-right'>
                    <input 
                      type="text" 
                      value={benefactorAddress} 
                      onChange={(e) => handleAddressChange(e)} 
                      placeholder="Enter benefactor address" 
                    />
                    <button 
                      onClick={() => handleEnableSwitch(benefactorAddress.toString())} 
                      disabled={!benefactorAddress}
                    >
                      Enable switch
                    </button>
                    <div>
              </div>
                  </div>
                }
              </div>
            </div>
          } pageContent={
            <div>


              {/* delete this later */}
              {userType!=null ? <h3>User Type: {userType}</h3> : null}

              {benefactor ?
                <>
                  <div>
                    <h2>Display files here </h2>
                  </div>

                  <div>
                    <h3>when atleast 1 file is selected, enable the encrypt button</h3>
                    <button>Encrypt</button>
                  </div>

                  
                    <div>
                      <button onClick={() => handleDisableSwitch()}>Disable switch</button>
                    </div>
                  
                  

                  <br/>
                  <div>
                    <button onClick={handleAdd}>Add beneficiary</button>
                    {
                      beneficiaries.map((val,i)=>
                      <div>
                        <input name="beneficiaryAddress" value={val.beneficiaryAddress} onChange={(e)=>handleChange(e,i)}/>
                        <button onClick={()=>handleRemove(i)}><b>&times;</b></button>
                      </div>
                      )
                    }
                    <button onClick={() => handleAssign(beneficiaries)}>Assign</button>
                  </div>
                </>

                : //beneficiary section

                <>
                  <div>
                    <h3>when countdown is over and benefactor is assumed dead, enable the download button</h3>
                    <div>
                    {ipfsCid.map((cid, index) => (
                    <div key={index}>
                    {renderFileIcon(cid)} {/* Render file icon */}
                    <p>{cid}</p>
                    </div>
                    ))}
                    </div>
                    <img src="public/images/folder.png" alt="Download Zip File" onClick={handleDownloadZip} style={{ cursor: 'pointer', maxWidth: '300px', maxHeight: '300px' }} />
                    <p></p>
                    <img src="public/images/files.png" alt="Download File" onClick={handleDownloadFiles} style={{ cursor: 'pointer', maxWidth: '300px', maxHeight: '300px'}} />
                    {/* {ipfsCid && <p>IPFS CID: {ipfsCid}</p>} */}
                    {downloadUrl && (
                   <p>
                    <a href={downloadUrl} target="_blank" rel="noopener noreferrer">Download Link
                  </a>
                  </p>
                    )}
                  </div>
                </>
              }

          </div>
          }
          user={userType==null ? "" : userType}
          address={walletAddress} />
        }
      </div>
    </main>
  );
};

export default Dashboard;