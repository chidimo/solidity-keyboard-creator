import { useState, useEffect } from "react";
import Router from "next/router";
import { UserCircleIcon } from "@heroicons/react/solid";
import Keyboard from "../components/keyboard";

import PrimaryButton from "../components/primary-button";
import { ethers } from "ethers";
import addressesEqual from "../utils/addressEqual";
import TipButton from "../components/tip-button";
import { contractAddress, contractABI } from "../utils/contractInfo";

export default function Home() {
  const [ethereum, setEthereum] = useState(undefined);
  const [connectedAccount, setConnectedAccount] = useState(undefined);
  const [keyboards, setKeyboards] = useState([]);

  const [keyboardKind, setKeyboardKind] = useState(0);
  const [isPBT, setIsPBT] = useState(false);
  const [filter, setFilter] = useState("");

  const [mining, setMining] = useState(false);
  const [keyboardsLoading, setKeyboardsLoading] = useState(false);

  const handleAccounts = (accounts) => {
    if (accounts.length > 0) {
      const account = accounts[0];
      console.log("We have an authorized account: ", account);
      setConnectedAccount(account);
    } else {
      console.log("No authorized accounts yet");
    }
  };

  const getConnectedAccount = async () => {
    if (window.ethereum) {
      setEthereum(window.ethereum);
    }

    if (ethereum) {
      const accounts = await ethereum.request({ method: "eth_accounts" });
      handleAccounts(accounts);
    }
  };
  useEffect(() => getConnectedAccount(), []);

  const connectAccount = async () => {
    if (!ethereum) {
      alert("MetaMask is required to connect an account");
      return;
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    handleAccounts(accounts);
  };

  const getKeyboards = async () => {
    if (ethereum && connectedAccount) {
      setKeyboardsLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const keyboardsContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const keyboards = await keyboardsContract.getKeyboards();
        console.log("Retrieved keyboards...", keyboards);

        setKeyboards(keyboards);
      } finally {
        setKeyboardsLoading(false);
      }
    }
  };

  useEffect(() => getKeyboards(), [connectedAccount]);

  const submitCreate = async (e) => {
    e.preventDefault();

    if (!ethereum) {
      console.error("Ethereum object is required to create a keyboard");
      return;
    }

    setMining(true);
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const keyboardsContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const createTxn = await keyboardsContract.create(
        keyboardKind,
        isPBT,
        filter
      );
      console.log("Create transaction started...", createTxn.hash);

      await createTxn.wait();
      console.log("Created keyboard!", createTxn.hash);

      Router.push("/");
    } finally {
      setMining(false);
    }
  };

  if (!ethereum) {
    return <p>Please install MetaMask to connect to this site</p>;
  }

  if (!connectedAccount) {
    return (
      <PrimaryButton onClick={connectAccount}>
        Connect MetaMask Wallet
      </PrimaryButton>
    );
  }

  if (keyboardsLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PrimaryButton type="link" href="/create">
          Create a Keyboard!
        </PrimaryButton>
        <p>Loading Keyboards...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-8">
      <form className="mt-8 flex flex-col gap-y-6">
        <div>
          <label
            htmlFor="keyboard-type"
            className="block text-sm font-medium text-gray-700"
          >
            Keyboard Type
          </label>
          <select
            id="keyboard-type"
            name="keyboard-type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={keyboardKind}
            onChange={(e) => {
              setKeyboardKind(e.target.value);
            }}
          >
            <option value="0">60%</option>
            <option value="1">75%</option>
            <option value="2">80%</option>
            <option value="3">ISO-105</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="keycap-type"
            className="block text-sm font-medium text-gray-700"
          >
            Keycap Type
          </label>
          <select
            id="keycap-type"
            name="keycap-type"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={isPBT ? "pbt" : "abs"}
            onChange={(e) => {
              setIsPBT(e.target.value === "pbt");
            }}
          >
            <option value="abs">ABS</option>
            <option value="pbt">PBT</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter
          </label>
          <select
            id="filter"
            name="filter"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            onChange={(e) => {
              setFilter(e.target.value);
            }}
            value={filter}
          >
            <option value="">None</option>
            <option value="sepia">Sepia</option>
            <option value="grayscale">Grayscale</option>
            <option value="invert">Invert</option>
            <option value="hue-rotate-90">Hue Rotate (90°)</option>
            <option value="hue-rotate-180">Hue Rotate (180°)</option>
          </select>
        </div>

        <PrimaryButton type="submit" disabled={mining} onClick={submitCreate}>
          {mining ? "Creating..." : "Create Keyboard"}
        </PrimaryButton>
      </form>

      <div>
        <h2 className="block text-lg font-medium text-gray-700">Preview</h2>
        <Keyboard kind={keyboardKind} isPBT={isPBT} filter={filter} />
      </div>

      {keyboards.map(([kind, isPBT, filter, owner], i) => (
        <div key={i} className="relative">
          <Keyboard kind={kind} isPBT={isPBT} filter={filter} />
          <span className="absolute top-1 right-6">
            {addressesEqual(owner, connectedAccount) ? (
              <UserCircleIcon className="h-5 w-5 text-indigo-100" />
            ) : (
              <TipButton ethereum={ethereum} index={i} />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
