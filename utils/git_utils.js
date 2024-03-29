var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');
const fs = require("fs");
const { promisify } = require('util');
const FileType = require('file-type');

const { NoSuchShaError, MalformedTheoryPathsError } = require('./custom_errors');

var mmm = require('mmmagic'),
  Magic = mmm.Magic;

const exec = promisify(require('child_process').exec)
const readFile = (fileName) => promisify(fs.readFile)(fileName/*, 'utf8'*/);




/**
 * Clones a remote repo at an url at a local path
 * If the local path already exists, it performs a recursive remove before cloning
 * @param {*} url 
 * @param {*} local 
 */
async function clone_repo(url, local) {

  if (fs.existsSync(local)) {
    try {
      fs.rmdirSync(local, { recursive: true })
    } catch (err) {
      console.error(`Error while deleting ${local}.`)
    }
  }

  cloneOpts = {}
  nodegit.Clone(url, local, cloneOpts).then(function (repo) {
    console.log("Cloned " + path.basename(url) + " to " + repo.workdir())
  }).catch(function (err) {
    console.log(err)
  });
}



async function commit_exists(sha) {

  const command = `git cat-file commit ${sha}`
  const access_repo = `cd ${local}`

  try {
    await exec(access_repo + " && " + command)
  } catch (error) {
    throw new NoSuchShaError(sha)
  }

}

/**
 * Returns the sha of the first commit
 * If the first commit's message equals "initial commit" or "first commit", it moves on to its child
 */
async function get_first_commit() {

  const first_commit = 'git rev-list --max-parents=0 HEAD'
  const access_repo = `cd ${local}`

  const first_commit_command = await exec(access_repo + " && " + first_commit)
  const first_commit_sha = first_commit_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

  //very uncleanly checking if the first commit is an initial commit
  //since commits with the message "initail commit" usually don't contain any actual code
  //and moving on to the next if it is
  const message = await get_commit_message(first_commit_sha)

  if (message === "first commit" || message === "initial commit") {
    return await get_next_commit(first_commit_sha)
  }

  return first_commit_sha.trim();

};


/**
 * Based on a given sha, it returns that commit's child's sha
 * @param {*} current_sha 
 */
async function get_next_commit(current_sha) {

  //in case the repo is old, might need to change "main" in this command to "master"
  const next_commit = `git log --reverse --pretty=%H main | grep -A 1 $(git rev-parse ${current_sha}) | tail -n1`
  const access_repo = `cd ${local}`

  //get sha of next commit
  const next_commit_command = await exec(access_repo + " && " + next_commit)
  const next_commit_sha = next_commit_command.stdout

  //get message of next commit to check if it should be ignored
  const message = await get_commit_message(next_commit_sha)

  //if the next commit is ignored (aka a theory commit), recursively jump to the next non-ignored one
  if (message.toLowerCase().startsWith("#ignore#") || message.toLowerCase().startsWith("mit license")) {
    return get_next_commit(next_commit_sha)
  }

  return next_commit_sha.trim()
}

/**
 * Based on a given sha, it returns the sha of that commit's parent.
 * @param {*} commit_sha 
 */
async function get_parent(commit_sha) {
  const access_repo = `cd ${local}`
  const get_parent_template = `git rev-parse ${commit_sha}^`

  const parent_command = await exec(access_repo + " && " + get_parent_template)
  const parent_sha = parent_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

  const message = await get_commit_message(parent_sha)
  if (message.toLowerCase().startsWith("#ignore#") || /*message.toLowerCase().startsWith("#arc#")|| */ message.toLowerCase().startsWith("mit license") ||
    message.toLowerCase().startsWith("first commit")) {
    return await get_parent(parent_sha)
  }

  return parent_sha.trim()
}


/**
 * Returns a commit's message
 * In case the commit contains a #theory# part, this will be ignored (cut)
 * @param {*} commit_sha 
 */
async function get_commit_message(commit_sha) {
  const access_repo = `cd ${local}`

  const commit_message = `git log --format=%B -n 1 ${commit_sha}`
  const message_command = await exec(access_repo + " && " + commit_message)
  const message = message_command.stdout

  return get_only_message(message);
}


/**
 * Gets diff between two commits
 * Includes enough context lines to reconstruct the whole changed file
 * @param {*} commit_sha 
 */
async function get_diff(commit_sha) {

  const access_repo = `cd ${local}`
  const parent_sha = await get_parent(commit_sha)

  const get_diff = `git diff -U10000 ${parent_sha} ${commit_sha}`
  const diff_command = await exec(access_repo + " && " + get_diff)
  let diff_output = diff_command.stdout

  return diff_output;
}

/**
 * Special diff case for the first commit, since it doesn't have a parent
 * @param {*} commit_sha 
 */
async function get_diff_first_commit(commit_sha) {

  const access_repo = `cd ${local}`

  const get_diff = `git diff -U10000 4b825dc642cb6eb9a060e54bf8d69288fbee4904 ${commit_sha}`
  const diff_command = await exec(access_repo + " && " + get_diff)
  let diff_output = diff_command.stdout

  return diff_output;
}



class TheoryPiece {
  constructor(type, file) {
    this.type = type;
    this.file = file;
  }
}

/**
 * Retrieves the files describes by the paths in a commit message's #theory# part
 * Urls are returned as they are
 * Paths are returned as files
 * @param {*} commit_sha 
 */
async function get_theory(commit_sha) {
  let theory_array = await get_theory_array(commit_sha)

  let theory = []

  for (let path of theory_array) {

    try {

      if (is_url(path)) {
        let theory_piece = new TheoryPiece("URL", path)
        theory.push(theory_piece)

      } else {
        let file = await get_file_from_commit(commit_sha, path)
        let type = await detectMimeType(path)
        let theory_piece = new TheoryPiece(type, file)
        allowed_type(type) ? theory.push(theory_piece) : console.log(`Type ${type} not supported`)
      }

    } catch (error) {
      throw new MalformedTheoryPathsError
    }

  }

  return theory;
}


/**
 * Returns file based on given path
 * Used to read theory files from the specified theory paths
 * @param {*} commit_sha 
 * @param {*} file_path 
 */
async function get_file_from_commit(commit_sha, file_path) {
  const access_repo = `cd ${local}`
  let git_checkout = `git checkout ${commit_sha}`
  let checkout_command = await exec(access_repo + " && " + git_checkout)//don't remove this
  /** uncomment to check which commit is the current head
  let get_head = await exec(access_repo + " && " + "git rev-parse HEAD")
  let head = get_head.stdout
  */

  let theory_path = path.join(local, file_path.trim())
  let file = await readFile(theory_path)

  return file
}


function allowed_type(mime_type) {
  return (mime_type.startsWith("text/")) || (mime_type.startsWith("image/"))
}


function get_only_message(commit_message) {
  return commit_message.split("#theory#")[0].trim()
}

/**
 * Returns an array of paths to theory resources specified in a commit message's #theory# part
 * !!It only returns the urls and paths, not the files!!
 * @param {*} commit_sha 
 */
async function get_theory_array(commit_sha) {
  let theory_array = []

  const access_repo = `cd ${local}`

  const commit_message = `git log --format=%B -n 1 ${commit_sha}`
  const message_command = await exec(access_repo + " && " + commit_message)
  const message = message_command.stdout
  if (message.includes("#theory#")) {

    let theory = message.split("#theory#")[1]
    theory_array = theory.split("|")
    theory_array = theory_array.map(t => t.trim())


  }

  return theory_array
}


/**
 * Returns the content of the arc description file, added by an arc commit
 * @param {*} commit_sha 
 */
async function arc_description(commit_sha) {
  const access_repo = `cd ${local}`

  let new_files_paths = await get_new_files_paths(commit_sha)
  let arc_desc_file;

  try {
    let cat_file_at_commit = `git cat-file -p ${commit_sha}:${new_files_paths[0]}`
    let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)

    arc_desc_file = cat_file_command.stdout
  } catch (error) {
    console.log(error)
  }

  return arc_desc_file
}


/**
 * Get paths to files that have been changed by a particular commit
 * Mostly used to get the path to the arc.txt file added by an arc commit
 * Since an arc commit makes no other changes, this function returns only this file
 * @param {*} commit_sha 
 */
async function get_new_files_paths(commit_sha) {
  const access_repo = `cd ${local}`

  const get_added_file_paths = `git show --pretty="" ${commit_sha} --name-only`
  const added_paths_command = await exec(access_repo + " && " + get_added_file_paths)

  let added_file_paths = added_paths_command.stdout.split("\n")
  added_file_paths = added_file_paths.slice(0, added_file_paths.length - 1)

  return added_file_paths
}

async function detectMimeType(filePath) {
  let absolute_path = path.join(local, filePath)
  let detectMime = new Promise((resolve, reject) => {
    var magic = new Magic(mmm.MAGIC_MIME_TYPE);
    magic.detectFile(absolute_path, function (err, result) {
      if (err) reject(err);
      resolve(result);
    });
  });

  let result = await detectMime;

  return result;
}

function is_url(string) {
  let regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
  return regexp.test(string);
}


module.exports = { clone_repo, commit_exists, get_first_commit, get_next_commit, get_parent, get_commit_message, arc_description, get_diff, get_diff_first_commit, get_theory, get_theory_array, get_file_from_commit }