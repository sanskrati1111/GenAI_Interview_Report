import React, {useState, useEffect} from 'react';
import '../auth.form.scss'
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router';


const Login = () => {
    const {loading, user, handleLogin} = useAuth();
    const navigate = useNavigate();
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [error, setError] = useState("");
    
    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/");
        }
    }, [user, navigate]);
    
    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");
        
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();
        
        if (!trimmedEmail || !trimmedPassword) {
            setError("Email and password are required");
            return;
        }
        
        const result = await handleLogin({email: trimmedEmail, password: trimmedPassword})
        if (result.success) {
            setEmail("");
            setPassword("");
            navigate("/")
        } else {
            setError(result.message || "Invalid email or password");
        }
    }

    if(loading){
        return (<main><h1>Loading....</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h1 className='title'>Login</h1>
                {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input 
                    value={email}
                    onChange={(e)=> {setEmail(e.target.value)}}
                    type="email" id="email" name="email" placeholder='Enter Email address'/>

                </div> 

                <div className="input-group">   
                    <label htmlFor="password">Password</label>
                    <input
                    value={password}
                    onChange={(e)=> {setPassword(e.target.value)}}
                    type="password" id="password" name="password" placeholder='Enter Password'/>
                </div>

                <button className = "button primary-button" type="submit" disabled={loading}>Login</button>
            </form>  

            <p>Don't have an Account? <Link to={"/register"}>Register</Link></p> 

</div>
        </main>
    );
}

export default Login;