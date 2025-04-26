import { createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';

const ctxA = createContext('default A');
const ctxB = createContext('default B');

function App() {
  return (
    <ctxA.Provider value={'A0'}>
      <ctxB.Provider value={'B0'}>
        <ctxA.Provider value={'A1'}>
          <Cpn />
        </ctxA.Provider>
      </ctxB.Provider>
      <Cpn />
    </ctxA.Provider>
  );
}

function Cpn() {
  const a = useContext(ctxA);
  const b = useContext(ctxB);

  return (
    <div>
      a: {a} b: {b}
    </div>
  );
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
  <App />
);
