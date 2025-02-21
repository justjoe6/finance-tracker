import {React,useState,useEffect} from "react";


const UpdateProfile = () => {
    const [updatePassClicked,setUpdatePassClicked]=useState(false)
    const [updateUserClicked,setUpdateUserClicked]=useState(false)
    const [currPassword,setCurrPassword]=useState("")
    const [newPassword,setNewPassword]=useState("")
    const [rePassword,setRePassword]=useState("")      
    const [passError,setPassError]=useState(false)
    const [currPassError,setCurrPassError]=useState(false)
    const [newUsername,setNewUsername]=useState("")
    const [userError,setUserError]=useState(false)
    const [newpfp,setNewPfp]=useState(null)
    const [updateBtnPressed,setUpdateBtnPressed]=useState(false)
    const [pfpUrl,setpfpUrl]=useState("")
    const validateNewPassword = async () => {
        if(!currPassword || !newPassword || !rePassword || rePassword!==newPassword){
            setPassError(true)
            return
        }
        const email = JSON.parse(localStorage.getItem("user")).email
        const id = JSON.parse(localStorage.getItem("user"))._id
        let password = currPassword
        let result = await fetch("http://localhost:5000/login",{
            method:"post",
            body:JSON.stringify({email,password}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        if(!result._id){
            setCurrPassError(true)
            return
        }else{
            setCurrPassError(false)
        }
        password=newPassword
        let res =  await fetch(`http://localhost:5000/updatepassword/${id}`,{
            method:"put",
            body:JSON.stringify({password}),
            headers:{"content-type":"application/json"}
        })
        res = await res.json()
        console.log(res)
        window.location.reload()

    }

    const validateNewUsername = async () => {
        if(!newUsername){
            setUserError(true)
            return
        }
        const id = JSON.parse(localStorage.getItem("user"))._id
        const username = newUsername
        let result = await fetch(`http://localhost:5000/updateusername/${id}`,{
            method:"put",
            body:JSON.stringify({username}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        if(result.result==="Updated username"){

            const updatedStorage = JSON.parse(localStorage.getItem("user"))
            updatedStorage.username=username
            localStorage.setItem("user",JSON.stringify(updatedStorage))
        }
        window.location.reload()
    }

    const uploadPic = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        const formData = new FormData()
        formData.append("image",newpfp)
        let res = await fetch(`http://localhost:5000/upload/${userId}`,{
            method:"put",
            body:formData
        })

        if(res.ok){
            const user = JSON.parse(localStorage.getItem("user"))
            res = await res.json()
            user.picurl=res.imageUrl
            localStorage.setItem("user",JSON.stringify(user))
            window.location.reload()
        }
    }

    useEffect(()=>{
        const url = JSON.parse(localStorage.getItem("user")).picurl
        setpfpUrl(url)
    },[])

    return (
        <div className="profile-container">
            <h1>Update Profile</h1>
            {pfpUrl ? <img className="profile-img" src={pfpUrl} alt="profile"/> :<div className="profile-pic"></div>}
            {updateBtnPressed && <><input style={{marginLeft:"65px"}} type="file" onChange={(e)=>setNewPfp(e.target.files[0])}></input><button onClick={uploadPic} className="update-pic-btn">Submit</button></>}
            {!updateBtnPressed && <button onClick={()=>setUpdateBtnPressed(true)} className="update-pic-btn">Update picture</button>}
            {!updatePassClicked ? <p onClick={()=>setUpdatePassClicked(true)} className="update-info-txt" style={{marginTop:"50px",marginBottom:"0px"}}>Update password</p> :
            <div className="profile-update-form">
                <input type="password" onChange={(e)=>setCurrPassword(e.target.value)} value={currPassword} className="input-box" style={{marginBottom:"10px"}} placeholder="Enter current password"></input>
                {currPassError && <p className="update-box-error-msg" style={{marginTop:"-10px"}}>Does not match current password</p>}
                {passError && !currPassword && <p className="update-box-error-msg" style={{marginTop:"-10px"}}>Enter your current password</p>}
                <input type="password" onChange={(e)=>setNewPassword(e.target.value)} value={newPassword} className="input-box" style={{marginBottom:"10px"}} placeholder="Enter new password"></input>
                {passError && !newPassword && <p className="update-box-error-msg" style={{marginTop:"-10px"}}>Enter new password</p>}
                <input type="password" onChange={(e)=>setRePassword(e.target.value)} value={rePassword} className="input-box" style={{marginBottom:"0px"}} placeholder="Re-enter new password"></input>
                {passError && !rePassword && <p className="update-box-error-msg" style={{marginBottom:"0px"}}>Re-enter new password</p>}
                {passError && newPassword && rePassword!==newPassword && <p className="update-box-error-msg">Passwords do not match</p>}
            <button onClick={validateNewPassword} className="profile-update-btn">Update</button></div>}
            {!updateUserClicked ? <p onClick={()=>setUpdateUserClicked(true)} className="update-info-txt" style={{marginTop:"5px"}}>Update username</p>:
            <div className="profile-update-form">
                <input value={newUsername} onChange={(e)=>setNewUsername(e.target.value)} className="input-box" style={{marginBottom:"0px",marginTop:"10px"}} placeholder="Enter new username"></input>
                {!newUsername && userError && <p className="update-box-error-msg">Enter valid username</p>}
                <button onClick={validateNewUsername} className="profile-update-btn">Update</button></div>}
        </div>)
} 

export default UpdateProfile;