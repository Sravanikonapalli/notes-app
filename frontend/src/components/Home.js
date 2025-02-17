import React from "react";
import { useNavigate } from "react-router-dom";
import '../styles/home.css';

function Home() {
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate('/login'); 
  };

  return (
    <div className="home-container">
      <h1>Welcome to Notes App</h1>
      <p>Manage all your important notes easily and effectively.</p>
      <button onClick={handleLoginRedirect} className="login-btn">
        Login
      </button>
    </div>
  );
}

export default Home;
