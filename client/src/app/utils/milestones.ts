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

export const getMilestoneById = async (id: string) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider
  );

  try {
    const milestones = await contract.getMilestones(id);

    const mappedMilestones = milestones.map(
      (milestone: any, index: number) => ({
        ...milestone,
        id: index,
      })
    );
    // return milestones.map((milestone: any, index: number) => ({
    //   ...milestone,
    //   id: index,
    // }));
    return mappedMilestones;
  } catch (error) {
    console.error("Error fetching milestone:", error);
    return [];
  }
};

export const getTransactions = async (id: string) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider
  );

  try {
    const transactions = await contract.getTransactions(id);

    return transactions;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return [];
  }
};

export const donateTransactions = async (
  id: string,
  amount: string,
  timeStamp: string
) => {
  const provider = getProvider();
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS!,
    CrowdfundingABI.abi,
    provider.getSigner()
  );

  try {
    const donateToCampaignTx = await contract.donateToCampaign(
      id,
      amount,
      timeStamp
    );
    await donateToCampaignTx.wait();
    alert("Donate successfully!");
  } catch (error) {
    console.error("Error donate campaign:", error);
    alert("Failed to donate campaign. Please try again.");
  } finally {
    //setLoading(false);
  }
};
