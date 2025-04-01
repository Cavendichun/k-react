import {
  appendChildToContainer,
  commitUpdate,
  Container,
  removeChild,
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
  ChildDeletion,
  MutaionMask,
  NoFlags,
  Placement,
  Update,
} from './fiberFlag';
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from './workTags';

let nextEffect: FiberNode | null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork;

  while (nextEffect !== null) {
    // 向下遍历 DFS
    const child: FiberNode | null = nextEffect.child;

    if ((nextEffect.subtreeFlags & MutaionMask) !== NoFlags && child !== null) {
      nextEffect = child;
    } else {
      // 向上遍历
      up: while (nextEffect !== null) {
        commitMutationEffectsOnFiber(nextEffect);
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

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const flags = finishedWork.flags;

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
        commitDeletion(childToDelete);
      });
    }
    // commitChildDeletion(finishedWork);
    finishedWork.flags &= ~ChildDeletion;
  }
}

function commitDeletion(childToDelete: FiberNode) {
  let rootHostNode: FiberNode | null = null;

  // 递归子树
  commitNestedComponent(childToDelete, unmountFiber => {
    switch (unmountFiber.tag) {
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        // TODO: 解绑ref
        return;
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        return;
      case FunctionComponent:
        // TODO: useEffect清理函数
        return;
      default:
        if (__DEV__) {
          console.warn('未处理的unmount类型', childToDelete);
        }
        break;
    }
  });

  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      removeChild((rootHostNode as FiberNode).stateNode, hostParent);
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
  // finishedWork对应的dom节点
  if (hostParent !== null) {
    appendPlacementIntoContainer(finishedWork, hostParent);
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

function appendPlacementIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container
) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(hostParent, finishedWork.stateNode);
    return;
  }
  const child = finishedWork.child;
  if (child != null) {
    appendPlacementIntoContainer(child, hostParent);

    let sibling = child.sibling;
    while (sibling !== null) {
      appendPlacementIntoContainer(sibling, hostParent);
      sibling = sibling.sibling;
    }
  }
}
