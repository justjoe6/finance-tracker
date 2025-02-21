import {React,useState,useEffect} from "react"

const RemoveAnnual = () => {
    const [annual,setAnnual] = useState([])
    const retrieveAnnual = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch(`http://localhost:5000/annualspendings/${userId}`)
        result = await result.json()
        setAnnual(result)
        console.log(result)
    }
    const deleteAnnual = async (finance) => {
        const today = new Date()
        const year = today.getFullYear()
        let result = await fetch(`http://localhost:5000/deleteannualspending/${finance._id}/${year+1}`,{
            method:"put"
        })
        result = await result.json()
        console.log(result)
        retrieveAnnual()
    }
    useEffect(()=>{
        retrieveAnnual()
    },[])
     return (
        <div className="remove-annual-container">
            <h1>Remove Annual</h1>
            {annual.map((year)=>{ return (<div className="annual-spend-container"><p><button onClick={()=>{deleteAnnual(year)}} className="delete-finance-btn">X</button>{year.title.toUpperCase()}</p><p>${year.amount}</p></div>)})}
        </div>
    )

}

export default RemoveAnnual;