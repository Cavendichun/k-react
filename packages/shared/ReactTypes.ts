export type Type = any;
export type Key = string | null;
export type Ref = { current: any } | ((instance: any) => void);
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
  $$typeof: symbol | number;
  type: ElementType;
  key: Key;
  props: Props;
  ref: Ref;
  __mark: string;
}

export type Action<State> = State | ((preveState: State) => State);

export type ReactContext<T> = {
  $$typeof: symbol | number;
  Provider: ReactProviderType<T> | null;
  _currentValue: T;
};

export type ReactProviderType<T> = {
  $$typeof: number | symbol;
  _context: ReactContext<T> | null;
};
