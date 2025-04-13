import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
  commitHookEffectListCreate,
  commitHookEffectListDestroy,
  commitHookEffectListUnmount,
  commitMutationEffects,
} from './commitWork';
import { completeWork } from './completeWork';
import {
  createWorkInProgress,
  FiberNode,
  FiberRootNode,
  PendingPassiveEffects,
} from './fiber';
import { MutaionMask, NoFlags, PassiveMask } from './fiberFlag';
import {
  getHighestPriorityLane,
  Lane,
  markRootFinished,
  mergeLanes,
  NoLane,
  SyncLane,
} from './fiberLanes';
import { flushSyncCallback, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffect: boolean = false;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
  workInProgress = createWorkInProgress(root.current, {});
  wipRootRenderLane = lane;
}

export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
  // TODO: 调度功能
  const root = markUpdateFromFiberToRoot(fiber);
  markRootUpdated(root, lane);
  // renderRoot(root);
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root: FiberRootNode) {
  const updateLane = getHighestPriorityLane(root.pendingLanes);
  if (updateLane === NoLane) {
    return;
  }
  if (updateLane === SyncLane) {
    // 同步优先级，用微任务调度
    if (__DEV__) {
      console.log('在为任务中调度优先级：', updateLane);
    }
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root, updateLane));
    scheduleMicroTask(flushSyncCallback);
  } else {
    // 其他优先级，用宏任务调度
  }
}

function markRootUpdated(root: FiberRootNode, lane: Lane) {
  root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode;
  }
  return null;
}

function performSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
  const nextLane = getHighestPriorityLane(root.pendingLanes);
  if (nextLane !== SyncLane) {
    // 其他比synclane低的优先级
    // NoLane
    ensureRootIsScheduled(root);
    return;
  }

  if (__DEV__) {
    console.warn('render阶段开始');
  }

  // 初始化
  prepareFreshStack(root, lane);

  do {
    try {
      workLoop();
      break;
    } catch (error) {
      if (__DEV__) {
        console.error('workLoop错误', error);
      }
      workInProgress = null;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);

  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  root.finishedLane = lane;
  wipRootRenderLane = NoLane;

  commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
  const finishedWork = root.finishedWork;

  if (finishedWork === null) {
    return;
  }

  if (__DEV__) {
    console.warn('commit阶段开始', finishedWork);
  }
  const lane = root.finishedLane;

  // 重置操作
  root.finishedWork = null;
  root.finishedLane = NoLane;

  if (lane === NoLane && __DEV__) {
    console.error('commit阶段finishedLane不应该是NoLane');
  }

  markRootFinished(root, lane);

  if (
    (finishedWork.flags & PassiveMask) !== NoFlags ||
    (finishedWork.subtreeFlags & PassiveMask) !== NoFlags
  ) {
    if (!rootDoesHasPassiveEffect) {
      rootDoesHasPassiveEffect = true;
      // 调度副作用
      scheduleCallback(NormalPriority, () => {
        // 执行副作用
        flushPassiveEffects(root.pendingPassvieEffects);
        return;
      });
    }
  }

  // 判断是否存在3个子阶段需要执行的操作
  // root flags 和 root subtreeFlags
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutaionMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutaionMask) !== NoFlags;

  if (subtreeHasEffects || rootHasEffects) {
    // beforeMutation
    // mutation Placement
    commitMutationEffects(finishedWork, root);
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }

  rootDoesHasPassiveEffect = false;
  ensureRootIsScheduled(root);
}

function flushPassiveEffects(pendingPassvieEffects: PendingPassiveEffects) {
  pendingPassvieEffects.unmount.forEach(effect => {
    commitHookEffectListUnmount(Passive, effect);
  });
  pendingPassvieEffects.unmount = [];

  pendingPassvieEffects.update.forEach(effect => {
    commitHookEffectListDestroy(Passive | HookHasEffect, effect);
  });

  pendingPassvieEffects.update.forEach(effect => {
    commitHookEffectListCreate(Passive | HookHasEffect, effect); 
  });
  pendingPassvieEffects.update = [];
  flushSyncCallback();
}

function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber, wipRootRenderLane);
  fiber.memoizedProps = fiber.pendingProps;

  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    workInProgress = next;
  }
}

function completeUnitOfWork(fiber: FiberNode) {
  let node: FiberNode | null = fiber;

  while (node !== null) {
    completeWork(node);
    const sibling = node.sibling;

    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    node = node.return;
    workInProgress = node;
  }
}
