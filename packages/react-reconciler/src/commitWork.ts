import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutaionMask, NoFlags, Placement } from './fiberFlag';
import { HostComponent, HostRoot, HostText } from './workTags';

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
  //
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

function appendPlacementIntoContainer(finishedWork: FiberNode, hostParent: Container) {
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
