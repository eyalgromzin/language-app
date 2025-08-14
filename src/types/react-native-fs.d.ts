declare module 'react-native-fs' {
  export type Encoding = 'utf8' | 'base64';

  export interface StatResult {
    path: string;
    size: number;
    originalFilepath?: string;
    isFile(): boolean;
    isDirectory(): boolean;
  }

  export const DocumentDirectoryPath: string;
  export const CachesDirectoryPath: string;
  export const DownloadDirectoryPath: string;
  export const TemporaryDirectoryPath: string;
  export const MainBundlePath: string | undefined;

  export function exists(path: string): Promise<boolean>;
  export function mkdir(path: string): Promise<void>;
  export function copyFile(from: string, to: string): Promise<void>;
  export function readFile(path: string, encoding?: Encoding): Promise<string>;
  export function writeFile(path: string, contents: string, encoding?: Encoding): Promise<void>;
  export function stat(path: string): Promise<StatResult>;
  export function unlink(path: string): Promise<void>;
  export function downloadFile(options: { fromUrl: string; toFile: string; begin?: (arg: { contentLength: number }) => void; progress?: (arg: { bytesWritten: number; contentLength: number }) => void }): { promise: Promise<{ statusCode?: number }>; jobId: number };

  const RNFS: {
    DocumentDirectoryPath: typeof DocumentDirectoryPath;
    CachesDirectoryPath: typeof CachesDirectoryPath;
    DownloadDirectoryPath: typeof DownloadDirectoryPath;
    TemporaryDirectoryPath: typeof TemporaryDirectoryPath;
    MainBundlePath: typeof MainBundlePath;
    exists: typeof exists;
    mkdir: typeof mkdir;
    copyFile: typeof copyFile;
    readFile: typeof readFile;
    writeFile: typeof writeFile;
    stat: typeof stat;
    unlink: typeof unlink;
    downloadFile: typeof downloadFile;
  };
  export default RNFS;
}



