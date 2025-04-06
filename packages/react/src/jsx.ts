import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from 'shared/ReactSymbols';
import {
  Type,
  Key,
  Ref,
  Props,
  ElementType,
  ReactElementType,
} from 'shared/ReactTypes';

const ReactElement = function (
  type: Type,
  key: Key,
  ref: Ref,
  props: Props
): ReactElementType {
  const element = {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props,
    __mark: 'KK',
  };
  return element;
};

export const jsx = function (
  type: ElementType,
  config: any,
  ...maybeChildren: any
) {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== undefined) {
        key = val.toString();
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }

  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength > 0) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }
  return ReactElement(type, key, ref, props);
};

export const Fragment = REACT_FRAGMENT_TYPE;

export const jsxDev = function (
  type: ElementType,
  config: any,
  ...maybeChildren: any
) {
  let key: Key = null;
  const props: Props = {};
  let ref: Ref = null;

  for (const prop in config) {
    const val = config[prop];
    if (prop === 'key') {
      if (val !== undefined) {
        key = val.toString();
      }
      continue;
    }
    if (prop === 'ref') {
      if (val !== undefined) {
        ref = val;
      }
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(config, prop)) {
      props[prop] = val;
    }
  }

  const maybeChildrenLength = maybeChildren.length;
  if (maybeChildrenLength > 0) {
    if (maybeChildrenLength === 1) {
      props.children = maybeChildren[0];
    } else {
      props.children = maybeChildren;
    }
  }
  return ReactElement(type, key, ref, props);
};
