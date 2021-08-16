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
        <h1>NEAR Crossword Puzzle intro</h1>

        <div id="crossword-wrapper">
          <Crossword
            data={data}
            ref={crossword}
            onCrosswordComplete={onCrosswordComplete}
          />
        </div>
        <footer><p>Thank you <a href="https://github.com/JaredReisinger/react-crossword" target="_blank" rel="noreferrer">@jaredreisinger/react-crossword</a>!</p></footer>
      </div>
    );
  }
}

export default App;
