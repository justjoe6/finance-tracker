import {React,useState} from "react";
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

const AddSpend = () => {
    const [type,setType]=useState("")
    const [frequency,setFrequency]=useState("")
    const [title,setTitle]=useState("")
    const [amount,setAmount]=useState("")
    const [error,setError]=useState(false)
    const navigate = useNavigate()
    const params = useParams()
    const collectData = async (e) => {
        e.preventDefault()
        if(!type || !frequency || !title || !amount){
            setError(true)
            return
        }
        const month = params.month
        const year = params.year
        const userId = JSON.parse(localStorage.getItem("user"))._id
        if(frequency === "monthly"){
            let result = await fetch(`http://localhost:5000/add-monthly`,{
                method:"post",
                body:JSON.stringify({userId,month,year,title,amount,type,frequency}),
                headers:{"content-type":"application/json"}
            })
            result = await result.json()
            console.log(result)
            navigate("/home")
            return
        }
        if(frequency === "annually"){
            let result = await fetch(`http://localhost:5000/add-annually`,{
                method:"post",
                body:JSON.stringify({userId,month,year,title,amount,type,frequency}),
                headers:{"content-type":"application/json"}
            })
            result = await result.json()
            console.log(result)
            navigate("/home")
            return
        }
        let result = await fetch(`http://localhost:5000/add-spend`,{
            method:"post",
            body:JSON.stringify({userId,month,year,title,amount,type,frequency}),
            headers:{"content-type":"application/json"}
        })
        result = await result.json()
        console.log(result)
        navigate("/home")
    }

    return (
        <div className="add-spend-container">
        <h1 style={{"fontFamily": "Georgia, serif"}}>Add Spending</h1>
        <form className="add-spend-form" onSubmit={collectData}>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="input-box" placeholder="Enter Title(Gas,bill,etc.)"></input>
            {error && !title && <p className="input-box-error-msg">Enter title</p>}
            <input value={amount} onChange={(e)=>setAmount(e.target.value)} className="input-box" placeholder="Enter Amount in Dollars"></input>
            {error && !amount && <p className="input-box-error-msg">Enter amount</p>}
            <div className="add-spend-selects-container">    
                <select value={type} className="select-box" onChange={(e)=>setType(e.target.value)}>
                    <option value="" disabled>--type--</option>
                    <option value="gain">gain</option>
                    <option value="loss">loss</option>
                </select>
                <select value={frequency} className="select-box" onChange={(e)=>setFrequency(e.target.value)}> 
                    <option value="" disabled>--freq--</option>
                    <option value="once">once</option>
                    <option value="monthly">monthly</option>
                    <option value="annually">annually</option>
                </select>
            </div>
            {error && !type && !frequency &&<p className="input-box-error-msg">Enter type and frequency</p>}
            {error && !frequency && type && <p className="input-box-error-msg">Enter frequency</p>}
            {error && frequency && !type && <p className="input-box-error-msg">Enter type</p>}
            <button className="add-spend-btn" type="submit">Submit</button>
        </form>
        </div>
    )
}

export default AddSpend