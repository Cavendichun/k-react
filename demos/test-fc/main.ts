import {
  unstable_ImmediatePriority as ImmediatePriority, // 同步更新
  unstable_UserBlockingPriority as UserBlockingPriority, // 点击事件，输入事件等
  unstable_NormalPriority as NormalPriority, // 正常优先级
  unstable_LowPriority as LowPriority, // 低优先级
  unstable_IdlePriority as IdlePriority, // 空闲优先级
} from 'scheduler';
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_shouldYield as shouldYield,
  CallbackNode,
  unstable_getFirstCallbackNode as getFirstCallbackNode,
  unstable_cancelCallback as cancelCallback,
} from 'scheduler';
import './style.css';

const root = document.querySelector('#root');

type Priority =
  | typeof IdlePriority
  | typeof LowPriority
  | typeof NormalPriority
  | typeof UserBlockingPriority
  | typeof ImmediatePriority;

interface Work {
  count: number;
  priority: Priority;
}

const workList: Work[] = [];
let prevPriority: Priority = IdlePriority;
let curCallback: CallbackNode | null;

[LowPriority, NormalPriority, UserBlockingPriority, ImmediatePriority].forEach(
  priority => {
    const btn = document.createElement('button');
    btn.innerText = [
      '',
      'ImmediatePriority',
      'UserBlockingPriority',
      'NormalPriority',
      'LowPriority',
    ][priority];
    root?.appendChild(btn);

    btn.onclick = () => {
      workList.unshift({
        count: 100,
        priority: priority as Priority,
      });
      schedule();
    };
  }
);

function schedule() {
  const cbNode = getFirstCallbackNode();
  // console.log('cbNode:', cbNode);
  const curWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0];
  // console.log('curWork:', curWork);

  // 策略逻辑
  if (!curWork) {
    curCallback = null;
    if (cbNode) {
      cancelCallback(cbNode);
    }
    return;
  }

  const { priority: curPriority } = curWork;

  if (curPriority === prevPriority) {
    // console.log('curPriority === prevPriority');
    return;
  }

  // 更高优先级的work
  if (cbNode) {
    cancelCallback(cbNode);
  }
  curCallback = scheduleCallback(curPriority, perform.bind(null, curWork));
}

function perform(work: Work, didTimeout?: boolean): any {
  /**
   * 1. work的priority很高
   * 2. 饥饿问题
   * 3. 时间切片
   */
  const needSync = work.priority === ImmediatePriority || didTimeout;

  while ((needSync || !shouldYield()) && work.count) {
    work.count--;
    insertSpan(work.priority + '');
  }

  // 中断执行 || 执行完成
  prevPriority = work.priority;
  if (!work.count) {
    const workIndex = workList.indexOf(work);
    workList.splice(workIndex, 1);
    prevPriority = IdlePriority;
  }

  const prevCallback = curCallback;
  schedule();
  const newCallback = curCallback;

  if (newCallback && prevCallback === newCallback) {
    return perform.bind(null, work);
  }
}

function insertSpan(content: string) {
  const span = document.createElement('span');
  span.innerText = content;
  span.className = `pri-${content}`;
  doSomeBusyWork(10000000);
  root?.appendChild(span);
}

function doSomeBusyWork(len: number) {
  while (len) {
    len--;
  }
}
