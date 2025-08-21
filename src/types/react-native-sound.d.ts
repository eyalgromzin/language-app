declare module 'react-native-sound' {
  export default class Sound {
    static MAIN_BUNDLE: string;
    static setCategory(category: string): void;
    constructor(filename: string, basePath?: string, onLoad?: (error?: any) => void);
    play(onEnd?: (success: boolean) => void): void;
    release(): void;
  }
}


