import './App.css';
import React, { useCallback, useRef } from 'react';
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
    // Compare crossword solution's public key with the known public key for this puzzle
    // (It was given to us when we first fetched the puzzle in index.js)
    const crosswordSolutionPublicKey = localStorage.getItem('crosswordSolutionPublicKey');
    if (publicKey === crosswordSolutionPublicKey) {
      console.log("You're correct!");
      // Send transaction TO the crossword puzzle smart contract FROM the crossword puzzle account.
      // Learn more about access keys here: https://docs.near.org/docs/concepts/account#access-keys
      const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
      const keyPair = nearAPI.utils.key_pair.KeyPair.fromString(secretKey);
      await keyStore.setKey(nearConfig.networkId, nearConfig.contractName, keyPair);
      nearConfig.keyStore = keyStore;
      const near = await nearAPI.connect(nearConfig);
      const crosswordAccount = await near.account(nearConfig.contractName);

      let playerKeyPair = localStorage.getItem('playerKeyPair');
      let playerPublicKey = JSON.parse(playerKeyPair).publicKey;
      console.log('Unique public key for you as the player: ', playerPublicKey);

      let transaction;
      try {
        transaction = await crosswordAccount.functionCall(
          {
            contractId: nearConfig.contractName,
            methodName: 'submit_solution',
            args: {
              solver_pk: playerPublicKey,
            },
            gas: '300000000000000', // You may omit this for default gas
            attachedDeposit: 0  // You may also omit this for no deposit
          }
        );
      } catch (e) {
        if (e.message.contains('Can not sign transactions for account')) {
          // Someone has submitted the solution before the player!
          console.log("Oof, that's rough, someone already solved this.")
        }
      } finally {
        console.log('Transaction status:', transaction.status);
        console.log('Transaction hash:', transaction.transaction.hash);
      }
    } else {
      console.log("That's not the correct solution. :/");
    }
  }

  const onCrosswordComplete = useCallback(
    async (completeCount) => {
        if (completeCount !== false) {
          console.log('aloha completeCount', completeCount);
          let gridData = createGridData(data).gridData;
          loadGuesses(gridData, 'guesses');
          await checkSolution(gridData);
        }
    },
    []
  );

  if (!data) {
    return (
      <div id="page">
        <h1>No puzzles right now</h1>
        <p>Sorry friend, no crossword puzzles available right now.</p>
      </div>
    );
  } else {
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
          />
        </div>
      </div>
    );
  }
}

export default App;
