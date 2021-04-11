'use strict'

const git = require('../utils/git_utils');
const { MalformedTheoryPathsError } = require('../utils/custom_errors');

const express = require('express');
const routes = express.Router();
module.exports = routes;

class Commit {
    constructor(type, next_sha, prev_sha, current_sha, message, files, theory) {
        this.type = type;
        this.next_sha = next_sha;
        this.prev_sha = prev_sha;
        this.current_sha = current_sha;
        this.message = message;
        this.files = files;
        this.theory = theory;
    }
}



/**
 * Gets data for the first commit
 */
routes.get('/', async (req, res, next) => {

    try {
        let first_sha = await git.get_first_commit()
        let next_sha = await git.get_next_commit(first_sha)
        let message = await git.get_commit_message(first_sha)
        let type = message.includes("#arc#") ? "arc" : "normal"
        let files = []
        let theory = []

        if (type === "normal") {
            files = await git.get_diff_first_commit(first_sha)
            theory = await git.get_theory_array(first_sha)
        } else {
            files = await git.arc_description(first_sha)
        }

        let commit = new Commit(type, next_sha, null, first_sha, message, files, theory)

        res.status(200).send(commit)
    } catch (error) {
        next(error)
    }

})


/**
 * Gets data for the commit associated with the requested sha
 */
routes.get('/:sha', async (req, res, next) => {

    let sha = req.params.sha

    let commit_exists = true
    try {
        await git.commit_exists(sha)
    } catch (error) {
        commit_exists = false
        res.statusMessage = `${error.name}: ${error.message}`
        res.status(404).end()
    }

    if (commit_exists) {
        try {
            let next_sha = await git.get_next_commit(sha)
            let prev_sha = await git.get_parent(sha)
            let message = await git.get_commit_message(sha)

            let type = message.includes("#arc#") ? "arc" : "normal"
            let files = []
            let theory = []

            if (type === "normal") {
                files = await git.get_diff(sha)
                theory = await git.get_theory_array(sha)
            } else {
                files = await git.arc_description(sha)
            }

            let commit = new Commit(type, next_sha, prev_sha, sha, message, files, theory)

            res.status(200).send(commit);

        } catch (error) {
            next(error)
        }
    }



})

/**
 * Retrieves the urls and files associated with a commit
 * These are specified in the #theory# part of the commit's message, as urls or paths to files within the repository
 */
routes.get('/theory/:sha', async (req, res, next) => {

    let sha = req.params.sha

    let commit_exists = true
    try {
        await git.commit_exists(sha)
    } catch (error) {
        commit_exists = false
        res.statusMessage = `${error.name}: ${error.message}`
        res.status(404).end()
    }

    if (commit_exists) {
        try {
            let theory = await git.get_theory(sha)
            res.status(200).send(theory)
        } catch (error) {
            if (error instanceof MalformedTheoryPathsError) {
                res.statusMessage = `${error.name}: ${error.message}`
                res.status(404).end()
            } else {
                next(error)
            }
        }
    }


})



