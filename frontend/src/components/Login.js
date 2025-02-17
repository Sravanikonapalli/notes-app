import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import '../styles/login.css';
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/login', {
        email,
        password,
      });

      if (response.data.jwtToken) {  
        localStorage.setItem('jwtToken', response.data.jwtToken); 
        console.log("Logged in successfully");
        navigate("/notes"); 
      } else {
        setError("Login failed");
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError("Login failed");
    }
};


  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div className="input-filed">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-filed">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p>{error}</p>}
        <button type="submit">Login</button>
        <p>No account yet? <a href="/signup">Signup</a></p>
      </form>
    </div>
  );
}

export default Login;
