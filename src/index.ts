// Quick start
import { FtpSrv } from 'ftp-srv';
import { GcsFileSystem } from './GcsFileSystem';
import * as bunyan from 'bunyan';

const logger = bunyan.createLogger({ name: 'ftp-gcs-bridge', level: 'debug' });

if (!process.env.BUCKET_NAME) {
  logger.fatal('could not start because env var BUCKET_NAME is not set')
  process.exit(1);
}

const bucketName = process.env.BUCKET_NAME;;
const fs = new GcsFileSystem(bucketName, logger);

(async() => {
  await fs.init();
  const ftpServer = new FtpSrv({
    url: 'ftp://0.0.0.0:2222',
  });

  ftpServer.on('login', ({ username }, resolve, reject) => {
    logger.debug('login', { username });
    resolve({
     // @ts-ignore
     fs,
     // it can only receive and list data, nothing else
     blacklist: [
       "ALLO",
       "APPE",
       "MDTM",
       "MKD",
       "XMKD",
       "NLST",
       "REST",
       "RETR",
       "RMD",
       "RNFR",
       "RNTO",
       "STAT",
       "DELE",
       "SIZE"
      ],
     root: '',
     cwd: ''
    });
  });

  await ftpServer.listen();
})()
