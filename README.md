# md5-comparison

Work in progress yet, lol.

## TODO
- Complete (It's almost done, but I need to do some features. For example, add stream computing with Web Worker, and fix "Store in memory" mode with enabled Web Worker.)
- Description (It requires a long description about performance (for both Chromiums and Firefox) and about the different settings)

## Short description

Currently you can use it to check the performance of some libs for computing MD5 hash for big files. Use 10 MB and over files (up to 2 GB for "Compute" and any size for "Stream Compute").

"Compute" loads the full file in memory first, so it can take a while.

The first computing of each file will be always slower, because the second and follow readings of a file can be performed from OS' cache.

Checking the speed with a text or with a tiny file has no sense, because of there is no benchmark mode.
