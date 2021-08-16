import './App.css';
import React, { useCallback, useRef, useState } from 'react';
import Crossword from 'react-crossword';
import { parseSolutionSeedPhrase } from './utils';
import { parseSeedPhrase } from 'near-seed-phrase';
import * as nearAPI from "near-api-js";
import { createGridData, loadGuesses } from "react-crossword/dist/es/util";

const App = ({ nearConfig, data }) => {
  const crossword = useRef();

  // This function is called when all entries are filled
  async function checkSolution(gridData) {
    let seedPhrase = parseSolutionSeedPhrase(data, gridData);
    const { secretKey, publicKey } = parseSeedPhrase(seedPhrase);
    console.log('aloha publicKey', publicKey);
    // Compare crossword solution's public key with the known public key for this puzzle
    // (It was given to us when we first fetched the puzzle in index.js)
    const crosswordSolutionPublicKey = localStorage.getItem('crosswordSolutionPublicKey');
    console.log('aloha publicKey from chain', crosswordSolutionPublicKey);
    if (publicKey === crosswordSolutionPublicKey) {
      console.log('you win');
    } else {
      console.log("that's not correct");
    }
  }

  const onCrosswordComplete = useCallback(
    async (isComplete) => {
      if (isComplete === true) {
        let gridData = createGridData(data).gridData;
        loadGuesses(gridData, 'guesses');
        await checkSolution(gridData);
      }
    },
    []
  );

  const onCellChange = useCallback(
    async (row, col, char) => {
      const isComplete = crossword.current.isCrosswordComplete();
      let gridData = createGridData(data).gridData;
      loadGuesses(gridData, 'guesses');
      gridData[row][col].guess = char;
      if (isComplete === true && char !== '') {
        await checkSolution(gridData);
      }
    },
    []
  );

  return (
    <div id="page">
      <h1>Thank you @jaredreisinger/react-crossword example app!</h1>

      <p>
        This is a demo app that makes use of the @jaredreisinger/react-crossword component with a little modifications.
      </p>
      <p>This does not communicate with the blockchain at this point, the data lives in either <code>src/data.js</code> or <code>src/data-realish.js</code></p>
      <p>What needs to happen:</p>
      <ol>
        <li>When page loads, makes call to a smart contract (similar to Guest Book)</li>
        <li>Also when page loads, use <code>near-api-js</code> and <code>near-seed-phrase</code> to generate a random seed phrase and key pair. This will be used if the user is the first person to solve the crossword.</li>
        <li>For now assume there's only one crossword puzzle, call <code>some_method</code> (yet implemented) on smart contract that gets the clues and the "solution public key"</li>
        <li>This frontend will display "… CHECK IT" (see below) whenever the user has typed a final character into the puzzle and the seed phrase should be parsed and checked against the "solution public key"</li>
        <li>If the person sends a transaction to the method <code>submit_solution</code> and the return value indicates that they're the winner, change the screen to say "yay you have won, please enter in the account you wish to claim the reward and your memo message."</li>
      </ol>

      <div id="crossword-wrapper">
        <Crossword
          data={data}
          ref={crossword}
          onCrosswordComplete={onCrosswordComplete}
          onCellChange={onCellChange}
        />
      </div>
    </div>
  );
}

export default App;
