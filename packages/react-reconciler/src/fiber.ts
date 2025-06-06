import { Props, Key, Ref, ReactElementType } from 'shared/ReactTypes';
import {
  ContextProvider,
  Fragment,
  FunctionComponent,
  HostComponent,
  WorkTag,
} from './workTags';
import { Flags, NoFlags } from './fiberFlag';
import { Container } from 'hostConfig';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { CallbackNode } from 'scheduler';
import { REACT_PROVIDER_TYPE } from 'shared/ReactSymbols';

export class FiberNode {
  tag: WorkTag;
  key: Key;
  type: any;
  ref: Ref;
  stateNode: any;

  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  pendingProps: Props;
  memoizedProps: Props;
  memoizedState: any;
  alternate: FiberNode | null;
  flags: Flags;
  subtreeFlags: Flags;
  updateQueue: unknown;
  deletions: FiberNode[] | null;
  lanes: Lanes;

  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key || null;
    this.type = null;
    this.ref = null;
    this.stateNode = null;

    // 构成树状结构
    this.return = null; // 指向父fiberNode
    this.sibling = null; // 右边的兄弟fiberNode
    this.child = null; // 子fiberNode
    this.index = 0;

    // 工作单元
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.alternate = null;
    this.updateQueue = null;
    this.deletions = null;
    this.lanes = NoLanes;

    // 副作用
    this.flags = NoFlags;
    this.subtreeFlags = NoFlags;
  }
}

export interface PendingPassiveEffects {
  unmount: Effect[];
  update: Effect[];
}

export class FiberRootNode {
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null;
  pendingLanes: Lanes;
  finishedLane: Lane;
  pendingPassvieEffects: PendingPassiveEffects;
  callbackNode: CallbackNode | null;
  callbackPriority: Lane;

  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    hostRootFiber.stateNode = this;
    this.finishedWork = null;
    this.pendingLanes = NoLanes;
    this.finishedLane = NoLane;
    this.pendingPassvieEffects = {
      unmount: [],
      update: [],
    };
    this.callbackNode = null;
    this.callbackPriority = NoLane;
  }
}

export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
): FiberNode => {
  let wip = current.alternate;

  if (wip === null) {
    // mount
    wip = new FiberNode(current.tag, pendingProps, current.key);
    wip.stateNode = current.stateNode;
    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update
    wip.pendingProps = pendingProps;
    wip.flags = NoFlags;
    wip.subtreeFlags = NoFlags;
    wip.deletions = null;
  }
  wip.type = current.type;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;
  wip.ref = current.memoizedState;

  return wip;
};

export function createFiberFromElement(
  element: ReactElementType,
  lanes: Lanes
): FiberNode {
  const { type, key, props, ref } = element;
  let fiberTag: WorkTag = FunctionComponent;

  if (typeof type === 'string') {
    fiberTag = HostComponent;
  } else if (
    typeof type === 'object' &&
    type.$$typeof === REACT_PROVIDER_TYPE
  ) {
    fiberTag = ContextProvider;
  } else if (typeof type !== 'function' && __DEV__) {
    console.warn('未定义的type类型', element);
  }
  const fiber = new FiberNode(fiberTag, props, key);
  fiber.type = type;
  fiber.lanes = lanes;
  fiber.ref = ref;

  return fiber;
}

export function createFiberFromFragment(elements: any[], key: Key): FiberNode {
  const fiber = new FiberNode(Fragment, elements, key);
  return fiber;
}
