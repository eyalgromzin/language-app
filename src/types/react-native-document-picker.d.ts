declare module '@react-native-documents/picker' {
  export interface DocumentPickerResponse {
    uri: string;
    name?: string;
    type?: string | null;
    size?: number | null;
  }
  export interface Types {
    allFiles: string;
    images: string;
    plainText: string;
  }
  export const types: Types;
  export function pick(options?: { type?: string[] }): Promise<DocumentPickerResponse[]>;
}


