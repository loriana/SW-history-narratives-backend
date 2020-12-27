var nodegit = require("nodegit"),
  path = require("path"),
  Promise = require('promise');



var url = "https://github.com/web-engineering-tuwien/recipe-search-live-demo.git", //in case we want to clone a repo
  local = "/Users/lorianaporumb/Desktop/RecipePuppy" 
  cloneOpts = {};





const { promisify } = require('util');
const exec = promisify(require('child_process').exec)

async function get_first_commit() {
    const first_commit = 'git rev-list --max-parents=0 HEAD'
    const access_repo = `cd ${local}`

    const first_commit_command = await exec(access_repo + " && " + first_commit)
    const first_commit_sha = first_commit_command.stdout

    console.log(first_commit_sha)
    return first_commit_sha
/*
    const repo = await nodegit.Repository.open(local)
    const nodegit_commit = await repo.getCommit(first_commit_sha)
    console.log(nodegit_commit.message())
    */

};


async function get_next_commit(current_sha) {

    const next_commit = `git log --reverse --pretty=%H master | grep -A 1 $(git rev-parse ${current_sha}) | tail -n1`
    const access_repo = `cd ${local}`

    /*TODO: make sure to move onto the next next commit in case the next one is a theory commit*/
    const next_commit_command = await exec(access_repo + " && " + next_commit)
    const next_commit_sha = next_commit_command.stdout

    console.log(next_commit_sha)
    /*const repo = await nodegit.Repository.open(local)
    const nodegit_next_commit = await repo.getCommit(next_commit_sha)
    console.log(nodegit_next_commit.message())*/
}


async function get_diff(commit_sha) {
    const repo = await nodegit.Repository.open(local)
    const commit = await repo.getCommit(commit_sha)
    console.log(commit.message())
    const diff_array = await commit.getDiff()

    const diff_files = await get_diff_for_files(diff_array)

    /*TODO: return some object here */

    diff_files.forEach(function(file) {
      console.log("============================= NEW FILE =============================")
      console.log(file)
    })
      
}



async function get_diff_for_files(diff_array) {
  var diffFiles = []

  var i;
  for (i=0; i<diff_array.length; i++) { 
    var patches = await diff_array[i].patches()
    
    var j;
    for (j=0; j<patches.length; j++) {
      var hunks = await patches[j].hunks()
      var diffFile = ''

      var k;
      for (k=0; k<hunks.length; k++) {
        var lines = await hunks[k].lines()

        var l;
        for (l=0; l<lines.length; l++) {
          diffFile += String.fromCharCode(lines[l].origin()) +
            lines[l].content().trim() + '\n'
        }
      }

      diffFiles.push(diffFile)
    }

    
  }

  return diffFiles;
    
}



async function get_theory_commit(commit_sha) {
  //here we'll insert a pattern instead (aka:THEORY#some_sha#), as soon as we have a tryout repo
  const search_by_message = `git log --all --grep=${commit_sha}`
  const access_repo = `cd ${local}`

  const theory_command = await exec(access_repo + " && " + search_by_message)
  const theory_sha = theory_command.stdout

  console.log(theory_sha)
}


/*
async function get_all_commits_sha() {
    const repo = await nodegit.Repository.open(local)
  
    const latest_master_commit = await repo.getMasterCommit()
  
    const commits = await new Promise(function (resolve, reject) {
      var hist = latest_master_commit.history()
      hist.start()
      hist.on("end", resolve);
      hist.on("error", reject);
    });
  
    commits.reverse()
  
    for (var i = 0; i < commits.length; i++) {
      //var sha = commits[i].sha().substr(0,7),   for the sha shorthand, but getting a file by sha shorthand doesn't work at the moment
      
      var sha = commits[i].sha(),
        msg = commits[i].message().split('\n')[0]; //will need this later so I'm leaving it in
        
      console.log(sha + " " + msg);
      var diff = await commits[i].getDiff()
      
     
    }
  
  }
*/

 
  




//get_first_commit().then(console.log("DOONE"))
//get_next_commit("35949ff7dd29c197171339ae6a51389b30787c8f").then(console.log("DOONE"))
//get_diff('13a435e480e9ced68a06414d65589d7b2fe90964').then(console.log("DOONE"))
//get_diff('12c4e858812fa47eed16fcd689708a1f9bc75555').then(console.log("DOONE"))
//get_theory_commit_sha("Introducing").then(console.log("GOT SHA"))




module.exports={get_first_commit, get_next_commit, get_theory_commit}