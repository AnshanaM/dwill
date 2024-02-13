// code written by the group

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, useAddress, useStorageUpload } from '@thirdweb-dev/react';
import {useState} from 'react';
import { redirect } from 'next/dist/server/api-utils';


const UploadPage: React.FC = () => {

  const address = useAddress();
  const navigate = useNavigate();

  const redirectToHomePage = () => {
    navigate("/");
  };

  const redirectToDashboard = () => {
    navigate("/dashboard");
  }

  const redirectToAssignPage = () => {
    navigate("/assign");
  }

  if (address == null) {
    redirectToHomePage();
  }


  const [file,setFile] = useState<any>();
  const { mutateAsync: upload } = useStorageUpload();
  const uploadToIPFS = async () => {
    const uploadURL = await upload({
      data: [file],
      options: {
        uploadWithGatewayUrl: true,
        uploadWithoutDirectory: true
      }
    })
    console.log("Upload URL: ",uploadURL[0]);
    <div>
      <p>
        {uploadURL[0]}
      </p>
    </div>
  }

  return (
    <main>
      <div style={{margin: '1rem'}}>
        <h1>Upload Page</h1>
        <div>
          {address && (
            <ConnectWallet/>
          )}
        </div>
        <div>
          <img className="icon" src="/images/home.gif" alt="home icon" onClick={redirectToHomePage}/>
        </div>
        <div>
          <img className="icon" src="/images/dashboard.gif" alt="dashboard icon" onClick={redirectToDashboard}/>
        </div>

        <div>
          <input type="file" onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
            }
          }}/>
          <button onClick = {uploadToIPFS} >Upload</button>
          
        </div>

        <div>
          <button style={{margin: '1rem'}} onClick={redirectToAssignPage}>Assign Beneficiaries</button>
        </div>

      </div>
    </main>
  );
};

export default UploadPage;