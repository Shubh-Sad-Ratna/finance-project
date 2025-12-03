import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));

  const handleLogout = () => {
    localStorage.removeItem('role');
    setUserRole(null);
  };

  return (
    <Router>
      <div className="App">
        {userRole && <button onClick={handleLogout} style={{float:'right', margin: '10px'}}>Logout</button>}
        <Routes>
          <Route path="/" element={userRole ? <Navigate to="/dashboard" /> : <Login setUserRole={setUserRole} />} />
          <Route path="/dashboard" element={userRole ? <Dashboard role={userRole} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;