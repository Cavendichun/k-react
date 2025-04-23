import {
  appendChildToContainer,
  commitUpdate,
  Container,
  insertChildToContainer,
  Instance,
  removeChild,
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
  ChildDeletion,
  Flags,
  LayoutMask,
  MutaionMask,
  NoFlags,
  PassiveEffect,
  PassiveMask,
  Placement,
  Ref,
  Update,
} from './fiberFlag';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null;

function commitMutationEffectsOnFiber(
  finishedWork: FiberNode,
  root: FiberRootNode
) {
  const { flags, tag } = finishedWork;

  if ((flags & Placement) != NoFlags) {
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }

  if ((flags & Update) != NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }

  if ((flags & ChildDeletion) != NoFlags) {
    const deletions = finishedWork.deletions;
    if (deletions !== null) {
      deletions.forEach(childToDelete => {
        commitDeletion(childToDelete, root);
      });
    }
    // commitChildDeletion(finishedWork);
    finishedWork.flags &= ~ChildDeletion;
  }

  // 包含useEffect的flag
  if ((flags & PassiveEffect) !== NoFlags) {
    // 收集回调
    commitPassiveEffect(finishedWork, root, 'update');
    finishedWork.flags &= ~PassiveEffect;
  }

  if ((flags & Ref) !== NoFlags && tag === HostComponent) {
    safelyDetachRef(finishedWork);
  }
}

function commitLayoutEffectsOnFiber(
  finishedWork: FiberNode,
  root: FiberRootNode
) {
  const { flags, tag } = finishedWork;

  if ((flags & Ref) != NoFlags && tag === HostComponent) {
    // 绑定新的ref
    safelyAttachRef(finishedWork);
    finishedWork.flags &= ~Ref;
  }
}

function safelyAttachRef(fiber: FiberNode) {
  const ref = fiber.ref;
  if (ref !== null) {
    const instance = fiber.stateNode;
    if (typeof ref === 'function') {
      ref(instance);
    } else {
      ref.current = instance;
    }
  }
}

function safelyDetachRef(current: FiberNode) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
      ref(null);
    } else {
      ref.current = null;
    }
  }
}

export const commitEffects = (
  phrase: 'mutation' | 'layout',
  mask: Flags,
  callback: (fiber: FiberNode, root: FiberRootNode) => void
) => {
  return (finishedWork: FiberNode, root: FiberRootNode) => {
    nextEffect = finishedWork;

    while (nextEffect !== null) {
      // 向下遍历 DFS
      const child: FiberNode | null = nextEffect.child;

      if ((nextEffect.subtreeFlags & mask) !== NoFlags && child !== null) {
        nextEffect = child;
      } else {
        // 向上遍历 DFS
        up: while (nextEffect !== null) {
          callback(nextEffect, root);
          const sibling: FiberNode | null = nextEffect.sibling;

          if (sibling !== null) {
            nextEffect = sibling;
            break up;
          }
          nextEffect = nextEffect.return;
        }
      }
    }
  };
};

export const commitMutationEffects = commitEffects(
  'mutation',
  MutaionMask | PassiveMask,
  commitMutationEffectsOnFiber
);

export const commitLayoutEffects = commitEffects(
  'layout',
  LayoutMask,
  commitLayoutEffectsOnFiber
);

function commitPassiveEffect(
  fiber: FiberNode,
  root: FiberRootNode,
  type: keyof PendingPassiveEffects
) {
  // update unmount
  if (
    fiber.tag !== FunctionComponent ||
    (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
  ) {
    return;
  }
  const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
  if (updateQueue !== null) {
    if (updateQueue.lastEffect === null && __DEV__) {
      console.error('当FC存在PassviceEffect时，不应该不存在Effect');
    }
    root.pendingPassvieEffects[type].push(updateQueue.lastEffect as Effect);
  }
}

function commitHookEffectList(
  flags: Flags,
  lastEffect: Effect,
  callback: (effect: Effect) => void
) {
  let effect = lastEffect.next as Effect;

  do {
    if ((effect.tag & flags) === flags) {
      callback(effect);
    }
    effect = effect.next as Effect;
  } while (effect !== lastEffect.next);
}

// 组件卸载的时候
export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const destroy = effect.destroy;
    if (typeof destroy === 'function') {
      destroy();
    }
    // unmount后不能再触发create
    effect.tag &= ~HookHasEffect;
  });
}

// 触发上次更新留下的destroy
export function commitHookEffectListDestroy(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const destroy = effect.destroy;
    if (typeof destroy === 'function') {
      destroy();
    }
  });
}

// 执行所有create的回调
export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
  commitHookEffectList(flags, lastEffect, effect => {
    const create = effect.create;
    if (typeof create === 'function') {
      effect.destroy = create();
    }
  });
}

function recordHostchildrenToDelete(
  childToDelete: FiberNode[],
  unmountFiber: FiberNode
) {
  // 找到第一个roothost节点
  const lastOne = childToDelete[childToDelete.length - 1];

  if (!lastOne) {
    childToDelete.push(unmountFiber);
  } else {
    let node = lastOne.sibling;
    while (node !== null) {
      if (unmountFiber === node) {
        childToDelete.push(unmountFiber);
      }
      node = node.sibling;
    }
  }
  // 每找到一个host节点，判断下这个节点是不是一个步找到那个节点的兄弟节点
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
  const rootChildrenToDelete: FiberNode[] = [];
  // 递归子树
  commitNestedComponent(childToDelete, unmountFiber => {
    switch (unmountFiber.tag) {
      case HostComponent:
        recordHostchildrenToDelete(rootChildrenToDelete, unmountFiber);
        // TODO: 解绑ref
        safelyDetachRef(unmountFiber);
        return;
      case HostText:
        recordHostchildrenToDelete(rootChildrenToDelete, unmountFiber);
        return;
      case FunctionComponent:
        // TODO: 解绑ref
        commitPassiveEffect(unmountFiber, root, 'unmount');
        return;
      default:
        if (__DEV__) {
          console.warn('未处理的unmount类型', childToDelete);
        }
        break;
    }
  });

  if (rootChildrenToDelete.length) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      rootChildrenToDelete.forEach(node => {
        removeChild(node.stateNode, hostParent);
      });
    }
  }

  childToDelete.return = null;
  childToDelete.child = null;
  // 移除rootHostComponent的DOM
}

function commitNestedComponent(
  root: FiberNode,
  onCommitUnmount: (fiber: FiberNode) => void
) {
  let node = root;
  while (true) {
    onCommitUnmount(node);

    if (node.child !== null) {
      // 向下遍历
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      // 终止条件
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.warn('执行Placement操作', finishedWork);
  }
  // 父级的dom节点
  const hostParent = getHostParent(finishedWork);

  // host sibling
  const sibling = getHostSibling(finishedWork);

  // finishedWork对应的dom节点
  if (hostParent !== null) {
    insertOrAppendPlacementIntoContainer(finishedWork, hostParent, sibling);
  }
}

function getHostSibling(fiber: FiberNode) {
  let node: FiberNode = fiber;

  findSibling: while (true) {
    while (node.sibling === null) {
      const parent = node.return;

      if (
        parent === null ||
        parent.tag === HostComponent ||
        parent.tag === HostRoot
      ) {
        return null;
      }
      node = parent;
    }
    node.sibling.return = node.return;
    node = node.sibling;

    while (node.tag !== HostText && node.tag !== HostComponent) {
      // 向下遍历找子孙节点（不稳定的host节点不能作为host sibling）
      if ((node.flags & Placement) !== NoFlags) {
        continue findSibling;
      }
      if (node.child === null) {
        continue findSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if ((node.flags & Placement) === NoFlags) {
      return node.stateNode;
    }
  }
}

function getHostParent(fiber: FiberNode): Container | null {
  let parent = fiber.return;

  while (parent) {
    const parentTag = parent.tag;
    // hostComponent
    if (parentTag === HostComponent) {
      return parent.stateNode as Container;
    }
    if (parentTag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
    parent = parent.return;
  }
  if (__DEV__) {
    console.warn('未找到hostparent');
  }
  return null;
}

function insertOrAppendPlacementIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance
) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      appendChildToContainer(hostParent, finishedWork.stateNode);
    }
    return;
  }
  const child = finishedWork.child;
  if (child != null) {
    insertOrAppendPlacementIntoContainer(child, hostParent);

    let sibling = child.sibling;
    while (sibling !== null) {
      insertOrAppendPlacementIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}
