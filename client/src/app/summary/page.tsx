"use client";

import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Crowdfunding from "../../abi/Crowdfunding.json";
import { FormContext } from "../context/FormContext";

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

const SummaryPage = () => {
  const { campaignData, milestonesData } = useContext(FormContext);
  const milestonesCount = parseInt(campaignData.milestones, 10);
  const [isLoading, setLoading] = useState(false);
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

        if (!address) {
          alert("Please sign in to your MetaMask first.");
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
  const [localMilestones, setLocalMilestones] = useState(() =>
    milestonesData.length > 0
      ? milestonesData
      : Array.from({ length: milestonesCount }, () => ({
          title: "",
          description: "",
          amount: "",
          startDate: "",
          endDate: "",
          documentURL: "",
        }))
  );

  const handleStartDateChange = (index: number, value: string) => {
    const updatedMilestones = [...localMilestones];
    updatedMilestones[index].startDate = value;
    setLocalMilestones(updatedMilestones);
    validateMilestoneDates(index, updatedMilestones);
  };

  const handleEndDateChange = (index: number, value: string) => {
    const updatedMilestones = [...localMilestones];
    updatedMilestones[index].endDate = value;
    setLocalMilestones(updatedMilestones);
    validateMilestoneDates(index, updatedMilestones);
  };

  const validateMilestoneDates = (
    index: number,
    milestones: {
      endDate: string | number | Date;
      startDate: string | number | Date;
    }[]
  ) => {
    const milestone = milestones[index];
    const startDate = new Date(milestone.startDate);
    const endDate = new Date(milestone.endDate);
    const today = new Date();

    if (startDate < today) {
      alert("Start date must be today or later.");
      return false;
    }
    if (endDate < startDate) {
      alert("End date must be after the start date.");
      return false;
    }
    if (index > 0) {
      const previousEndDate = new Date(milestones[index - 1].endDate);
      if (startDate < previousEndDate) {
        alert(
          "Start date must be after the end date of the previous milestone."
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    const confirmed = window.confirm(
      "Please check the campaign details carefully before submitting your campaign."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

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
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const contractAddress =
        process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;

      if (!contractAddress) {
        console.error("Crowdfunding contract address is not defined.");
        setLoading(false);
        return;
      }

      const contract = new ethers.Contract(
        contractAddress,
        Crowdfunding.abi,
        signer
      );

      const milestones = localMilestones.map((milestone, index) => ({
        id: index,
        campaignId: 0,
        milestonetitle: milestone.title,
        milestonedescription: milestone.description,
        targetAmt: ethers.utils.parseEther(milestone.amount),
        startDate: new Date(milestone.startDate).getTime(),
        endDate: new Date(milestone.endDate).getTime(),
        donationAmountCollected: 0,
        isFraud: false,
        status: "incomplete",
        documentURL: "",
      }));
      const createCampaignTx = await contract.createCampaign(
        campaignData.title,
        campaignData.desc,
        campaignData.milestones, // Ensure this is parsed to wei
        campaignData.images,
        milestones
      );

      const receipt = await createCampaignTx.wait();

      console.log(`Campaign created successfully with ID: ${receipt}`);
      alert("Campaign created successfully!");

      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error creating campaign:", error.message);
      } else {
        console.error("Unknown error occurred:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <h1 className="text-2xl text-center text-white font-bold mb-6">
        Campaign Summary
      </h1>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-4 text-black">
          <h2 className="text-xl font-semibold">Campaign Details</h2>
          <p>
            <strong>Title:</strong> {campaignData.title}
          </p>
          <p>
            <strong>Description:</strong> {campaignData.desc}
          </p>
          <p>
            <strong>Image:</strong>{" "}
            <Image
              src={campaignData.images}
              alt="Campaign Image"
              width={200}
              height={200}
            />
          </p>
        </div>
        <div className="mb-4 text-black">
          <h2 className="text-xl font-semibold">Milestones</h2>
          {localMilestones.map((milestone, index) => (
            <div key={index} className="border p-4 mb-4 rounded">
              <h3 className="font-semibold">Milestone {index + 1}</h3>
              <p>
                <strong>Title:</strong> {milestone.title}
              </p>
              <p>
                <strong>Description:</strong> {milestone.description}
              </p>
              <p>
                <strong>Amount:</strong> {milestone.amount} ETH
              </p>
              <p>
                <strong>Start Date:</strong> {milestone.startDate}
              </p>
              <p>
                <strong>End Date:</strong> {milestone.endDate}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="bg-blue-500 w-full text-white py-2 px-4 rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? "Creating Campaign..." : "Submit Campaign"}
        </button>
      </div>
    </div>
  );
};

export default SummaryPage;
