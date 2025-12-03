import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setUserRole }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
            const res = await axios.post(`${apiUrl}/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem('role', res.data.role);
                setUserRole(res.data.role);
                navigate('/dashboard');
            }
        } catch (err) {
            alert('Invalid Credentials');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-box">
                <h2 style={{color: '#333', marginBottom: '20px'}}>Finance Portal Login</h2>
                
                <input 
                    placeholder="Username" 
                    onChange={e => setUsername(e.target.value)} 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    onChange={e => setPassword(e.target.value)} 
                />
                
                <button 
                    className="btn-primary" 
                    style={{width: '100%', marginTop: '20px', fontSize: '16px'}} 
                    onClick={handleLogin}
                >
                    Secure Login
                </button>

                
            </div>
        </div>
    );
}
export default Login;