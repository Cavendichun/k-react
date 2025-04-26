import { ReactContext } from 'shared/ReactTypes';

let prevContextValue: any = null;
const preContextValueStack: any[] = [];

export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
  preContextValueStack.push(prevContextValue);

  prevContextValue = context._currentValue;
  context._currentValue = newValue;
}

export function popProvider<T>(context: ReactContext<T>) {
  context._currentValue = prevContextValue;

  prevContextValue = preContextValueStack.pop(); 
}
