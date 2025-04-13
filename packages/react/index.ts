import { Dispatcher, resolveDispatcher } from './src/currentDispatcher';
import currentDispatcher from './src/currentDispatcher';
import { jsxDev, Fragment } from './src/jsx';

export const useState: Dispatcher['useState'] = initialState => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
};

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
};

// 内部数据共享层
export const __SECRET_INTERNALS_NO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
};

export default {
  version: '0.0.0',
  createElement: jsxDev,
  Fragment,
};
