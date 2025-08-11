declare module 'react-native-fs' {
  interface RNFSModule {
    DocumentDirectoryPath: string;
    readFile(path: string, encoding: 'utf8'): Promise<string>;
    writeFile(path: string, contents: string, encoding: 'utf8'): Promise<void>;
    exists(path: string): Promise<boolean>;
  }
  const RNFS: RNFSModule;
  export default RNFS;
}


