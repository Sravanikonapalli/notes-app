import React from "react";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Note from "./components/Note";
import './App.css'
import Home from "./components/Home";
function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/notes" element={<Note />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
