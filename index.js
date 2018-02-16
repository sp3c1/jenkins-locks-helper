const mongoose = require('mongoose');
const Admin = mongoose.mongo.Admin;
var program = require('commander');
 
program
  .version('0.1.0')
  .option('-l, --lock [type]', 'Name of lock to apply')
  .option('-t, --time [type]', 'Lock time')
  .option('-pl, --pidlock [type]', 'Pid lock')
  .option('-r, --release [type]', 'Name of lock to release')
  .option('-c, --clean', 'Clean the MongoDBs (will leave lock table)')
  .parse(process.argv);
 
var lockTime = Math.max(program.time || 1000*60*2,1000*60*10);
 
console.log = function(){}
 
 if(program.clean){
  (async function(){
	  try{
		  var con = await mongoose.createConnection('mongodb://127.0.0.1:27017/lock');
		  var dbs = await new Admin(con.db).listDatabases();
		  if(dbs){
			  console.log(dbs);
			  for(var i=0; i<dbs.databases.length; i++){
				  if(!['lock', 'admin', 'local'].includes(dbs.databases[i].name)){
					  console.log('deleting', dbs.databases[i].name);
					  var conToDrop = await mongoose.createConnection('mongodb://127.0.0.1:27017/'+dbs.databases[i].name);
					  var doppedCheck = await conToDrop.db.dropDatabase();
					  console.log(doppedCheck);
				  }
			  }
			  process.exit(0)
		  }
		  
		  console.log('no dbs to clean');
	  }catch(e){
		  console.log(e);
	  }
	  process.exit(1)
  })()
  return 1;
 }
 
 if (!program.lock && !program.release && !program.pidlock){	
	return process.exit(1);
}
 
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
	
var LockSchema = new Schema({
    lock     : { type: String, unique: true },
    time     : Number,
	pid      : String
}, {expireAfterSeconds: 60*10});
	
var LockModel = mongoose.model('Lock', LockSchema);
	
(async function(){
	await mongoose.connect('mongodb://127.0.0.1:27017/lock');
	if (program.release && !program.pidlock){			
		var singleToRelease = await LockModel.findOne({lock: program.release});
		
		console.log(singleToRelease);
		if(singleToRelease){
			await singleToRelease.remove();
		}
		
		return process.exit(0);
	}
	
	if (program.release && program.pidlock){
		var manyToRelease = await LockModel.find({pid: program.pidlock});
		
		for(var i=0; i < manyToRelease.length; i++){
			await manyToRelease[i].remove();
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
		
		var query = {lock: program.lock};
		
		if(program.pidlock){
			query.pid = program.pidlock;
		}
		
		let previousLock = await LockModel.findOne(query);
		
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