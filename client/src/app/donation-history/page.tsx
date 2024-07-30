"use client";

import { ethers } from "ethers";
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
  donators: string[];
  amountCollected: string;
  endDate: string;
  owner: string;
  images: string;
  milestones: Milestone[];
}

interface Report {
  campaign_id: string;
}

const DonationHistoryPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [campaignButtonLoading, setCampaignButtonLoading] = useState(false);

  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const contractAddress =
    process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS!;
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
    const fetchResolvedReports = async () => {
      try {
        const response = await fetch("/api/userReports?status=resolved");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data: Report[] = await response.json();
      } catch (error) {
        console.error("Error fetching resolved reports:", error);
      }
    };

    fetchResolvedReports();
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddress,
          Crowdfunding.abi,
          provider
        );
        const campaigns = await contract.getCampaigns();
        console.log("Campaigns from contract:", campaigns);

        const campaignData = await Promise.all(
          campaigns.map(async (campaign: any) => {
            const milestones = await getMilestonesById(campaign.id);
            return {
              id: campaign.id,
              title: campaign.title,
              description: campaign.description,
              target: campaign.target.toString(),
              donators: Array.isArray(campaign.donators)
                ? campaign.donators
                : Object.values(campaign.donators),
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
        console.log("Campaign data after processing:", campaignData);

        const filteredCampaigns = campaignData.filter(
          (campaign) => campaign.owner === walletAddress // Corrected to filter by campaign owner
        );
        console.log("Filtered campaigns:", filteredCampaigns);
        setCampaigns(filteredCampaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [contractAddress, walletAddress]); // Added walletAddress to dependency array to refetch campaigns when wallet changes

  const getCurrentMilestone = (milestones: Milestone[]): Milestone | null => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const milestone of milestones) {
      const startDate = new Date(milestone.startDate);
      const endDate = new Date(milestone.endDate);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      if (now >= startDate && now <= endDate) {
        return milestone;
      }
    }
    return null;
  };

  const calculateDaysLeft = (currentMilestone: Milestone) => {
    const today = new Date();
    const end = new Date(currentMilestone.endDate);
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
        alert("Please connect your MetaMask wallet to create a campaign.");
        return;
      }

      setCampaignButtonLoading(true);
      router.push("/createCampaign");
    } catch (error) {
      console.error("Error handling create campaign:", error);
    } finally {
      setCampaignButtonLoading(false);
    }
  };

  const handleDonationHistory = (campaignId: string) => {
    router.push(`/donationHistory/${campaignId}`);
  };

  const handleMarkMilestoneComplete = async (campaignId: string) => {
    if (!isLoggedIn) {
      alert(
        "Please connect your MetaMask wallet to mark a milestone complete."
      );
      return;
    }

    setButtonLoading((prev) => ({
      ...prev,
      [campaignId]: true,
    }));

    try {
      if (typeof window.ethereum === "undefined") {
        alert("MetaMask is not installed. Please install MetaMask.");
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        Crowdfunding.abi,
        signer
      );
      await contract.markMilestoneComplete(campaignId);
      alert("Milestone marked as complete!");
    } catch (error) {
      console.error("Error marking milestone complete:", error);
    } finally {
      setButtonLoading((prev) => ({
        ...prev,
        [campaignId]: false,
      }));
    }
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

  return (
    <div>
      {isLoggedIn ? (
        <>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Donation History</h1>
            <div className="space-y-8">
              {campaigns.length === 0 ? (
                <div className="flex justify-center items-center min-h-screen">
                  <p>No campaigns found.</p>
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const currentMilestone = getCurrentMilestone(
                    campaign.milestones
                  );
                  const isExpanded = expandedCampaigns.has(campaign.id);
                  const truncatedDescription = truncateDescription(
                    campaign.description
                  );

                  return (
                    <div
                      key={campaign.id}
                      className="border border-gray-300 bg-white p-6 rounded-lg shadow-lg"
                    >
                      <div className="flex justify-between items-center">
                        <h2 className="text-2xl text-black font-bold mb-4">
                          {campaign.title}
                        </h2>
                      </div>
                      <p className="text-gray-600 mb-4">
                        {isExpanded
                          ? campaign.description
                          : truncatedDescription.text}
                      </p>
                      <ReadMoreButton
                        isLong={truncatedDescription.isLong}
                        onClick={() => toggleExpand(campaign.id)}
                        isExpanded={isExpanded}
                      />
                      {currentMilestone && (
                        <div className="bg-yellow-100 p-4 rounded mt-4">
                          <h3 className="text-xl font-semibold mb-2">
                            Current Milestone
                          </h3>
                          <p className="text-gray-700">
                            {calculateDaysLeft(currentMilestone)}
                          </p>
                        </div>
                      )}
                      <div className="flex flex-wrap mt-4">
                        <div className="w-full lg:w-1/2 p-2">
                          <div className="bg-black p-4 rounded">
                            <h3 className="text-xl text-white font-semibold mb-2">
                              Target
                            </h3>
                            <p className="text-white-700">
                              {campaign.target} ETH
                            </p>
                          </div>
                        </div>
                        <div className="w-full lg:w-1/2 p-2">
                          <div className="bg-black p-4 rounded">
                            <h3 className="text-xl text-white font-semibold mb-2">
                              Amount Collected
                            </h3>
                            <p className="text-white-700">
                              {formatEther(campaign.amountCollected)} ETH
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="w-full h-screen flex flex-col items-center justify-center">
            <h1 className="text-4xl font-bold mb-6">Donation History</h1>
            <br />
            <h2 className="text-xl text-red-500">
              Please connect to MetaMask to proceed.
            </h2>
          </div>
        </>
      )}
    </div>
  );
};

export default DonationHistoryPage;
