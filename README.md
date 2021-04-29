
# DOCKER
create image with: `docker build -t sw_history_narratives_backend .`
run container with: `docker run -p 3030:3030 sw_history_narratives_backend`

!IMPORTANT!
The above commands make use of the *default* values for the ENV variables `local` and `url` (look up in Dockerfile). 
By default, the `url` is set to the recipe search coding example at https://github.com/lp28/recipe-search-demo.git.
To run with a different url, use: 
`docker run -p 3030:3030 -e local=<a_local_path -e url=<remote-repo_url> -d sw_history_narratives_backend`

!note that the local path should contain the name of the repo!
example `local /Users/lorianaporumb/Desktop/recipe-search-demo`
example `url https://github.com/lp28/recipe-search-demo.git`

!ALSO IMPORTANT!
Currently, only giving a local repo as an arg without a url to clone from doesn't work with Docker. In other words, if you want to override the defaults you must provide both a local path and a url.

*********************************************************************************************
# RUNNING AND ARGS:

## CASE 1: there is no local repo saved, so we want to clone a remote repo to a local path

`node app.js --url=<remote_repo_url> --local=<some_local_path_for_cloning_the_repo>`

!the local path should contain the name of the repo!
example: 
 `node app.js --url=https://github.com/lp28/recipe-search-demo.git --local=/Users/lorianaporumb/Desktop/recipe-search-demo`

## CASE 2: there is a non-empty local repo we want to use, without any cloning
`node app.js --local=<some_local_path_for_cloning_the_repo>`



*********************************************************************************************
# WRITING COMMITS:

# ARC COMMIT:
- optional
- used to describe the focus of a couple of upcoming commits
- commit message starts with #arc#
- the arc title is the commit message
- to add an arc description, commit a file (for example arc1.txt) that contains a text description
- message example: #arc#Adding event listeners
- these arc description files can be stored in an arc folder (the program will find them)
- !!! the arc commit shouldn't modify anything else!!!

# NORMAL COMMIT:
- a normal commit that commits a code change
- it's advised to commit smaller changes that make sense together
- a normal commit can have theory parts

# THEORY FOR NORMAL COMMITS:
- to specify thory, write #theory# at the end of the commit message, followed by urls or paths
- delimit each theory url or path with a |
- commit message with theory example: Add input validation #theory#image.jpeg|some_url|some_file.txt
- theory file paths like image.jpg above are be paths in the local repository, usually added before the associated commit or latest by that commit
- supported theory formats: images, text files, html files, urls

*********************************************************************************************
# NOTES:
- commits with the commit message *equal* to "initial commit" or "first commit" are ignored since they usually commit README or other such files that are not important for the learning experience
- to ignore a commit, prepend it woth #ignore# (not extensively tested though)