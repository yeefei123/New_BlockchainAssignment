"use client";

import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Crowdfunding from "../../abi/Crowdfunding.json";

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

const CampaignHistoryPage = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userExists, setUserExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAccountLoggedIn, setIsAccountLoggedIn] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const contractAddress = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;
  const router = useRouter();

  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress("");
        setIsLoggedIn(false);
        setIsAccountLoggedIn(false);
      } else {
        setWalletAddress(accounts[0]);
        setIsLoggedIn(true);
      }
    };

    const fetchWalletAddress = async () => {
      setLoading(true);
      if (typeof window.ethereum === "undefined") {
        console.error("MetaMask is not installed. Please install MetaMask.");
        setLoading(false);
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsLoggedIn(true);
        } else {
          setWalletAddress("");
          setIsLoggedIn(false);
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } catch (error) {
        console.error("Error fetching wallet address:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddress();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  useEffect(() => {
    const checkUserExists = async () => {
      if (!walletAddress || !isAccountLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress!,
          Crowdfunding.abi,
          provider
        );

        const campaigns = await contract.getCampaigns();
        const userCampaigns = campaigns.filter(
          (campaign: any) => campaign.owner === walletAddress
        );

        if (userCampaigns.length > 0) {
          setUserExists(true);
          setCampaigns(
            userCampaigns.map((campaign: any) => ({
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              target: campaign.target.toString(),
              amountCollected: campaign.amountCollected.toString(),
              endDate: campaign.endDate,
              owner: campaign.owner,
              images: campaign.images,
            }))
          );
        } else {
          setUserExists(false);
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserExists();
  }, [walletAddress, isAccountLoggedIn]);

  const calculateDaysLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      if (!walletAddress) {
        return;
      }

      const response = await fetch(
        `/api/checkUsers?walletAddress=${walletAddress}`
      );

      if (!response.ok) {
        setLoading(false);
        throw new Error("Failed to fetch user data.");
      }

      const data = await response.json();

      if (data.exists) {
        const passwordResponse = await fetch("/api/checkUsers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ walletAddress, password }),
        });

        if (passwordResponse.ok) {
          setIsAccountLoggedIn(true);
          setPasswordError(null);
        } else {
          setPasswordError("Incorrect password. Please try again.");
        }
      } else {
        setPasswordError("No user found with the provided wallet address.");
      }
      setLoading(false);
    } catch (error) {
      console.error("Error during login:", error);
      setPasswordError("Wrong password or account does not exist.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col mt-5 justify-center items-center min-h-screen pt-5">
      <h1 className="text-4xl font-bold mb-6">Campaign History</h1>
      {loading ? (
        <div className="mt-2 flex mb-5 justify-center items-center">
          <svg
            className="animate-spin h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span className="ml-2 text-gray-500 font-bold">Loading...</span>
        </div>
      ) : !walletAddress ? (
        <p className="text-red-500">Please connect your MetaMask wallet.</p>
      ) : !isLoggedIn ? (
        <p className="text-red-500">Please log in to continue.</p>
      ) : !isAccountLoggedIn ? (
        <div className="bg-white p-4 text-black rounded shadow mb-4 max-w-3xl w-full">
          <h2 className="text-lg font-semibold mb-2">Login</h2>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 mb-2 w-full"
          />
          {passwordError && (
            <p className="text-red-500 mb-2">{passwordError}</p>
          )}
          <button
            onClick={handleLogin}
            className={`py-2 px-4 rounded ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }`}
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      ) : (
        <>
          {userExists ? (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <div
                  className="border bg-opacity-75 bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
                  key={campaign.id}
                >
                  <img
                    src={campaign.images}
                    alt={campaign.title}
                    className="rounded-t-lg hover:scale-105 transition-transform duration-300 ease-in-out"
                  />
                  <div className="p-4">
                    <h2 className="text-xl font-bold mb-2">{campaign.title}</h2>
                    <p className="text-gray-600">{campaign.description}</p>
                    <div className="mt-4 text-left">
                      <p className="mb-2">
                        <strong>Target:</strong> {campaign.target} ETH
                      </p>
                      <p className="mb-2">
                        <strong>Amount Collected:</strong>{" "}
                        {campaign.amountCollected} ETH
                      </p>
                      <p className="mb-2">
                        <strong>Days Left:</strong>{" "}
                        {calculateDaysLeft(campaign.endDate)}
                      </p>
                      <p className="truncate">
                        <strong>Owner:</strong> {campaign.owner}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-500">No campaigns found for this user.</p>
          )}
        </>
      )}
    </div>
  );
};

export default CampaignHistoryPage;
