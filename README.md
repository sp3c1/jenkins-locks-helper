= Info
Helpers to achieve throttling. Outstanding locks are cleared on every valid index.js (lock or release). Mongo schema got TTL o 10 minutes. Lock name is unique.

= Attempt.js
SO you want a lock from pipline. Invoke the `node attempt.js -l lockname -t 2000`. Default `-t` is 2 minutes. It will hang for 10 minutes, trying to get the lock. Exit with 0 when locked, 1 when failed.

= Index.js
So you want to release? Invoke the `node attempt.js -l lockname`. Will free the lock.
