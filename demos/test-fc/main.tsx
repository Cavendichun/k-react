// import React, { useState, useEffect } from 'react';
// import ReactDOM from 'react-dom/client';

// function App() {
//   const [num, updateNum] = useState(0);
//   useEffect(() => {
//     console.log('App mount');
//   }, []);

//   useEffect(() => {
//     console.log('num change create', num);
//     return () => {
//       console.log('num change destroy', num);
//     };
//   }, [num]);

//   return (
//     <div onClick={() => updateNum(num + 1)}>
//       {num === 0 ? <Child /> : 'noop'}
//     </div>
//   );
// }

// function Child() {
//   // useEffect(() => {
//   //   console.log('Child mount');
//   //   return () => console.log('Child unmount');
//   // }, []);

//   return 'i am child';
// }

//

import { useState } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [num, updateNum] = useState(100);
  return (
    <ul onClick={() => updateNum(50)}>
      {new Array(num).fill(0).map((_, i) => {
        return <Child key={i}>{i}</Child>;
      })}
    </ul>
  );
}

function Child({ children }) {
  const now = performance.now();
  while (performance.now() - now < 4) {}
  return <li>{children}</li>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
