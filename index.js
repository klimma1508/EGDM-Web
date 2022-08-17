const express = require('express')
const app = express()

const http = require("http")
const https = require("https")

const fs = require("fs")


const credentials = {
  key: fs.readFileSync("ssl/key.pem", "utf8"),
  cert: fs.readFileSync("ssl/cert.pem", "utf8"),
}


app.set("view engine", "ejs")

app.get('/', (req, res) => {
  res.send('Hello World!')
})


var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(8080);
httpsServer.listen(8443);