"use client";

import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

const CheckUserPage = () => {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchWalletAddress = async () => {
      try {
        const web3 = await web3Modal.connect();
        if (!window.ethereum) {
          alert("Please install MetaMask");
          setLoading(false);
          return;
        }

        if (!window.ethereum.isConnected()) {
          alert("Please connect your wallet.");
          setLoading(false);
          return;
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        if (!address) {
          alert("Please sign in to your MetaMask first.");
          router.push("/");
          return;
        }
      } catch (error) {
        alert("Error fetching wallet address: " + error);
        router.push("/");
        return;
      }
    };

    fetchWalletAddress();
  }, [router]);

  useEffect(() => {
    const checkUserExists = async () => {
      try {
        const response = await fetch(
          `/api/checkUsers?walletAddress=${walletAddress}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.exists) {
            setLoading(true);
            router.push("/create-campaign");
            setLoading(false);
          } else {
            setLoading(true);
            router.push("/company-registration");
            setLoading(false);
          }
        } else {
          setLoading(true);
          router.push("/company-registration");
          setLoading(false);
        }
      } catch (error) {
        alert("Please ensure that you have connected to MetaMask");
      }
    };

    if (walletAddress.trim() !== "") {
      checkUserExists();
    }
  }, [walletAddress, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center">
          <div className="left relative mr-2">
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
          </div>
          <span className="text-gray-500 text-xl font-bold">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="campaigns-container flex-col">
      <div className="w-100 h-50"></div>
    </div>
  );
};

export default CheckUserPage;
