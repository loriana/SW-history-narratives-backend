'use strict'

const git = require('../utils/git_utils');

const express = require('express');
const routes = express.Router();
//const fetch = require('node-fetch');
//const fs = require('fs');
//const path = require('path');
module.exports = routes;


routes.get('/', async (req, res) => {
    res.send('Hello world !!!!  ')
})

//still in polishing mode
routes.get('/:sha', async (req, res) => {
    var sha = req.params.sha
    console.log("inside the GET")
    let first_sha = await git.get_first_commit().then(console.log("DOONE"))

    res.status(200).send(first_sha); 
    //get_next_commit("35949ff7dd29c197171339ae6a51389b30787c8f").then(console.log("DOONE"))
    //get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
    //get_diff('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))

})

/*
routes.get('/:style/:imageType', async (req, res) => {
    let style = req.params.style;
    let imageType = req.params.imageType;

    let isValidStyle = checkStyle(style);
    if(!isValidStyle) {
        return res.status(404).send("Frame style not found");
    }

    let isValidType = checkType(imageType);
    if(!isValidType) {
        return res.status(404).send("Frame type not found");
    }

    let isThumb = imageType.toLowerCase().includes("thumb");
    let path = getPath(style, isThumb);

    if(isThumb) {
        res.set('Content-Type', 'image/png');
    } else {
        res.set('Content-Type', 'image/jpeg');
    }
    res.status(200).sendfile("server/resources/" + path);
});
*/