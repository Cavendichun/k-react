import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

function App() {
  const [isDel, del] = useState(false);
  const divRef = useRef(null);

  console.warn('render divREF', divRef.current);

  useEffect(() => {
    console.warn('useEffect dvRef', divRef.current);
  }, []);

  return (
    <div ref={divRef} onClick={() => del(true)}>
      {isDel ? null : <Child />}
    </div>
  );
}

function Child() {
  return <p ref={dom => console.warn('dom is:', dom)}>Child</p>;
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
  <App />
);
