import { useState, useEffect } from 'react';
import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
    
    const navigate = useNavigate();

    const [username,setUsername] = useState("");
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState("");


    const {loading, user, handleRegister} = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        
        if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
            setError("All fields are required");
            return;
        }

        const result = await handleRegister({username: trimmedUsername, email: trimmedEmail, password: trimmedPassword})
        if (result.success) {
            setUsername("");
            setEmail("");
            setPassword("");
            navigate("/")
        } else {
            setError(result.message || "Registration failed. Email may already be in use.");
        }

    }
    if(loading){
        return (<main><h1>Loading....</h1></main>)
    }
    
    return (
        <main>
            <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h1 className='title'>Register</h1>
                {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
                <div className="input-group">
                    <label htmlFor="email">Username</label>
                    <input 
                    value={username}
                    onChange={(e)=>{setUsername(e.target.value)} }
                    type="text" id="username" name="username" placeholder='Enter username'/>

                </div>

                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input 
                    value={email}
                    onChange={(e)=>{setEmail(e.target.value)} }
                    type="email" id="email" name="email" placeholder='Enter Email address'/>

                </div> 

                <div className="input-group">   
                    <label htmlFor="password">Password</label>
                    <input 
                    value={password}
                    onChange={(e)=>{setPassword(e.target.value)} }
                    type="password" id="password" name="password" placeholder='Enter Password'/>
                </div>

                <button className = "button primary-button" type="submit" disabled={loading}>Register</button>
            </form> 

            <p>Already have an Account? <Link to={"/login"}>Login</Link></p> 
</div>
        </main>
    );
}


export default Register;