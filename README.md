# Figma
https://www.figma.com/design/852HmYOgybVXcCWcnNcvCG/Finance-Tracker-Site-Design?node-id=1669-162202&t=kHg7B4S7Ra7O8Piq-1

# Backend

Signup and login APIs:
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

Add spending API:
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

Retrieve and delete one time spending APIs:
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

Monthly and annual one time removal APIs:
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

Permanently remove monthly spending and annual spending APIs:
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

Monthly and annual spending retrieval APIs:
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

Full monthly and annual retrieval APIs:
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

Update password and username APIs:
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
Profile picture upload API:
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
Delete account API:
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
