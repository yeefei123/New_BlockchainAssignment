"use client";

import { faBackward, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Crowdfunding from "../../abi/Crowdfunding.json";
import { getMilestonesById } from "../utils/campaigns";

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

interface Milestone {
  startDate: string;
  endDate: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  target: string;
  amountCollected: string;
  endDate: string;
  owner: string;
  images: string;
  milestones: Milestone[];
}

const AllCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const contractAddress = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(
    new Set()
  );

  const checkMetaMaskConnection = async () => {
    try {
      const provider = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(provider);

      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsLoggedIn(true);
      } else {
        setWalletAddress("");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking MetaMask connection:", error);
      setIsLoggedIn(false);
    }
    setLoading(false);
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
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress!,
          Crowdfunding.abi,
          provider
        );

        const campaigns = await contract.getCampaigns();

        const campaignData = await Promise.all(
          campaigns.map(async (campaign) => {
            const milestones = await getMilestonesById(campaign.id);
            return {
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              target: campaign.target.toString(),
              amountCollected: campaign.amountCollected.toString(),
              endDate: campaign.endDate,
              owner: campaign.owner,
              images: campaign.images,
              milestones: Array.isArray(milestones)
                ? milestones
                : Object.values(milestones),
            };
          })
        );

        setCampaigns(campaignData);
        setLoading(false); // Set loading to false after data fetch
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
        } else {
          console.error("Unknown error:", error);
        }
        setLoading(false); // Ensure loading is set to false on error
      }
    };

    fetchCampaigns();
  }, []);

  const getCurrentMilestone = (milestones: Milestone[]): Milestone | null => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const milestone of milestones) {
      const startDate = ethers.BigNumber.isBigNumber(milestone.startDate)
        ? new Date(milestone.startDate.toNumber())
        : new Date(milestone.startDate);
      const endDate = ethers.BigNumber.isBigNumber(milestone.endDate)
        ? new Date(milestone.endDate.toNumber())
        : new Date(milestone.endDate);
      if (now >= startDate && now <= endDate) {
        return milestone;
      }
    }
    return null;
  };

  const calculateDaysLeft = (currentMilestone: any) => {
    const today = new Date();
    const end = ethers.BigNumber.isBigNumber(currentMilestone.endDate)
      ? new Date(currentMilestone.endDate.toNumber())
      : new Date(currentMilestone.endDate);
    const timeDiff = end.getTime() - today.getTime();

    if (timeDiff <= 0) {
      return "Expired";
    }

    const daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hoursLeft = Math.floor(
      (timeDiff % (1000 * 3600 * 24)) / (1000 * 3600)
    );
    const minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));

    return `${daysLeft} days, ${hoursLeft} hours, and ${minutesLeft} minutes left`;
  };

  const truncateDescription = (description: string) => {
    const maxLength = 100;
    if (description.length > maxLength) {
      return {
        text: description.substring(0, maxLength) + "...",
        isLong: true,
      };
    }
    return { text: description, isLong: false };
  };

  const formatEther = (value: string | ethers.BigNumber) => {
    try {
      const etherValue =
        typeof value === "string"
          ? ethers.utils.parseUnits(value, "wei")
          : value;
      return ethers.utils.formatEther(etherValue);
    } catch (error) {
      console.error("Error formatting ether:", error);
      return "N/A";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCampaigns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const ReadMoreButton = ({
    isLong,
    onClick,
    isExpanded,
  }: {
    isLong: boolean;
    onClick: () => void;
    isExpanded: boolean;
  }) => {
    if (!isLong) return null;
    return (
      <button className="text-blue-500 hover:underline mt-2" onClick={onClick}>
        {isExpanded ? "Read Less" : "Read More"}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center">
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
          <span className="text-gray-500 text-xl font-bold ml-2">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  const handleCreateCampaign = async () => {
    if (!isLoggedIn) {
      alert("Please connect your MetaMask wallet to create a campaign.");
      return;
    }

    try {
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask.");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length === 0) {
        alert(
          "Failed to connect to MetaMask. If there is a request in your MetaMask, please approve it to continue."
        );
        return;
      }
      setLoading(true);
      router.push("checkUsers");
      setLoading(false);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      alert(
        "Failed to connect to MetaMask. If there is a request in your MetaMask, please approve it to continue."
      );
    }
  };

  const handleCampaign = (id: string) => {
    setLoading(true);
    router.push(`/campaigns/${id}`);
    setLoading(false);
  };

  return (
    <div className="campaigns-container flex min-h-screen flex-col items-center">
      <div className="w-full h-12 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
        >
          <FontAwesomeIcon icon={faBackward} className="mr-2" />
          Back
        </button>
      </div>
      <div className="w-full h-12 mb-4">
        <button
          type="button"
          disabled={!isLoggedIn}
          onClick={handleCreateCampaign}
          className={`px-4 py-2 rounded ${
            isLoggedIn
              ? "bg-blue-500 text-white hover:bg-blue-700"
              : "bg-gray-500 text-gray-400 cursor-not-allowed"
          }`}
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Create Campaign
        </button>
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-5">Inactive Campaigns</h1>
        {campaigns.filter((campaign) => {
          const currentMilestone = getCurrentMilestone(campaign.milestones);
          const daysLeft = currentMilestone
            ? calculateDaysLeft(currentMilestone)
            : "N/A";
          return daysLeft === "Expired" || daysLeft === "N/A";
        }).length === 0 && !loading ? (
          <p>No expired campaigns found.</p>
        ) : (
          <div className="grid gap-8 grid-cols-1 text-center md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter((campaign) => {
                const currentMilestone = getCurrentMilestone(
                  campaign.milestones
                );
                const daysLeft = currentMilestone
                  ? calculateDaysLeft(currentMilestone)
                  : "N/A";
                return daysLeft === "Expired" || daysLeft === "N/A";
              })
              .map((campaign) => {
                const { text: truncatedDescription, isLong } =
                  truncateDescription(campaign.description);
                const isExpanded = expandedCampaigns.has(campaign.id);
                const currentMilestone = getCurrentMilestone(
                  campaign.milestones
                );
                const daysLeft = currentMilestone
                  ? calculateDaysLeft(currentMilestone)
                  : "N/A";

                return (
                  <div
                    className="border bg-opacity-75 bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
                    key={campaign.id}
                  >
                    <Image
                      src={campaign.images}
                      alt={campaign.title}
                      className="rounded-t-lg hover:scale-105 transition-transform duration-300 ease-in-out"
                      width={500}
                      height={300}
                      layout="responsive"
                    />
                    <div className="p-4">
                      <h2 className="text-xl text-black font-bold mb-2">
                        {campaign.title}
                      </h2>
                      <p
                        className={`text-gray-600 ${
                          isExpanded ? "block" : "hidden"
                        }`}
                      >
                        {campaign.description}
                      </p>
                      {!isExpanded && (
                        <>
                          <p className="text-gray-600">
                            {truncatedDescription}
                          </p>
                          <ReadMoreButton
                            isLong={isLong}
                            onClick={() => toggleExpand(campaign.id)}
                            isExpanded={isExpanded}
                          />
                        </>
                      )}
                      {isExpanded && (
                        <ReadMoreButton
                          isLong={isLong}
                          onClick={() => toggleExpand(campaign.id)}
                          isExpanded={isExpanded}
                        />
                      )}
                      <div className="mt-4 text-left">
                        <p className="mb-2 text-black">
                          <strong>Target:</strong> {campaign.target} ETH
                        </p>
                        <p className="truncate text-black">
                          <strong>Owner:</strong> {campaign.owner}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCampaign(campaign.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mt-4 rounded-xl focus:outline-none focus:shadow-outline w-full"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCampaigns;
