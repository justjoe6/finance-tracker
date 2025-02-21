import {React,useState} from "react";
import { useNavigate } from 'react-router-dom';




const Signup = ()=>{
    const [username,setUsername]=useState("")
    const [email,setEmail]=useState("")
    const [password,setPassword]=useState("")
    const [rePassword,setRepassword]=useState("")
    const [error,setError]=useState(false)
    const navigate = useNavigate()
    const addUser = async (e) => {
        e.preventDefault()
        if(!username || !email || !password || !rePassword || password!==rePassword){
            setError(true)
            return
        }

        let result = await fetch("http://localhost:5000/signup",{
            method:"post",
            body:JSON.stringify({username,email,password}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        console.log(result)
        localStorage.setItem("user",JSON.stringify(result))

        navigate("/home")
    }

    return (<div className="signup-container">
        <h1 style={{"fontFamily": "Georgia, serif"}}>Sign Up</h1>
        <form className="signup-form" onSubmit={addUser}>
        <input onChange={(e)=>setUsername(e.target.value)} value = {username} className="input-box" placeholder="Enter username" type="text"></input>
        {error && !username && <p className="input-box-error-msg">Enter username</p>}
        <input onChange={(e)=>setEmail(e.target.value)} value = {email} className="input-box" placeholder="Enter email" type="email"></input>
        {error && !email && <p className="input-box-error-msg">Enter email</p>}
        <input onChange={(e)=>setPassword(e.target.value)} value = {password} className="input-box" placeholder="Enter password" type="password"></input>
        {error && !password && <p className="input-box-error-msg">Enter password</p>}
        <input onChange={(e)=>setRepassword(e.target.value)} value = {rePassword} className="input-box" placeholder="Re-enter password" type="password"></input>
        {error && !rePassword && <p className="input-box-error-msg">Re-enter password</p>}
        {error && rePassword && password && rePassword!==password && <p className="input-box-error-msg">Passwords do not match</p>}
        <button className="signup-btn" type="submit">Sign Up</button>
        </form>
    
    </div>)
}

export default Signup;