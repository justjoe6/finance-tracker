# Figma
https://www.figma.com/design/852HmYOgybVXcCWcnNcvCG/Finance-Tracker-Site-Design?node-id=1669-162202&t=kHg7B4S7Ra7O8Piq-1

# Database(MongoDB)

## Schema:
```
const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
    picurl:String
})

let spendingSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String
})

const monthSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String,
    removed:{ type: [[String]], default: [] },
    permaRemoveYear:{ type: Number, default: -1 },
    permaRemoveMonth:{ type: Number, default: -1 }
})

const annualSchema = new mongoose.Schema({
    userId:String,
    month:Number,
    year:Number,
    title:String,
    amount:Number,
    type:String,
    frequency:String,
    removed:{ type: [String], default: [] },
    permaRemoveYear:{ type: Number, default: -1 }
})

```

# Backend(Node.js)

## Signup and login APIs:
Here it handles signing up and logging in users when the signup API is called it creates a new intance of the User model using whats in the request body(Username,password,and email). It's then saved on the database and the resulting document is converted into an object, the password is removed from the object and its sent back to the client. When a user attempts to login the corresponding API is called which using the information in the request body(Email and password) finds the matching user on the database and resturns the corresponding document if a match is found. If no match is found then it responds with the result "No User Found" otherwise it responds with an object containing all the users information minus the password.
```
app.post("/signup", async (req,rsp)=>{
    let user = new User(req.body)
    let result = await user.save()
    result = result.toObject()
    delete result.password
    rsp.send(result)
})

app.post("/login",async (req,rsp)=>{
    let user = await User.findOne(req.body).select("-password")
    if(!user){
        rsp.send({"Result":"No User Found"})
        return
    }

    rsp.send(user)
})
```

## Add spending API:
Here are the APIs for adding one time, monthly, and annual spending each uses the information in the request body(userId,month,year,title,amount,type,frequency) creates the corresponding model instance and saves them in the database.
```
app.post("/add-spend",async (req,rsp)=>{
    let spending = new Spending(req.body)
    result = await spending.save()
    rsp.send(result.toObject())
})

app.post("/add-monthly",async (req,rsp)=>{
    let monthlySpend = new SpendingMonthly(req.body)
    result = await monthlySpend.save()
    console.log(result)
    rsp.send(result.toObject())
})

app.post("/add-annually",async (req,rsp)=>{
    let annualSpend = new SpendingAnnually(req.body)
    result = await annualSpend.save()
    rsp.send(result.toObject())
})
```

## Retrieve and delete one time spending APIs:
The API to retrieve one time spendings takes three parameters year, month, and userId. Using that information it returns all one time spendings from the month and year provided in the parameters related to the userId and returns those to the client. The API to delete a one time spending takes the document ID of the spending and deletes the document with the corresponding ID and responds to the client with the result.
```
app.get("/spendings/:year/:month/:id", async (req,rsp)=>{

    let result = await Spending.find({
        year: req.params.year,       
        month: req.params.month,     
        userId: req.params.id   
      })    
      rsp.send(result)
})

app.delete("/deletespending/:id",async (req,rsp)=>{
    let id = req.params.id
    let result = await Spending.deleteOne({_id:id})
    rsp.send(result)
})
```

## Monthly and annual one time removal APIs:
The monthly one time removal API updates the document with the corresponding document ID which is provided in the parameters by adding the month and year which are also provided in the parameters to the removed list of the document so that it is not retrieved for that month and year. The same is done with the annual one time removal, but only the year is taken into consideration and added to the removed list. Then the result is returned to the client in each case.

```
app.put("/updatemonthly/:id/:month/:year",async (req,rsp)=>{
    let result = await SpendingMonthly.updateOne({_id:req.params.id},{
        $push:{removed:[[req.params.month,req.params.year]]}
    })
    rsp.send(result)
})
app.put("/updateannual/:id/:year",async (req,rsp)=>{
    let result = await SpendingAnnually.updateOne({_id:req.params.id},{
        $push:{removed:[req.params.year]}
    })
    rsp.send(result)
})
```

## Permanently remove monthly spending and annual spending APIs:
Here the APIs use the document ID provided in the parameters to update the corresponding document by setting the permaRemoveYear to the year provided in the parameters and if applicable permaRemoveMonth to the month provided in the parameters.
```
app.put("/deletesmonthlypending/:id/:month/:year",async (req,rsp)=>{
    let id = req.params.id
    let permaRemoveMonth = parseInt(req.params.month)
    let permaRemoveYear = parseInt(req.params.year)
    let result = await SpendingMonthly.updateOne({_id:id},{
        $set:{permaRemoveMonth,permaRemoveYear}
    })
    rsp.send(result)
})
app.put("/deleteannualspending/:id/:year",async (req,rsp)=>{
    let id = req.params.id
    let permaRemoveYear = parseInt(req.params.year)
    let result = await SpendingAnnually.updateOne({_id:id},{
        $set : {permaRemoveYear}
    })
    rsp.send(result)
})
```

## Monthly and annual spending retrieval APIs:
For the monthly spending retrieval API it searches the database for monthly spendings associated with the userId passed in through the parameters only if it has not been removed for that month and year. Since the app allows a user to remove a monthly spending for specific months while not removing it entirely this provides a means for that. The result is then filtered again to ensure that 1. the month and year provided in the parameters is after or the same month the monthly spending was added and 2. the month and year provided in the parameters was before the monthly spending was permanently removed(If it was removed). The same is done for the annual spending retrieval API, but just the year is taken into consideration instead of month and year.
```
app.get("/monthlyspendings/:id/:month/:year", async (req,rsp)=>{
    let result = await SpendingMonthly.find({userId:req.params.id, removed: { $not: {
        $elemMatch: { $eq: [[req.params.month, req.params.year]] } 
    } }})
    const filteredResult = result.filter((doc) => {
        return (doc.year <= parseInt(req.params.year) && doc.month <= parseInt(req.params.month) && (doc.permaRemoveMonth===-1 || (doc.permaRemoveMonth!==-1 && parseInt(req.params.year) <= doc.permaRemoveYear && parseInt(req.params.month) < doc.permaRemoveMonth)))
    });
    rsp.send(filteredResult)
})

app.get("/annualspendings/:id/:year", async (req,rsp)=>{
    let result = await SpendingAnnually.find({userId:req.params.id,removed: { $nin: [req.params.year] }})
    const filteredResult = result.filter((doc) => {
        return (doc.year <= parseInt(req.params.year) && (doc.permaRemoveYear===1 || (doc.permaRemoveYear !== -1 && parseInt(req.params.year) < doc.permaRemoveYear)) )
    });
    rsp.send(filteredResult)
})
```

## Full monthly and annual retrieval APIs:
The following APIs return all monthly and annual spendings that have not been permanently removed.
```
app.get("/monthlyspendings/:id", async (req,rsp)=>{
    let result = await SpendingMonthly.find({userId:req.params.id,permaRemoveMonth:-1,permaRemoveYear:-1})
    rsp.send(result)
})
app.get("/annualspendings/:id", async (req,rsp)=>{
    let result = await SpendingAnnually.find({userId:req.params.id,permaRemoveYear:-1})
    rsp.send(result)
})
```

## Update password and username APIs:
Both APIs use the User Id provided in the parameter to find the corresponding user document and updates the password or username with the new version provided in the request body.
```
app.put("/updatepassword/:id",async (req,rsp)=>{
    let result = await User.updateOne({_id:req.params.id},{
        $set:req.body
    })
    if(!result){
        rsp.send({result:"Error updating password"})
        return
    }
    rsp.send({result:"Updated password"})
})
app.put("/updateusername/:id",async (req,rsp)=>{
    let result = await User.updateOne({_id:req.params.id},{
        $set:req.body
    })
    if(!result){
        rsp.send({result:"Error updating username"})
        return
    }
    rsp.send({result:"Updated username"})
})
```
## Profile picture upload API:
First it configures the AWS SDK with the necessary credentials (accessKeyId, secretAccessKey) and the region (us-east-2) where the S3 bucket is located. Then an S3 service object (s3) using AWS SDK is created allowing interaction with the S3 bucket then Multer is configured to store uploaded files in memory and upload middleware is created for handling single file uploads. The actual API then retrieves the image file from the request and uploads it to the s3 bucket it then takes the url of where that image is stored and adds it to the User document to update their profile picture. Finally, it responds to the client with the message "Image uploaded successfully" and the url where the image is stored.
```
AWS.config.update({
    accessKeyId: keyID,
    secretAccessKey: secAcc,
    region: 'us-east-2'
})

const s3 = new AWS.S3()
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const uploadToS3 = (file) => {
    const params = {
        Bucket: 'financetrackerprofileimages', 
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype
    }
    return s3.upload(params).promise()
}

app.put("/upload/:id", upload.single("image"), async (req,res)=>{
    if (!req.file) {
        return res.send("No file uploaded")
    }

    const uploadResult = await uploadToS3(req.file)
    const picurl = uploadResult.Location
    let result = await User.updateOne({_id:req.params.id},{
        $set:{picurl}
    })


    res.send({
        message: "Image uploaded successfully",
        imageUrl: picurl
    })
})
```
## Delete account API:
This API uses the userId passed in through the parameters to delete all spendings(one time, monthly, and annual) along with the user document stored on the database.
```
app.delete("/user/:id", async (req,rsp)=>{
    let id = req.params.id
    try{
        let spendResult = await Spending.deleteMany({userId:id})
        let monthResult = await SpendingMonthly.deleteMany({userId:id})
        let annualResult = await SpendingAnnually.deleteMany({userId:id})
        let userResult = await User.deleteOne({_id:id})
        rsp.send({spendResult,monthResult,annualResult,userResult,success:true})
    }catch(err){
        rsp.send({msg:"Unable to process request",success:false})
    }

    
})
```

# Frontend(React.js)

## Login Component:
<img width="959" alt="login" src="https://github.com/user-attachments/assets/7c7d226c-8711-42c6-bc68-56b06948a044" />
<img width="959" alt="login error1" src="https://github.com/user-attachments/assets/2359fcaa-817e-4441-9359-ae032fa3a84f" />
<img width="959" alt="login error2" src="https://github.com/user-attachments/assets/9bee3856-42a5-4077-b8cd-d875acbb1e6a" />

The login component consists of two input boxes one for the user to enter their email and one for their password. Then when the submit button is pressed he validateUser function is called which first ensures that an email and password has been inputted if not then an error message appears below the corresponding input box saying either "Enter email" or "Enter password". If an email and password has been provided then an API call is made to the backend containing the email and password to verify whether or not a corresponding User document exists in the database. If a user is not found then a red error text appears below the last input box reading "Invalid username or password" if a user is found then the user object is stringified and then stored in local storage under the key "user" and then the user is redirected to the homepage.
```
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
        navigate("/home")
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

```

## Signup Component:
<img width="959" alt="singup" src="https://github.com/user-attachments/assets/7cde9362-ff26-4119-a0e6-b0c1096eb8d8" />
<img width="959" alt="signup errors" src="https://github.com/user-attachments/assets/3881f580-18d4-43a5-ab77-d357e5ce1ec7" />
<img width="959" alt="signup error2" src="https://github.com/user-attachments/assets/1c48d81f-43e6-461f-a53e-8d2b2ad7f47c" />

The signup component contains a form requiring the user to enter a username, email, password, and to re-enter the password. When the button labeled sign up is pressed the addUser functino is called which first ensures that the user entered all the required information and if not then red error text appears below the corresponding box similar to the login component above. However, there is an added error here which ensures that the user enters the correct password twice if not red error text appears below the last input box saying the passwords do not match. If everything has been entered and the passwords match then an API call is made to the backend containing the username, email, and password inputted by the user to create and save a User document on the backend with the necessary information. Then just like in the login component the user object is stringified and saved in local storage and the user is redirected to the homepage.
```
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
```

## Home Component:
<img width="959" alt="home" src="https://github.com/user-attachments/assets/5abb36fa-9c41-463f-926b-6e33a1322e05" />
<img width="959" alt="home2" src="https://github.com/user-attachments/assets/bac2b173-5c3d-4b7f-8354-972e1f57e241" />

The Home component displays all spendings for the currently displayed month taking into consideration one time spendings, monthly spendings, and annual spendings through API calls to retrieve these spendings which occurs when the component first loads. Also the net spend for the current month is also calculated during this step and later displayed for the user to see below the list of all spendings. The user also has the options to go back a month or forward a month with the arrows above the list of spendings. However, if the current month displayed is the actual current month the user does not have the option to go forward a month and the arrow to do so is removed. When a user clicks one of the buttons the process mentioned above is repeated, but for the month now currently displayed all spendings for that month are retrieved. Also the background image for every month is different so when a user changes months the background image also changes. The user also has the option to remove a spending for the month currently displayed and depending on the spending frequency(one time,monthly, and annual) a corresponding API call is made to remove it for that month and fetchData is called again to retrieve the updated spendings for the current month.
```
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
```

## Add Spend Component:
<img width="959" alt="add spend" src="https://github.com/user-attachments/assets/f5d31673-e1b2-46b8-82b0-e7558aa12468" />
<img width="957" alt="add spend errors" src="https://github.com/user-attachments/assets/3e13d351-4a25-4c3c-94f8-2d26f5c59fbc" />

The AddSpend component contains a form requiring a user to enter the title of their spending(Gas bill, work check, etc.), the amount, frequency(one time, monthly, annual), and the type(gain,loss). Like the components above when the submit button is pressed if any information is missing red error text will appear the corresponding input box/dropdown menu. Depending on the payment frequency a corresponding API call is made to the backend to either add the spending to the one time, monthly, or annual collection in the database. Finally the user is navigated back to the homepage.
```
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
```

## Remove Monthly Component & Remove Annual Component:
<img width="959" alt="remove monthly1" src="https://github.com/user-attachments/assets/75b4face-8b39-431b-afcf-bc4d36c68b96" />
<img width="959" alt="remove monthly2" src="https://github.com/user-attachments/assets/5373f4d5-67ff-4078-9b41-a73ff823e23c" />
<img width="959" alt="remove annual" src="https://github.com/user-attachments/assets/bf4f326c-4bfb-4008-848e-d887ffd40f54" />

The RemoveMonthly component shows all monthly spendings that have not been permanently removed throogh an API call to the backend which is called when the page first loads in the useEffect. Next to every spending is an "X" which the user may press to permamenently remove that spending when it is pressed deleteMonthly is called which makes an API call to the backend with the document ID of the spending and the subsequent month so that from that point forward that spending will no longer appear every month. Then retrieveMonthly is called again to retrieve all spendings that have not been removed since that has just been updated. The RemoveAnnual component works the same except it removes the annual payment for the subsequent year.
```
//Remove Monthly Component
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

//Remove Annual Component
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
```

## Profile and Update Profile Component:
<img width="958" alt="profile" src="https://github.com/user-attachments/assets/c294923a-cac6-494b-b65d-18def5549068" />
<img width="959" alt="update profile" src="https://github.com/user-attachments/assets/1b11d952-f2c9-4d2c-8b8d-bc305f5e7256" />
<img width="959" alt="update profile options clicked" src="https://github.com/user-attachments/assets/3c6d8729-1893-4bdf-b738-dacbb82e3f7d" />
<img width="959" alt="update profile errors" src="https://github.com/user-attachments/assets/e9c96fd2-b8c5-4dd7-a3cd-6f0a28b76e9f" />
<img width="959" alt="update profile pic" src="https://github.com/user-attachments/assets/5eca3617-5c54-406e-bb33-e766aeb3e351" />

The Profile component retrieves the profile picture url or the user if it exists and will use the url to display the image if not it will display an empty circle. In the UpdateProfile component it displays the users profile pic if applicable and below that a green button labeled "Update picture" which when pressed will then display an input to upload an image and a submit button for when the image is uploaded. When the submit button is pressed an API call is made to the backend containing the image file so that it can be stored in AWS S3 and the corresponding url is returned. That url is then added to the user object in local storage. Another part of the UpdateProfile component is the option to update a password when pressed it makes a form appear requiring the user to input their password, then re-enter it, and then input their new password. If any field is empty or the password and re-entered password do not match when submitted red error text will appear below the corresponding input. Then an API call is made to ensure the password matches the password of the current account if not red error text will appear stating "Does not match current password". If the password does match then an API call is made to update the users password on the database and then the page is refreshed. Lastly the user also has the option to change their username by clicking on the blue text reading "Update username". When pressed an input appears requiring the user to enter their new username and when the submit button is pressed and a username has indeed been entered an API call is made in order to update the users username in the database. Then the local storage is also updated with the new username.
```
    //Profile Component
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

    //Update Profile Component
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
```

## Delete Account Component: 
<img width="959" alt="delete account" src="https://github.com/user-attachments/assets/cb7adbb3-0a98-4e61-8b13-1c9a9e50019d" />
<img width="959" alt="delete error1" src="https://github.com/user-attachments/assets/d1257e6c-d45e-4dd5-b822-93d74fe740f6" />
<img width="959" alt="delete error2" src="https://github.com/user-attachments/assets/efff9583-e7b8-4408-927c-8afff56f788d" />

The DeleteAccount component displays a form requiring the user to enter and re-enter their password which works similar to how the update password works above showing red error text accordingly. If the passwords match and it is indeed the password of the current user then a call is made to the backend to delete all one time, monthly, and annual spendings of the user. Lastly, the user document is deleted from the database, the user object is deleted from local storage and then the user is navigated back to the login page.
```
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
```
