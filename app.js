'use strict'


const express = require('express') 
const app = express()
const bodyParser = require("body-parser");

//import route
const commitRoutes = require('./routes/commits')

app.use(express.json())
app.use(bodyParser.json())



const port = process.env.port || 3000
app.listen(port, () => console.log(`Listening on port ${port}`))


//register route
app.use('/commits', commitRoutes);


app.use((req,res,next) => {
    res.sendStatus(404)
});  


module.exports = app