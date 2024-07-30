"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";

// Initialize Web3Modal
const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userExists, setUserExists] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAccountLoggedIn, setIsAccountLoggedIn] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
        const response = await fetch(
          `/api/checkUsers?walletAddress=${walletAddress}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setUserExists(true);
            setUserData(data.user);
          } else {
            setUserExists(false);
            setUserData(null);
          }
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserExists();
  }, [walletAddress, isAccountLoggedIn]);

  const handleCreateCampaign = () => {
    router.push("/create-campaign");
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
      <h1 className="text-4xl font-bold mb-6">Company Registration History</h1>
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
          <div className="w-full flex justify-end pr-5">
            {userExists && userData && userData.status !== "Accepted" && (
              <button
                aria-label="create campaign"
                title="Create Campaign"
                onClick={handleCreateCampaign}
                className="mt-2 bg-blue-500 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:shadow-outline"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create Campaign
              </button>
            )}
          </div>
          <div className="bg-white p-4 text-black rounded shadow mb-4 max-w-3xl w-full">
            {userExists && userData ? (
              <>
                <h2 className="text-lg font-semibold mb-2">User Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <p className="text-sm">Name:</p>
                  <p className="text-sm">{userData.name}</p>
                  <p className="text-sm">Email:</p>
                  <p className="text-sm">{userData.email}</p>
                  <p className="text-sm">Phone Number:</p>
                  <p className="text-sm">{userData.phone_number}</p>
                  <p className="text-sm">Profile Image:</p>
                  <div className="flex items-center">
                    <Image
                      src={userData.profile_image_url}
                      alt="profile image"
                      width={100}
                      height={100}
                    />
                  </div>
                  <p className="text-sm">IC Image:</p>
                  <div className="flex items-center">
                    <Image
                      src={userData.ic_image_url}
                      alt="ic image"
                      width={100}
                      height={100}
                    />
                  </div>
                  <p className="text-sm">Status:</p>
                  <p className="text-sm text-red-500">{userData.status}</p>
                </div>
              </>
            ) : (
              <p className="text-red-500">
                No user found with the provided wallet address.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default App;
