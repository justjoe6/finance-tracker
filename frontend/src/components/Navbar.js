import {React} from "react";
import { Link,useNavigate } from 'react-router-dom';


const NavBar = () =>{
    const loggedIn = localStorage.getItem("user")
    const navigate = useNavigate()
    const logout = ()=>{
        localStorage.clear()
        navigate("/")
    }

    return (<div className="nav"><h2>Finance Tracker</h2>
    <div className="nav-right">
    {loggedIn ?
    <>
    <Link className="navLinks" to="/home"><p>home</p></Link>
    <Link className="navLinks" to="/profile"><p>profile</p></Link>
    <Link onClick={logout} className="navLinks" to="/"><p>logout</p></Link></>:
    <><Link className="navLinks" to="/"><p>login</p></Link>
    <Link className="navLinks" to="/signup"><p>signup</p></Link></>}
    </div>
    </div>)
}


export default NavBar;