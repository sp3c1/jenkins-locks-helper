const { exec } = require('child_process');
var program = require('commander');
 
program
  .version('0.1.0')
  .option('-l, --lock [type]', 'Name of lock to apply')
  .option('-t, --time [type]', 'Lock time')
  .parse(process.argv);
 
var lockTime = program.time || 1000*60*2;
var maxWaitingTime = 1000*60*10;
var enterTheDragon = Date.now()*1+maxWaitingTime;
 
console.log = function(){}
console.error = function(){}
 
if ( !program.lock ){	
	return process.exit(1);
}

var interval = setInterval(function(){
	exec(`node index.js -l ${program.lock}  -t ${lockTime}`, (error, stdout, stderr) => {
	  if (error) {
		console.error(`exec error: ${error}`);
		if(Date.now()>enterTheDragon){
			//waited too long
			process.exit(1)
		}
		
		return;
	  }
	  console.log(`stdout: ${stdout}`);
	  console.log(`stderr: ${stderr}`);
	  process.exit(0);
	});
},2500)