'use strict'

const git = require('./utils/git_utils')

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const express = require('express')
const app = express()
const bodyParser = require("body-parser")
let cors = require('cors')

//import route
const commitRoutes = require('./routes/commits')

app.use(express.json())
app.use(bodyParser.json())
app.use(cors())


/**
 * Read arguments and either clone a repo at a local path
 * Or update the variable local to the local path provided (if no url given)
 */

global.local = ""  //the local repo path, available globally

if (argv.url && argv.local) {
    local = argv.local
    git.clone_repo(argv.url, local)
} else if (!argv.url && argv.local) {
    local = argv.local
} else {
    console.log("Using the last local repository path, since no new information or incomplete information was given.")
}



const port = process.env.port || 3030
app.listen(port, () => console.log(`Listening on port ${port}`))


//register route
app.use('/commits', commitRoutes);


app.use((req, res, next) => {
    res.sendStatus(404)
});


module.exports = app