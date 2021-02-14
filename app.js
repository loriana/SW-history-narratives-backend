'use strict'


const express = require('express') 
const app = express()
const bodyParser = require("body-parser");
let cors = require('cors')

//import route
const commitRoutes = require('./routes/commits')


app.use(express.json())
app.use(bodyParser.json())
app.use(cors())


const port = process.env.port || 3030
app.listen(port, () => console.log(`Listening on port ${port}`))


//register route
app.use('/commits', commitRoutes);


app.use((req,res,next) => {
    res.sendStatus(404)
});  


module.exports = app