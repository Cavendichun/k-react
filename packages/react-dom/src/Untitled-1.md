react 的 reconcileChildren 阶段是处理当前 fiber 节点的子节点的 diff 阶段，先生成子节点的 reactElement，如果只有一个子节点，进入 reconcileSingleElement（单节点 diff），否则进入 reconcileArrayChildren（多节点 diff）

单节点 diff，指的是更新后只有一个子节点，diff 过程，会依次遍历 wip.child 链表，情况如下：

- key 不相同，继续遍历 child.sibling（也许后面会有 key 相同的）
- key 相同，但 type 不同，结束遍历，将所有旧的 child 都标记 Delete，生成新的子 fiber，标记 Placement（key 相同，type 不同，唯一可以复用的机会没有了）
- key 相同，type 也相同，直接复用节点，结束遍历

多节点 diff，指的是更新后有多个子节点，diff 过程会分为两轮遍历，过程如下：

第一轮遍历，从头到尾依次遍历新旧节点，尝试按顺序复用节点，减少下一轮处理数量:

- 如果新旧节点的 key 和 type 都相同，复用 fiber，继续对比下一个
- 如果新旧节点 key 相同，但 type 不同，证明没有可复用的 fiber，旧节点标记 Delete，生成新节点标记 Placement，继续对比下一个
- 如果新旧节点的 key 和 type 都不同，说明节点发生了移动，或者是一个全新的节点，跳出对比

第一轮遍历后，会得到几种结果：

- 旧节点遍历完成，新节点还有剩余（说明旧节点全部被复用或标记删除）
  - 把剩余的新节点都标记Placement
- 新节点遍历完成，旧节点还有剩余（说明新节点都来自复用，但少了一些）
  - 把剩余的就节点都标记Delete
- 新旧节点都有剩余（说明右节点发生了移动或生成了全新的节点，需要详细对比）
  - 进入第二轮遍历
