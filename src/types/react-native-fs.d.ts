declare module 'react-native-fs' {
  interface RNFSModule {
    DocumentDirectoryPath: string;
    readFile(path: string, encoding: 'utf8' | 'base64'): Promise<string>;
    writeFile(path: string, contents: string, encoding: 'utf8' | 'base64'): Promise<void>;
    exists(path: string): Promise<boolean>;
    mkdir(path: string): Promise<void>;
    copyFile(from: string, to: string): Promise<void>;
    downloadFile(options: { fromUrl: string; toFile: string }): { promise: Promise<{ statusCode?: number }>; jobId: number };
  }
  const RNFS: RNFSModule;
  export default RNFS;
}


