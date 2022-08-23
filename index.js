const express = require('express')
const app = express()

const http = require("http")
const https = require("https")

const fs = require("fs")

const path = require("path")

var bodyParser = require('body-parser')

const mysqlSync = require("sync-mysql")

var nodemailer = require('nodemailer');


var conSync = new mysqlSync({
  host: "192.168.0.100",
  user: "root",
  password: "Synology123.",
  database: "EGDM"
});



//Email

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'martin.klims1@gmail.com',
      pass: 'uzolcauqngghntly'
    }
  });


const cookieParser = require("cookie-parser")

var urlencodedParser = bodyParser.urlencoded({ extended: false })

const credentials = {
  key: fs.readFileSync("ssl/key.pem", "utf8"),
  cert: fs.readFileSync("ssl/cert.pem", "utf8"),
}


app.use(express.static(path.join(__dirname, "..", "public")))
app.set("view engine", "ejs")


app.use(
  cookieParser({
    httpOnly: false,  // Don't let browser javascript access cookies.
    secure: false, // Only use cookies over https.
  })
)


//variables

var username_public = ""
var level_public = ""


//Ceck user if is login
function checkUser(req, res) {
  if (req.cookies.user) {
      const result = conSync.query("SELECT * FROM Accounts WHERE username = '" + req.cookies.user + "'")
      try{
              
                           
              return result[0].username == req.cookies.user
          
      }
      catch{
          return false
      }
     
  } else {
      return false
  }
}


//routes

app.get("/", (req, res) => {
  var result = checkUser(req, res)
  if(result){
      username_public = req.cookies.user
      res.redirect("/home")
  }
  else{
      res.redirect("/login")
  }


  
})


app.get("/login", (req, res) => {
  var error = ""
  return res.render("login",{
      error
  })
})

app.post("/login", urlencodedParser, (req, res) => {

  var error = ""
  let { user, password, remember } = req.body

  

  if (user == "" && password == ""){
      error = "username and password is required"
      return res.render("login", {
          error
      })
  }

  if (user == ""){
      error = "Username is required"
      return res.render("login", {
          error
      })
  }

  if (password == ""){
      error = "Password is required"
      return res.render("login", {
          error
      })
  }

  
  try{  
          var result = conSync.query("SELECT * FROM Accounts WHERE username = '" + user + "'")
          console.log(result)
          console.log(password)
          console.log(result[0].password == password)
            try{
                  if (result[0].password == password){
                      username_public = user
                      level_public = result[0].level
                      if(true){
                          res.cookie("user",user,{
                                secure: false,
                                httpOnly: false,
                                sameSite: 'lax'
                          });
                          res.cookie("level", result[0].level);
                      }


                      res.redirect("/home")
                  }
                  else{
          
                      error = "Wrong username or password"
                      return res.render("login", {
                          error
                      })
                  }
              }catch (err){
                  error = "Wrong username or password"
                  return res.render("login", {
                      error
                  })
              }
          
        
  }catch(err){
      error = "Wrong username or password"
      return res.render("login", {
          error
      })

  }

})




app.get("/home", (req, res) => {
  var result = checkUser(req, res)
  if(result){
      
      console.log(username_public)
      return res.render("home", {
          user: username_public,
          level: level_public,
          svatek: "svatek",
          dovolena: "dovolena",
          prescas: "prescas"
          })
  }
  else{
      res.redirect("/login")
  }


  
})


app.get("/logout", (req, res) => {
    
  //delete cookies
  res.clearCookie("user")
  username_public = ""  
  level_public = ""
  res.redirect("/")
})

app.get("/create_user", (req, res) => {
    

    return res.render("create_user", {
        error: ""
    })
})

app.post("/create_user", urlencodedParser, (req, res) => {
    
    let { fname, lname, level, dovolena, phone, email} = req.body

    var password = Math.random().toString(36).slice(-8);
    var uname = uname = lname.slice(0,4) + fname.slice(0,2)
    if(fname == "" || lname == "" || level == "" || dovolena == "" || phone == "" || email  == ""){
        return res.render("create_user", {
        error: "Error something is missing"
        })
    }

    conSync.query("CREATE TABLE 'hodiny_" + uname + "' AS SELECT * FROM Hodiny")




    var result = conSync.query("INSERT INTO Accounts VALUES ('0','" + uname +"','" + password +"','" + level +"','" + dovolena +"','" + fname +"','"+ lname +"','" + email +"', '"+ phone +"')")
    console.log(result)

    var mailOptions = {
        from: 'martin.klims1@gmail.com',
        to: email,
        subject: 'User registration EG.D Montáže',
        text: "Hello, registration success \n your username is: " + uname + " \n your password: " + password + "\n You can login on http://localhost:3000"
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });


    return res.render("create_user", {
        error: "Success"
    })


    


})

app.get("/rm_user", (req,res) => {

  var result = conSync.query("SELECT username FROM Accounts")


  return res.render("rm_user",{
    data: result
  })
})

app.post("/rm_user", urlencodedParser , (req,res) => {

    let { user } = req.body

    //var result = conSync.query("SELECT username FROM Accounts")
  
    console.log("remove: " + user)
    return res.end('success')
  })

app.get("/hodiny", (req,res) => {

  //var result = conSync.query("SELECT * FROM Accounts WHERE username = '" + user + "'")

  return res.render("hodiny_user", {
    data: "Work in progress"
  })
})

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(3000);
httpsServer.listen(3443);