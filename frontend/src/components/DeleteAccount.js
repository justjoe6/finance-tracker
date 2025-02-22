import {React,useState,useEffect} from "react";
import { useNavigate } from "react-router-dom";

const DeleteAccount = () => {
    const navigate = useNavigate()
    const username = JSON.parse(localStorage.getItem("user")).username
    const [pfpUrl,setpfpUrl]=useState("")
    const [password,setPassword]=useState("")
    const [noPassError,setNoPassError]=useState(false)
    const [wrongPass,setWrongPass]=useState(false)
    useEffect(()=>{
        const url = JSON.parse(localStorage.getItem("user")).picurl
        setpfpUrl(url)
    },[])
    const handleDelete = async () => {
        if(!password){
            setNoPassError(true)
            return
        }
        const email = JSON.parse(localStorage.getItem("user")).email
        const id = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch("http://localhost:5000/login",{
            method:"post",
            body:JSON.stringify({email,password}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        if(!result._id){
            setWrongPass(true)
            return
        }else{
            setWrongPass(false)
        }
        result = await fetch(`http://localhost:5000/user/${id}`,{
            method:"delete"
        })
        result = await result.json()
        if(result.success){
            localStorage.removeItem("user")
            navigate("/")
        }
        else{
            alert(result.message)
        }
    }
    return (<div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <h1>Are you sure you'd like to delete your account?</h1>
        <h2>{username}</h2>
        {pfpUrl ? <img className="profile-img" src={pfpUrl} alt="profile"/> :<div className="profile-pic"></div>}
        <div className="profile-update-form">
        <input className="input-box" onChange={(e)=>setPassword(e.target.value)} value={password} placeHolder="Enter your password"></input>
        {noPassError && !password && <p className="update-box-error-msg" style={{marginTop:"-10px"}}>Enter your current password</p>}
        {wrongPass && <p className="update-box-error-msg" style={{marginTop:"-10px"}}>Incorrect password</p>}
        <div style={{display:"flex",flexDirection:"row",justifyContent:"space-between"}}>
        <button onClick={handleDelete} className="confirm-btn">Confirm</button>
        <button onClick={()=>navigate("/profile")}className="delete-btn">Cancel</button>
        </div>
        </div>
    </div>)
}

export default DeleteAccount;