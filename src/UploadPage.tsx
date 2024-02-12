// code written by the group

import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./styles/UploadPage.css";
import { ConnectWallet, MediaRenderer, useAddress, useStorageUpload } from '@thirdweb-dev/react';
import {useState} from 'react';


const UploadPage: React.FC = () => {

  const address = useAddress();
  const navigate = useNavigate();
  const redirectToHomePage = () => {
    navigate("/");
  };

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
      <div>
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
          <input type="file" onChange={(e) => {
            if (e.target.files) {
              setFile(e.target.files[0]);
            }
          }}/>
          <button onClick = {uploadToIPFS} >Upload</button>
          
        </div>

      </div>
    </main>
  );
};

export default UploadPage;