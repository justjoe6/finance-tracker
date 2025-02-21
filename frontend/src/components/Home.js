import {React,useState,useEffect} from "react";
import { Link } from 'react-router-dom';
import january from '../img/january.jpg';
import february from '../img/february.jpg';
import december from '../img/december.jpg';
import march from '../img/march.jpg';
import november from '../img/november.jpg';
import october from '../img/october.jpg';
import september from '../img/september.jpg';
import august from '../img/august.jpg';
import july from '../img/july.jpg';
import june from '../img/june.jpg';
import april from '../img/april.jpg';
import may from '../img/may.jpg';

const Home = () =>{
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    const today = new Date()
    const presentMonth = today.getMonth()
    const presentYear = today.getFullYear()
    const [year,setYear]=useState(today.getFullYear())
    const [month,setMonth]=useState(presentMonth)
    const [finances,setFinances]=useState([])
    const [netSpend,setNetSpend]=useState(0)
    const [img,setImg]=useState("")
    const [images,setImages]=useState([])

    const retrieveMonthly = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch(`http://localhost:5000/monthlyspendings/${userId}/${month}/${year}`)
        result = await result.json()
        return result
    }
    const retrieveAnnual = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch(`http://localhost:5000/annualspendings/${userId}/${year}`)
        result = await result.json()

        return month===0 ? result : []
    }
    const retrieveData = async () => {
        const userId = JSON.parse(localStorage.getItem("user"))._id
        let result = await fetch(`http://localhost:5000/spendings/${year}/${month}/${userId}`)
        result = await result.json()
        return result
    }
    const fetchData = async ()=>{
        const monthly = await retrieveMonthly()
        const annual = await retrieveAnnual()
        const spendings = await retrieveData()
        const totalSpendings = [...annual,...monthly,...spendings]
        const newNetSpend = totalSpendings.reduce((acc, res) => {
            if (res.type === "gain") {
                return acc + res.amount  
            } else {
                return acc - res.amount
            }
        }, 0)
        setFinances(totalSpendings)
        setNetSpend(newNetSpend)
    }  

    const monthImages = [january,february,march,april,may,june,july,august,september,october,november,december]
    useEffect(()=>{
        setImages(monthImages)
        fetchData()
    },[month])

    const addMonth = ()=>{

        let newMonth = month+1
        let newYear = year
        if(newMonth > 11){
            newMonth=0
            newYear=year+1
        }
        setMonth(newMonth)
        setYear(newYear)

    }
    const subMonth = ()=>{
        let newMonth = month-1
        let newYear = year
        if(newMonth < 0){
            newMonth=11
            newYear=year-1
        }
        setMonth(newMonth)
        setYear(newYear)
    }
    const deleteFinance = async (finance) => {
        console.log(finance)
        if(finance.frequency==="once"){
            let result = await fetch(`http://localhost:5000/deletespending/${finance._id}`,{
                method:"delete"
            })
            console.log(result)
        }
        else if(finance.frequency==="monthly"){
            let result = await fetch(`http://localhost:5000/updatemonthly/${finance._id}/${month}/${year}`,{
                method:"put"
            })
            console.log(result)
        }
        else{
            let result = await fetch(`http://localhost:5000/updateannual/${finance._id}/${year}`,{
                method:"put"
            })
            console.log(result)
        }
        fetchData()
    }

    let index=0
    return (
    <div className="home-container">
        {images.map((image,i)=>{
            return (<div key={image}  className={`background-img ${month === i ? "visible" : ""}`} style={{backgroundImage: `url(${image})`}}></div>)
        })}
        <div className="finance-container" style={{ position: "relative", zIndex: 1 }}>
            <div className="finance-header">
                {year > 1880 ? <button className="finance-btn" onClick={subMonth}>&lt;</button>:<p style={{marginLeft:"24px"}}></p>}
            <h2 className="finance-date">{months[month]} {year} Finances</h2>
                {(month===presentMonth && year===presentYear) ? <p style={{marginRight:"24px"}}></p> : <button className="finance-btn" onClick={addMonth}>&gt;</button> }
            </div>
            <div className="finance-body">
            {finances.map((finance)=>{
                index+=1 
                let fontColor = finance.type==="loss" ? "red" : "green"
                let bgColor = index % 2 ===0 ? "rgb(217, 217, 217)" : "rgb(239, 233, 233)"
                return (<div className="finance-spendings" style={{color:fontColor,backgroundColor:bgColor}} key={finance}><p><button onClick={()=>deleteFinance(finance)} className="delete-finance-btn">X</button>{finance.title.toUpperCase()}</p><p>${finance.amount}</p></div>)})}
            </div>
            <div className="finance-footer">
                <Link className="navLinks" to={`/add/${month}/${year}`}><button className="finance-add-btn">+</button></Link>
                {netSpend >= 0 ? <h2 className="finance-spend">Net spend: <span style={{color:"green"}}>${netSpend}</span></h2> : <h2 className="finance-spend">Net spend: <span style={{color:"red"}}>-${netSpend*-1}</span></h2>}
            </div>
        </div>
    </div>)
}

export default Home;