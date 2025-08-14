declare module 'react-native-document-picker' {
  type CopyTo = 'cachesDirectory' | 'documentDirectory';
  export interface DocumentPickerResponse {
    uri: string;
    name?: string;
    type?: string | null;
    size?: number | null;
    fileCopyUri?: string | null;
  }
  export interface Types {
    allFiles: string;
    images: string;
    plainText: string;
  }
  const types: Types;
  export function pickSingle(options?: { type?: string[]; copyTo?: CopyTo }): Promise<DocumentPickerResponse>;
  const _default: { pickSingle: typeof pickSingle; types: Types };
  export default _default;
}


