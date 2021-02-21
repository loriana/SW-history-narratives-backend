'use strict'

const git = require('../utils/git_utils');

const express = require('express');
const routes = express.Router();
//const fetch = require('node-fetch');
//const fs = require('fs');
//const path = require('path');
module.exports = routes;

class Commit {
    constructor(type, next_sha, current_sha, message, files, theory) {
      this.type = type;
      this.next_sha = next_sha;
      this.current_sha = current_sha;
      this.message = message;
      this.files = files;
      this.theory = theory;
    }
  }




routes.get('/', async (req, res) => {
    
    let first_sha = await git.get_first_commit()
    let next_sha = await git.get_next_commit(first_sha)
    let message = await git.get_commit_message(first_sha)
    let type = message.includes("#arc#")? "arc" : "normal"
    let files = []
    let theory = []

    if (type === "normal") {
        files = await git.get_diff_first_commit(first_sha)
        theory = await git.get_theory_array(first_sha)
    } else {
        files = await git.arc_description(first_sha)
    }

    let commit = new Commit(type, next_sha, first_sha, message, files, theory)


    res.status(200).send(commit); 
})

//http://localhost:3000/commits/12c4e858812fa47eed16fcd689708a1f9bc75555
//still in polishing mode
routes.get('/:sha', async (req, res) => { //this needs an update 
    var sha = req.params.sha
    
    let next_sha = await git.get_next_commit(sha)
    let message = await git.get_commit_message(sha)

    let type = message.includes("#arc#")? "arc" : "normal"
    let files = []
    let theory = []

    if (type === "normal") {
        files = await git.get_diff(sha)
        theory = await git.get_theory_array(sha)
    } else {
        files = await git.arc_description(sha)
    }

    let commit = new Commit(type, next_sha, sha, message, files, theory)

    res.status(200).send(commit); 

})

routes.get('/theory/:sha', async (req, res) => {
    console.log("INSIDE /:sha")
    let sha = req.params.sha
    let theory = await git.get_theory(sha)

    console.log(theory)

    res.status(200).send(theory); 

})



