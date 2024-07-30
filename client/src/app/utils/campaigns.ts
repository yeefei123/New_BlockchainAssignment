import CrowdfundingABI from "@/abi/Crowdfunding.json";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;

const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum);
  } else {
    throw new Error("Ethereum object not found. Install MetaMask.");
  }
};

export const getCampaigns = async () => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider
  );

  try {
    const campaigns = await contract.getCampaigns();
    return campaigns.map((campaign: any, index: number) => ({
      ...campaign,
      id: index,
    }));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
};

export const getCampaignById = async (id: string) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider
  );

  try {
    const campaign = await contract.campaigns(id);
    return { ...campaign, id };
  } catch (error) {
    console.error("Error fetching campaign by ID:", error);
    return null;
  }
};

export const getMilestonesById = async (id: string) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider
  );
  try {
    const campaign = await contract.getMilestones(id);
    return { ...campaign };
  } catch (error) {
    console.error("Error fetching campaign by ID:", error);
    return null;
  }
};
