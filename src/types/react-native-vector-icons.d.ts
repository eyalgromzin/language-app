declare module 'react-native-vector-icons/Ionicons' {
  import * as React from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle | ViewStyle>;
  }

  export default class Ionicons extends React.Component<IconProps> {}
}


