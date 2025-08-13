declare module 'react-native-tts' {
  type TTSListener = (...args: any[]) => void;
  interface TTSModule {
    speak(text: string): Promise<void> | void;
    stop(): Promise<void> | void;
    setDefaultRate(rate: number, skipTransform?: boolean): void;
    setDefaultLanguage(lang: string): Promise<void> | void;
    addEventListener(event: string, listener: TTSListener): void;
    removeEventListener(event: string, listener: TTSListener): void;
  }
  const TTS: TTSModule;
  export default TTS;
}


