import {React,useState,useEffect} from "react"

const RemoveMonthly = () => {
    const [monthly,setMonthly]=useState([])
    const retrieveMonthly = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch(`http://localhost:5000/monthlyspendings/${userId}`)
        result = await result.json()
        setMonthly(result)
    }
    const deleteMonthly = async (finance) => {
        const today = new Date()
        const year = today.getFullYear()
        const month = today.getMonth()
        let result = await fetch(`http://localhost:5000/deletesmonthlypending/${finance._id}/${month+1}/${year}`,{
            method:"put"
        })
        result = await result.json()
        console.log(result)
        retrieveMonthly()
    }
    useEffect(()=>{
        retrieveMonthly()
    },[])
    return (
        <div className="remove-monthly-container">
            <h1>Remove Monthly</h1>
            {monthly.map((month)=>{ return (<div className="monthly-spend-container"><p><button onClick={()=>deleteMonthly(month)} className="delete-finance-btn">X</button>{month.title.toUpperCase()}</p><p>${month.amount}</p></div>)})}
        </div>
    )
}

export default RemoveMonthly;