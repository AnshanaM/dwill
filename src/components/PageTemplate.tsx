import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../styles/Page-template.css";
import { ConnectWallet } from '@thirdweb-dev/react';


interface PageTemplateProps {
    pageTitle: ReactNode;
    pageContent: ReactNode;
    address: string;
  }
  
const PageTemplate: React.FC<PageTemplateProps> = ({ pageTitle, pageContent, address }) => {

    const navigate = useNavigate();
    if (address == null) {
      navigate("/");
    }

    return (
    <>
    <div className = "screen">
        <div className="sidebar">
            <Link to="/" className="sidebar-item">
                Home
            </Link>
            <Link to="/dashboard" className="sidebar-item">
                Dashboard
            </Link>
        </div>
        <div className='page-container'>
            <div className= "page-title">
                {pageTitle}
            </div>
            <div className="page-content">
                {pageContent}
            </div>
        </div>
        <div className="wallet">
            <ConnectWallet/>
        </div>
    </div>
  </>
  );
};

export default PageTemplate;
