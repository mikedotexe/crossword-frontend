import './App.css';
import { data } from './data';
import React, { useCallback, useRef, useState } from 'react';
import Crossword from 'react-crossword';

function App() {
  const crossword = useRef();

  const [messages, setMessages] = useState([]);

  const addMessage = useCallback((message) => {
    setMessages((m) => (`${message}\n`).concat(m));
  }, []);

  const onCrosswordComplete = useCallback(
    (isComplete) => {
      addMessage(`onCrosswordComplete: ${JSON.stringify(isComplete)} ${isComplete ? ' CHECK IT ' : ''}`);
    },
    [addMessage]
  );

  const onCellChange = useCallback(
    (row, col, char) => {
      const isComplete = crossword.current.isCrosswordComplete();
      addMessage(`onCellChange: "${row}", "${col}", "${char}" ${isComplete ? ' CHECK IT' : ''}`);
    },
    [addMessage]
  );

  return (
    <div id="page">
      <h1>@jaredreisinger/react-crossword example app</h1>

      <p>
        This is a demo app that makes use of the @jaredreisinger/react-crossword
        component. It exercises most of the functionality, so that you can see
        how to do so.
      </p>

      <div id="crossword-wrapper">
        <Crossword
          data={data}
          ref={crossword}
          onCrosswordComplete={onCrosswordComplete}
          onCellChange={onCellChange}
        />
      </div>

      <pre id="messages">{messages}</pre>
    </div>
  );
}

export default App;
