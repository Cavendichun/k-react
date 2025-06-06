import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
import currentBatchConfig from './src/currentBatchConfig';
import { jsxDev, Fragment } from './src/jsx';

export { createContext } from './src/context';

export const useState: Dispatcher['useState'] = initialState => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
};

export const useTransition: Dispatcher['useTransition'] = () => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useTransition();
};

export const useRef: Dispatcher['useRef'] = initialValue => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
};

export const useContext: Dispatcher['useContext'] = context => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(context);
};

// 内部数据共享层
export const __SECRET_INTERNALS_NO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
  currentBatchConfig,
};

export default {
  version: '0.0.0',
  createElement: jsxDev,
  Fragment,
};
