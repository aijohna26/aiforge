export const MONACO_TYPE_STUBS: Array<{ path: string; content: string }> = [
  {
    path: "file:///node_modules/expo-router/index.d.ts",
    content: `
declare module "expo-router" {
  import * as React from "react";

  export interface StackProps {
    screenOptions?: Record<string, unknown>;
    children?: React.ReactNode;
  }

  export const Stack: React.ComponentType<StackProps>;
  export const Slot: React.ComponentType<{ children?: React.ReactNode }>;
  export const Tabs: React.ComponentType<Record<string, unknown>>;
  export const Link: React.ComponentType<{ href: string; children?: React.ReactNode }>;
  export function useRouter(): { push(path: string): void; replace(path: string): void };
  export function usePathname(): string;
  export function useLocalSearchParams(): Record<string, string>;
}
`,
  },
  {
    path: "file:///node_modules/expo-status-bar/index.d.ts",
    content: `
declare module "expo-status-bar" {
  import * as React from "react";

  export interface StatusBarProps {
    style?: "auto" | "inverted" | "light" | "dark";
  }

  export const StatusBar: React.ComponentType<StatusBarProps>;
}
`,
  },
  {
    path: "file:///node_modules/expo/index.d.ts",
    content: `
declare module "expo" {
  export const Platform: { OS: "ios" | "android" | "web" };
  export function registerRootComponent(component: unknown): void;
}
`,
  },
  {
    path: "file:///node_modules/react-native/index.d.ts",
    content: `
declare module "react-native" {
  import * as React from "react";

  export interface RNProps {
    style?: unknown;
    children?: React.ReactNode;
    onPress?: () => void;
  }

  export interface TextInputProps extends RNProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    keyboardType?: string;
  }

  export interface FlatListProps<ItemT> extends RNProps {
    data: ItemT[];
    renderItem: ({ item, index }: { item: ItemT; index: number }) => React.ReactElement | null;
    keyExtractor?: (item: ItemT, index: number) => string;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
  }

  export const View: React.ComponentType<RNProps>;
  export const Text: React.ComponentType<RNProps>;
  export const TextInput: React.ComponentType<TextInputProps>;
  export const TouchableOpacity: React.ComponentType<RNProps>;
  export const ScrollView: React.ComponentType<RNProps>;
  export const SafeAreaView: React.ComponentType<RNProps>;
  export const Pressable: React.ComponentType<RNProps>;
  export const Modal: React.ComponentType<RNProps & { visible?: boolean; onRequestClose?: () => void }>;
  export const ActivityIndicator: React.ComponentType<RNProps & { size?: "small" | "large"; color?: string }>;
  export const Alert: { alert(title: string, message?: string): void };
  export const Animated: Record<string, unknown>;

  export const FlatList: <ItemT>(props: FlatListProps<ItemT>) => React.ReactElement | null;

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };
}
`,
  },
  {
    path: "file:///node_modules/@react-native-async-storage/async-storage/index.d.ts",
    content: `
declare module "@react-native-async-storage/async-storage" {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  export default AsyncStorage;
}
`,
  },
  {
    path: "file:///node_modules/react/index.d.ts",
    content: `
declare module "react" {
  export type ReactNode = ReactElement | string | number | boolean | null | undefined;

  export interface ReactElement<P = any> {
    type: any;
    props: P;
    key: string | number | null;
  }

  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
  }

  export interface ComponentClass<P = {}> {
    new (props: P): Component<P>;
  }

  export class Component<P = {}, S = {}> {
    constructor(props: P);
    setState(state: Partial<S>): void;
    render(): ReactNode;
  }

  export function createElement<P>(type: any, props?: P, ...children: ReactNode[]): ReactElement<P>;
  export function useState<S>(initialState: S): [S, (value: S) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;

  export type FC<P = {}> = FunctionComponent<P>;
  export type ReactElementType<P = any> = ReactElement<P>;
}
`,
  },
  {
    path: "file:///node_modules/react/jsx-runtime.d.ts",
    content: `
import { ReactElement } from "react";

declare module "react/jsx-runtime" {
  export function jsx(type: any, props: any, key?: any): ReactElement;
  export function jsxs(type: any, props: any, key?: any): ReactElement;
  export function Fragment(props: { children?: React.ReactNode }): ReactElement;
}
`,
  },
  {
    path: "file:///node_modules/react-dom/index.d.ts",
    content: `
declare module "react-dom" {
  import { ReactElement } from "react";

  export function render(element: ReactElement, container: Element | DocumentFragment): void;
}
`,
  },
];
