var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');
const fs = require("fs");
const { promisify } = require('util');
const FileType = require('file-type')

var mmm = require('mmmagic'),
Magic = mmm.Magic;



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  //local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  local = "/Users/lorianaporumb/Desktop/Test_repo" 
  cloneOpts = {};


//const getType = promisify(Magic.detectFile)
const exec = promisify(require('child_process').exec)
const readFile = (fileName) => promisify(fs.readFile)(fileName/*, 'utf8'*/);

async function get_first_commit() {
    const first_commit = 'git rev-list --max-parents=0 HEAD'
    const access_repo = `cd ${local}`

    const first_commit_command = await exec(access_repo + " && " + first_commit)
    const first_commit_sha = first_commit_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

    return first_commit_sha;

};


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

  return next_commit_sha
}

async function get_parent(commit_sha) {
  const access_repo = `cd ${local}`
  const get_parent_template = `git rev-parse ${commit_sha}^`

  const parent_command = await exec(access_repo + " && " + get_parent_template)
  const parent_sha = parent_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

  const message = await get_commit_message(parent_sha)
  if (message.toLowerCase().startsWith("#ignore#") || message.toLowerCase().startsWith("#arc#") || message.toLowerCase().startsWith("mit license")) { 
    return await get_parent(parent_sha)
  } 

  return parent_sha
}


async function get_commit_message(commit_sha) {
  const access_repo = `cd ${local}`

  const commit_message = `git log --format=%B -n 1 ${commit_sha}`
  const message_command = await exec (access_repo + " && " + commit_message)
  const message = message_command.stdout

  return get_only_message(message);
}


async function get_diff(commit_sha) {

  const access_repo = `cd ${local}`

  const parent_sha = await get_parent(commit_sha)

  const get_diff = `git diff -U10000 ${parent_sha} ${commit_sha}`
  const diff_command = await exec(access_repo + " && " + get_diff)
  let diff_output = diff_command.stdout

  //console.log(diff_output)
  return diff_output;
}

async function get_diff_first_commit(commit_sha) {

  const access_repo = `cd ${local}`

  const get_diff = `git diff -U10000 4b825dc642cb6eb9a060e54bf8d69288fbee4904 ${commit_sha}`
  const diff_command = await exec(access_repo + " && " + get_diff)
  let diff_output = diff_command.stdout

  //console.log(diff_output)
  return diff_output;
}


class TheoryPiece {
  constructor(type, file) {
      this.type = type;
      this.file = file;
  }
}

async function get_theory(commit_sha) {
  let theory_array = await get_theory_array(commit_sha)
  console.log(theory_array)

  let theory = []

  for (let path of theory_array) {

    if (is_url(path)) {
      let theory_piece = new TheoryPiece("URL", path)
      theory.push(theory_piece)

    } else {
      let file = await get_file_from_commit(commit_sha, path)
      console.log("RECEIVED FILE SUCCESSFULLY")
      let type = await detectMimeType(path)
      console.log("GOT MIME TYPE SUCCESSFULLY")
      let theory_piece = new TheoryPiece(type, file)
      allowed_type(type)? theory.push(theory_piece) : console.log(`Type ${type} not supported`)
    }
    
  }

  return theory;
}

//check what changes could be made to the file reading encoding in case we need to read media
async function get_file_from_commit(commit_sha, file_path) {
  const access_repo = `cd ${local}`
  let git_checkout = `git checkout ${commit_sha}`
  let checkout_command = await exec(access_repo + " && " + git_checkout)//don't remove this
  let get_head = await exec(access_repo + " && " + "git rev-parse HEAD")
  let head = get_head.stdout
  console.log(`CURRENT HEAD: ${head}`)
  
  let file; 
  try {
    let theory_path = path.join(local, file_path.trim())
    file = await readFile(theory_path) 

  } catch (error) {
    console.log(error)
  }

  return file
}

function allowed_type(mime_type) {
  return (mime_type.startsWith("text/")) || (mime_type.startsWith("image/"))
}


function get_only_message(commit_message) {
  return commit_message.split("#theory#")[0]
}

async function get_theory_array(commit_sha) {
  let theory_array = []

  const access_repo = `cd ${local}`

  const commit_message = `git log --format=%B -n 1 ${commit_sha}`
  const message_command = await exec (access_repo + " && " + commit_message)
  const message = message_command.stdout
  if (message.includes("#theory#")) {
    let theory = message.split("#theory#")[1]
    theory_array = theory.split("|")
    theory_array = theory_array.map(t => t.trim())
  }
  
  
  /*delete this fake array later 
  let theory_path_1 = "/Users/lorianaporumb/Desktop/sw_history_narratives/cat.jpeg"
  let theory_path_2 = "/Users/lorianaporumb/Desktop/sw_history_narratives/text.html"
  let theory_path_3 = "/Users/lorianaporumb/Desktop/sw_history_narratives/lyrics.txt"

  let theory = []
  theory.push(theory_path_1)
  theory.push(theory_path_2)
  theory.push(theory_path_3)
  theory.push("https://www.youtube.com/watch?v=BrQKM_uaZKE")*/
//

  

  return theory_array /*theory*/
}


async function arc_description(commit_sha) {
  const access_repo = `cd ${local}`

  let new_files_paths = await get_new_files_paths(commit_sha)
  let arc_desc_file;

  try {
    let cat_file_at_commit = `git cat-file -p ${commit_sha}:${new_files_paths[0]}`
    let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)

    arc_desc_file = cat_file_command.stdout
  } catch (error) {
    //console.log(error)
    //this should theoretically never fail, but must think of what to do if it does
  }

  console.log(arc_desc_file)
  return arc_desc_file
}


async function get_new_files_paths(commit_sha) {
  const access_repo = `cd ${local}`

  const get_added_file_paths = `git show --pretty="" ${commit_sha} --name-only`  //another way, apparently better: git diff-tree --no-commit-id --name-only -r bd61ad98
  const added_paths_command = await exec(access_repo + " && " + get_added_file_paths)
  //console.log(added_paths_command.stdout)
  let added_file_paths = added_paths_command.stdout.split("\n")
  added_file_paths = added_file_paths.slice(0, added_file_paths.length-1)

  return added_file_paths
}

async function detectMimeType(filePath) {
  let absolute_path = path.join(local, filePath)
  let detectMime = new Promise((resolve, reject) => {
        var magic = new Magic(mmm.MAGIC_MIME_TYPE);
        magic.detectFile(absolute_path, function(err, result) {
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
 

/*

async function git_show(commit_sha) {
  
  const search_by_message = `git show -U1000 ${commit_sha}`
  const access_repo = `cd ${local}`

  const theory_command = await exec(access_repo + " && " + search_by_message)
  const theory_sha = theory_command.stdout

  return theory_sha
}

class ChangedFile {
  constructor(current_path, previous, current) {
    this.current_path = current_path;
    this.previous = previous;
    this.current = current;
  }
}


//for getting first commit on a current branch: git log master..branch --oneline | tail -1
//getting last commit on a current branch: git rev-parse branch-name
//get current branch: git branch --show-current



async function get_initial_commit_files(commit_sha) {

  const access_repo = `cd ${local}`

  const get_added_file_paths = `git show --pretty="" ${commit_sha} --name-only`  //another way, apparently better: git diff-tree --no-commit-id --name-only -r bd61ad98
  const added_paths_command = await exec(access_repo + " && " + get_added_file_paths)
  //console.log(added_paths_command.stdout)
  let added_file_paths = added_paths_command.stdout.split("\n")
  added_file_paths = added_file_paths.slice(0, added_file_paths.length-1)




  let files = [];
  for (let i = 0; i < added_file_paths.length; i ++) {

    let path = added_file_paths[i]
    let file = new ChangedFile(path, '', '')

    try {
      let cat_file_at_commit = `git cat-file -p ${commit_sha}:${path}`
      let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)
      const file_content = cat_file_command.stdout
      file.current = file_content
    } catch (error) {
      //console.log(error)
      //this should theoretically never fail, but must think of what to do if it does
    }

    files.push(file)
  }

  return files;

}


async function get_old_new_files(commit_sha) {
  
  //const search_by_message = `git show -U1000 ${commit_sha}`
  const access_repo = `cd ${local}`
  const get_parent = `git rev-parse ${commit_sha}^`
  

  const parent_command = await exec(access_repo + " && " + get_parent)
  const parent_sha = parent_command.stdout.replace(/(\r\n|\n|\r)/gm, "")

  const get_modified_files_paths = `git diff --name-only ${parent_sha} ${commit_sha}`
  const modified_paths_command = await exec(access_repo + " && " + get_modified_files_paths)
  let modified_file_paths = modified_paths_command.stdout.split("\n")
  modified_file_paths = modified_file_paths.slice(0, modified_file_paths.length-1)


  //console.log(modified_file_paths)
  let modified_files = []
  for (let i = 0; i < modified_file_paths.length; i ++) {

    let path = modified_file_paths[i]
    //console.log(`Path: ${path}`)
    let file = new ChangedFile(path, '', '')
    let sha = parent_sha
    try {
      let cat_file_at_commit = `git cat-file -p ${sha}:${path}`
      let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)
      const file_content = cat_file_command.stdout
      file.previous = file_content
    } catch (error) {
      //console.log(error)
    }

    sha = commit_sha
    try {
      let cat_file_at_commit = `git cat-file -p ${sha}:${path}`
      let cat_file_command = await exec(access_repo + " && " + cat_file_at_commit)
      const file_content = cat_file_command.stdout
      file.current = file_content
    } catch (error) {
      //console.log(error)
    }
    modified_files.push(file)
  }

  return modified_files;
  

}*/



  
//get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
//get_file_from_commit("13a435e480e9ced68a06414d65589d7b2fe90964", "index.html")
//get_first_commit()

//get_file_type("cat.jpeg")
//get_file_type("../image.png")
//get_theory('13a435e480e9ced68a06414d65589d7b2fe90964')
//arc_description("40cefc8c8208d18aef188a4ccaf9a24556c838ec")



module.exports={get_first_commit, get_next_commit, get_parent, get_commit_message, arc_description, get_diff, get_diff_first_commit, get_theory, get_theory_array, get_file_from_commit}