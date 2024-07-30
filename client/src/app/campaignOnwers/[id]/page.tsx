"use client";

import { getCampaignById } from "@/app/utils/campaigns";
import { faBackspace } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Crowdfunding from "../../../abi/Crowdfunding.json";

const Web3Button = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [campaignOwner, setCampaignOwner] = useState<string | null>(null);
  const [userReports, setUserReports] = useState<any[]>([]);
  const { id } = useParams();
  const web3Modal = new Web3Modal();
  const router = useRouter();

  const checkMetaMaskConnection = async () => {
    try {
      const provider = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(provider);

      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsLoggedIn(true);
      } else {
        setWalletAddress(null);
        setIsLoggedIn(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking MetaMask connection:", error);
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMetaMaskConnection();

    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", async () => {
        await checkMetaMaskConnection();
      });

      window.ethereum.on("chainChanged", async () => {
        await checkMetaMaskConnection();
      });
    }

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeAllListeners("accountsChanged");
        window.ethereum.removeAllListeners("chainChanged");
      }
    };
  }, []);

  useEffect(() => {
    const fetchCampaignOwner = async () => {
      try {
        if (!window.ethereum) {
          throw new Error("Ethereum provider is not available");
        }

        const contractAddress =
          process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress!,
          Crowdfunding.abi,
          provider
        );
        const fetchedCampaign = await getCampaignById(id as string);
        const owner = fetchedCampaign.owner;
        setCampaignOwner(owner);
        if (owner) {
          const userReportsData = await fetchUserReports(owner);
          setUserReports(userReportsData);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching campaign owner:", error);
        setLoading(false);
      }
    };

    fetchCampaignOwner();
  }, [id]);

  const fetchUserReports = async (ownerAddress: string): Promise<any[]> => {
    try {
      const response = await fetch(`/api/data?wallet_address=${ownerAddress}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error("Failed to fetch user reports");
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="flex items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
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
          <span className="text-gray-300 text-2xl font-bold ml-2">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  // if (!isLoggedIn) {
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
  //       <h1 className="text-2xl font-bold mb-4">
  //         Please Connect Your MetaMask
  //       </h1>
  //       <p className="text-lg">
  //         To view campaign details and reports, you need to connect your
  //         MetaMask wallet.
  //       </p>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto p-4 mt-5 bg-white rounded-xl text-black">
      <div className="w-full h-12 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
        >
          <FontAwesomeIcon icon={faBackspace} className="mr-2" />
          Back
        </button>
      </div>
      <h1 className="text-3xl  font-bold mb-4">Campaign Owner</h1>
      {campaignOwner && !loading ? (
        <div>
          <p className="text-lg">
            <strong>Owner Address:</strong> {campaignOwner}
          </p>
          <h3 className="text-2xl font-bold mt-6 mb-4">User Reports</h3>
          {userReports.length === 0 ? (
            <p className="text-center text-gray-500">
              No user reports found for this campaign owner.
            </p>
          ) : (
            <div className="grid gap-6 grid-cols-1">
              {userReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-gray-700 text-white border border-gray-600 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
                >
                  <div className="flex items-center mb-4">
                    {report.profile_image_url ? (
                      <img
                        src={report.profile_image_url}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-500 flex items-center justify-center mr-4">
                        <span className="text-gray-200">No Image</span>
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-bold">{report.name}</p>
                      <p className="text-sm text-gray-300">{report.email}</p>
                      <p className="text-sm text-gray-300">
                        {report.phone_number || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
                    <p>
                      <strong>User Name:</strong> {report.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {report.email}
                    </p>
                    <p>
                      <strong>Phone Number:</strong>{" "}
                      {report.phone_number || "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>No campaign owner found.</p>
      )}
    </div>
  );
};

export default Web3Button;
