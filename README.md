RUNNING AND ARGS:

node app.js --url=<some_url> --local=<some_local_path_for_cloning_the_repo>
OR
nodemon app.js --url=<some_url> --local=<some_local_path_for_cloning_the_repo>

- at leats --local hast to be specified
- if only --local is specified, the local path is updated
- if both --url and --local are specified, the remote repo is cloned at the given local path

*********************************************************************************************
WRITING COMMITS:

ARC COMMIT:
- optional
- used to describe the focus of a couple of upcoming commits
- commit message starts with #arc#
- the arc title is the commit message
- to add an arc description, commit a file (for example arc1.txt) that contains a text description
- message example: #arc#Adding event listeners
- these arc description files can be stored in an arc folder (the program will find them)
- !!! the arc commit shouldn't modify anything else!!!

NORMAL COMMIT:
- a normal commit that commits a code change
- it's advised to commit smaller changes that make sense together
- a normal commit can have theory parts

THEORY FOR NORMAL COMMITS:
- to specify thory, write #theory# at the end of the commit message, followed by urls or paths
- delimit each theory url or path with a |
- commit message with theory example: Add input validation #theory#image.jpeg|some_url|some_file.txt
- theory file paths like image.jpg above are be paths in the local repository, usually added before the associated commit or latest by that commit
- supported theory formats: images, text files, html files, urls

*********************************************************************************************
NOTES:
- commits with the commit message *equal* to "initial commit" or "first commit" are ignored since they usually commit README or other such files that are not important for the learning experience
- to ignore a commit, prepend it woth #ignore# (not extensively tested though)