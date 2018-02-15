const mongoose = require('mongoose');
var program = require('commander');
 
program
  .version('0.1.0')
  .option('-l, --lock [type]', 'Name of lock to apply')
  .option('-t, --time [type]', 'Lock time')
  .option('-r, --release [type]', 'Name of lock to release')
  .parse(process.argv);
 
var lockTime = program.time || 1000*60*2;
 
console.log = function(){}
 
 if (!program.lock && !program.release){	
	return process.exit(1);
}
 
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
	
var LockSchema = new Schema({
    lock     : { type: String, unique: true },
    time      : Number,
}, {expireAfterSeconds: 60*10});
	
var LockModel = mongoose.model('Lock', LockSchema);
	
(async function(){
	await mongoose.connect('mongodb://127.0.0.1:27017/lock');
	if (program.release){
		console.log('To release');
		var singleToRelease = await LockModel.findOne({lock: program.release});
		
		console.log(singleToRelease);
		if(singleToRelease){
			await singleToRelease.remove();
		}
		
		return process.exit(0);
	}
	
	var locksToRelease = await LockModel.find({time: {$lt: Date.now()}});
	console.log('Items to clear', locksToRelease.length);
	for( var i=0; i<locksToRelease.length; i++ ) {
		console.log('generic timeout', locksToRelease[i]);
		await locksToRelease[i].remove();
	}

	if (program.lock){
		console.log("new lock", program.lock);
		let previousLock = await LockModel.findOne({lock: program.lock});
		
		console.log("previous", previousLock);
		
		
		if(previousLock && previousLock.time > Date.now()){
			console.log("previous is valid");
			return process.exit(1);
		}else{
			
			if(previousLock){
				console.log("releasing previous");
				await previousLock.remove();
			}
		
			console.log("applying new");
			
			let newLock = new LockModel({lock: program.lock,time: Date.now()*1+lockTime*1 });
			await newLock.save();
			return process.exit(0);
		}
	}
	
	process.exit(1);
})();