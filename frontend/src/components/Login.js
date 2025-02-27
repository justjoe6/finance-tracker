import {React,useState} from "react";
import { useNavigate } from 'react-router-dom';


const Login = () => {
    const [email,setEmail]=useState("")
    const [password,setPassword]=useState("")
    const [error,setError]=useState(false)
    const [notFound,setNotFound]=useState(false)
    const navigate = useNavigate()

    const validateUser = async (e) =>{
        e.preventDefault()
        if(!email || !password){
            setError(true)
            return
        }

        let result = await fetch("http://localhost:5000/login",{
            method:"post",
            body:JSON.stringify({email,password}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        if(!result._id){
            console.log("NO USER FOUND")
            setNotFound(true)
            return 
        }
        localStorage.setItem("user",JSON.stringify(result))
        console.log(result)
        navigate("/")
    }
    return (
        <div className="login-container">
            <h1 style={{"fontFamily": "Georgia, serif"}}>LOGIN</h1>
            <form className="login-form" onSubmit={validateUser}>
                <input onChange={(e)=>setEmail(e.target.value)} value={email} className="input-box" type="email" placeholder="Enter Email"></input>
                {error && !email && <p className="input-box-error-msg">Enter email</p>}
                <input onChange={(e)=>setPassword(e.target.value)} value={password} className="input-box" type="password" placeholder="Enter Password"></input>
                {error && !password && <p className="input-box-error-msg">Enter password</p>}
                {notFound && <p className="input-box-error-msg">Invalid username or password</p>}
                <button className="login-btn" type="submit">Login</button>
            </form>
        </div>
    )
}

export default Login;
