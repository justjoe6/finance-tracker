import {React,useState,useEffect} from "react";
import { Link } from "react-router-dom";


const Profile = () => {
    const username = JSON.parse(localStorage.getItem("user")).username
    const [pfpUrl,setpfpUrl]=useState("")
    useEffect(()=>{
        const url = JSON.parse(localStorage.getItem("user")).picurl
        setpfpUrl(url)
    },[])
    return (
        <div className="profile-container">
            <h2>{username}</h2>
            {pfpUrl ? <img className="profile-img" src={pfpUrl} alt="profile"/> :<div className="profile-pic"></div>}
            <Link to="/removemonth"><p className="profile-clickable" style={{marginBottom:"10px"}}>Remove monthly spendings</p></Link>
            <Link to="/removeannual"><p className="profile-clickable" style={{marginTop:"0px",marginBottom:"10px"}}>Remove annual spendings</p></Link>
            <Link to="/deleteaccount"><p className="profile-clickable" style={{marginTop:"0px",marginBottom:"10px"}}>Delete account</p></Link>
            <Link to="/updateprofile"><p className="profile-clickable" style={{marginTop:"0px"}}>Update profile</p></Link>
        </div>
    )
}

export default Profile;