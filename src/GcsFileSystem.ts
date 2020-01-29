import { Storage, File, Bucket } from "@google-cloud/storage";
import * as fs from "fs";
const tempPath = require('temp-path');
import * as bunyan from 'bunyan';

export class GcsFileSystem {
  private bucket: Bucket;
  private storage: Storage;
  public root: string = '/';

  constructor(
    bucketName: string,
    private logger: bunyan
  ) {
    this.storage = new Storage({
      keyFile: '/service-account.json' || process.env.GOOGLE_APPLICATION_CREDENTIALS
    });
    this.bucket = this.storage.bucket(bucketName);
  }

  async init() {
    this.logger.debug('init gcs');
    try {
      const buckets = (await this.storage.getBuckets())[0];
      if (buckets.length) {
        this.logger.debug(`can access ${buckets.length} buckets`);
      } else {
        this.logger.warn(`can access ${buckets.length} buckets`);
      }
    } catch (err) {
      this.logger.fatal(`bucket listing doesn't work`, { err });
    }
  }

  currentDirectory() {
    return this.root;
  }

  async get(fileName) {
    this.logger.debug('get')
    if (fileName === '.') {
      return {
        isFile: () => false,
        isDirectory: () => true,
      }
    } else {
      return this.mapStatFromGcsFile(
        await this.bucket.file(fileName)
      )
    }
  }

  protected async gcsGetFileList(): Promise<File[]> {
    const [files] = await this.bucket.getFiles();
    return files;
  }

  protected mapStatFromGcsFile(file: File): fs.Stats {
    // @ts-ignore
    return {
      isFile: () => { return !file.name.endsWith('/') },
      isDirectory: () => { return file.name.endsWith('/') },
      isSymbolicLink: () => { return false },
      name: file.name,
      mtime: new Date(file.metadata.updated),
      ctime: new Date(file.metadata.timeCreated),
      size: file.metadata.size,
    } as fs.Stats
  }

  async list() {
    this.logger.debug(`list`);
    const list = await this.gcsGetFileList();
    return list.map(this.mapStatFromGcsFile);
  }

  chdir() {
    return this.root;
  }

  async write(fileName) {
    const tempFilePath = tempPath();
    this.logger.debug(`uploading file to bridge`, { fileName, tempFilePath });
    var writeStream = fs.createWriteStream(tempFilePath);

    writeStream.on('finish', async () => {
      this.logger.info(`upload to bridge finished`, { fileName, tempFilePath });
      await this.bucket.upload(tempFilePath, {
        destination: fileName,
        resumable: false,
      })
      this.logger.debug(`delete temporary file`, { tempFilePath });
      fs.unlinkSync(tempFilePath);
    });

    return { stream: writeStream };
  }
}
