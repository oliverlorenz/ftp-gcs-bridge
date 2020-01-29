# ftp-gcs-brige

Provides a minimal FTP server to transfer files to Google Cloud Storage (gcs) in the background.

## Motivation

My scanner itself is only able to move the files to an FTP server. But I want to process my scans in the Google Cloud after scan, so I needed a FTP bridge to the Google Cloud Storage.

## Goal

* Provide FTP interface
* FTP interface is as minimal as possible.
  * It just can list files on the root level of the bucket (LIST)
  * Can receive files (STOR)
* Upload the file to Google Cloud Storage

## Getting started

### install
```
npm install
```

### start
```
npm start
```
or, for better human readability
```
npm start | npx bunyan
```

## start as docker container

### build (optional)
```
docker build -t oliverlorenz/ftp-gcs-bridge .
```

### run
```
docker run -it \
  -v "/path/to/google/service-account.json:/service-account.json" \
  -e "BUCKET_NAME=<NAME OF BUCKET>" \
  --network=host test
```

## known problems
* container only runs in network mode "host" (maybe somebody has a idea to fix this?)
