const express = require('express')
const app = express()

const http = require("http")
const https = require("https")

const fs = require("fs")

const path = require("path")

var bodyParser = require('body-parser')

const mysqlSync = require("sync-mysql")

var conSync = new mysqlSync({
  host: "192.168.0.100",
  user: "root",
  password: "Synology123.",
  database: "EGDM"
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
      res.locals.user = req.cookies.user
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
          
            try{
                  if (result[0].password == password){
                      res.locals.user = user
                      if(remember){
                          res.cookie(`user`,user,{
                              secure: false,
                              httpOnly: false,
                              sameSite: 'lax'
                          });
                      }


                      return res.render("home", {
                          user
                      })
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
      res.locals.user = req.cookies.user
      return res.render("home", {
          user: res.locals.user,
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
  res.locals.username = ""
  res.redirect("/")
})


var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);