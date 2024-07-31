"use client";

import FileUploadDialog from "@/app/components/FileUploadDialog";
import ReportDialog from "@/app/components/ReportDialog";
import { getCampaignById, getMilestonesById } from "@/app/utils/campaigns";
import {
  faBackward,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import Crowdfunding from "../../../abi/Crowdfunding.json";

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {},
});

const CampaignDetails: React.FC = () => {
  const { id } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [targetAchived, setTargetAchived] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [campaign, setCampaign] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState<string | number>("");
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(
    null
  );
  const [uploadedMilestones, setUploadedMilestones] = useState<Set<number>>(
    new Set()
  );
  const [ownerbuttonLoading, setownerbuttonLoading] = useState(false);

  const checkMetaMaskConnection = async () => {
    if (typeof window.ethereum === "undefined") {
      console.error("MetaMask is not installed. Please install MetaMask.");
      setLoading(false);
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();

    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      setIsLoggedIn(true);
    } else {
      setWalletAddress("");
      setIsLoggedIn(false);
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

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const fetchedCampaign = await getCampaignById(id as string);
      fetchedCampaign.donators = fetchedCampaign.donators || [];
      fetchedCampaign.donations = fetchedCampaign.donations || [];

      const fetchedMilestones = await getMilestonesById(id as string);
      const milestonesArray = Array.isArray(fetchedMilestones)
        ? fetchedMilestones
        : Object.values(fetchedMilestones);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      // setWalletAddress(address);
      setCampaign(fetchedCampaign);
      setMilestones(milestonesArray);

      if (fetchedCampaign.length === 0) {
        setLoading(true);
        router.push("/");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  };
  const calculateDaysLeft = (endDate: Date) => {
    const today = new Date();
    const timeDiff = endDate.getTime() - today.getTime();

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

  const getCurrentMilestone = (milestones: any[]) => {
    const now = new Date();

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

  const currentMilestone = getCurrentMilestone(milestones);
  const router = useRouter();
  const handleOpenDialog = (milestoneId: number) => {
    setSelectedMilestoneId(milestoneId);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMilestoneId(null);
  };

  const handleDonate = async (milestoneId: number) => {
    try {
      if (
        donationAmount &&
        !isNaN(Number(donationAmount)) &&
        Number(donationAmount) > 0
      ) {
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
        setButtonLoading(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const contractAddress =
          process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;

        if (!contractAddress) {
          console.error("Crowdfunding contract address is not defined.");
          setLoading(false);
          setButtonLoading(false);
          return;
        }
        if (!address) {
          alert("Please sign in to your MetaMask first.");
          setLoading(false);
          setButtonLoading(false);
          return;
        }
        const now = new Date();
        const nowTimestamp = Math.floor(now.getTime() / 1000); // Convert to seconds

        const contract = new ethers.Contract(
          contractAddress,
          Crowdfunding.abi,
          signer
        );

        // Ensure the 'id' variable is defined and correctly set
        if (typeof id === "undefined") {
          console.error("Campaign ID is not defined.");
          setLoading(false);
          return;
        }

        try {
          const donationAmountInEther = ethers.utils.parseEther(
            donationAmount.toString()
          );
          const createCampaignTx = await contract.donateToMilestone(
            id,
            milestoneId,
            nowTimestamp,
            { value: donationAmountInEther }
          );
          const receipt = await createCampaignTx.wait();
          alert("Donation successfully.");
          setButtonLoading(false);

          fetchCampaign();
        } catch (error) {
          alert(
            `Error making donation. Please ensure that you have connected to MetaMask. This is the error ${error}`
          );
          setLoading(false);
          setButtonLoading(false);
        }
      } else {
        alert("Please enter a valid donation amount.");
        setLoading(false);
        setButtonLoading(false);
      }
    } catch (error) {
      alert(
        `Error making donation. Please ensure that u have connected to MetaMask. This is the error ${error}`
      );
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (file && selectedMilestoneId !== null) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_UPLOAD_PRESET || ""
      );

      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_CLOUDINARY_URL || "",
          {
            method: "POST",
            body: formData,
          }
        );
        const data = await response.json();
        const documentURL = data.secure_url;
        const contractAddress =
          process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const contract = new ethers.Contract(
          contractAddress!,
          Crowdfunding.abi,
          signer
        );

        if (documentURL && selectedMilestoneId !== null) {
          const sendingDocs = await contract.updateMilestoneDocument(
            selectedMilestoneId,
            documentURL
          );

          // Wait for the transaction to be mined
          await sendingDocs.wait();

          alert("Document uploaded and milestone updated successfully!");
          setUploadedMilestones(
            (prev) => new Set(prev.add(selectedMilestoneId))
          );
          handleCloseDialog();
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id, walletAddress]);

  const handleCampaign = async (id: string) => {
    if (id) {
      setLoading(true);
      setownerbuttonLoading(true);
      router.push(`/campaignOnwers/${id}`);
      setLoading(false);
      setownerbuttonLoading(false);
    } else {
      alert("Campaign owner not found");
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (
      !campaign ||
      typeof campaign.amountCollected !== "number" ||
      typeof campaign.target !== "number"
    ) {
      return 0;
    }
    return (campaign.amountCollected / campaign.target) * 100;
  };

  const daysLeft = (endDate: number) => {
    if (!endDate) return "N/A";
    const now = new Date().getTime() / 1000;
    const timeLeft = endDate - now;
    return timeLeft > 0 ? Math.ceil(timeLeft / (60 * 60 * 24)) : 0;
  };

  const formatNumber = (value: any) => {
    return typeof value === "number" ? value.toFixed(2) : "N/A";
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
  const handleReport = async (issueType: string) => {
    if (currentMilestone && campaign) {
      console.log(currentMilestone);
      const formData = {
        campaignId: campaign.id,
        title: campaign.title,
        owner: campaign.owner,
        fundsRaised: parseFloat(
          formatEther(currentMilestone.donationAmountCollected)
        )
          .toFixed(2)
          .toString(),
        fileUpload: currentMilestone.documentURL,
        issueType: issueType,
      };

      console.log(formData);
      try {
        const response = await fetch("/api/userReports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          await response.json();
          alert("Report submitted successfully.");
        } else {
          alert("Failed to submit report.");
        }
      } catch (error) {
        console.error("Error submitting report:", error);
      } finally {
        handleCloseDialog();
      }
    }
  };
  const calculateMilestoneProgress = (
    currentAmount: any,
    targetAmount: any
  ) => {
    try {
      const currentString =
        typeof currentAmount === "object" && currentAmount.toString
          ? currentAmount.toString()
          : currentAmount;
      const targetString =
        typeof targetAmount === "object" && targetAmount.toString
          ? targetAmount.toString()
          : targetAmount;

      if (
        typeof currentString !== "string" ||
        typeof targetString !== "string"
      ) {
        console.error("Invalid input types for progress calculation");
        return 0;
      }

      const current = ethers.utils.parseEther(currentString);
      const target = ethers.utils.parseEther(targetString);
      if (current === target) {
        setTargetAchived(true);
      }
      return current.mul(100).div(target).toNumber();
    } catch (error) {
      console.error("Error calculating progress:", error);
      return 0;
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp || isNaN(timestamp)) {
        throw new Error("Invalid timestamp");
      }

      const date = new Date(parseInt(timestamp, 10));

      if (isNaN(date.getTime())) {
        throw new Error("Invalid date");
      }

      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
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

  if (!campaign && loading)
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

  if (!campaign && !loading) {
    return <p>No campaign details available.</p>;
  }

  return (
    <div className="container mx-auto p-4 mt-5">
      <div className="w-full h-12 mb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
        >
          <FontAwesomeIcon icon={faBackward} className="mr-2" />
          Back
        </button>
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-row justify-between">
          <button
            disabled={!currentMilestone}
            className={`bg-blue-500 text-white p-2 rounded-xl ${
              !currentMilestone
                ? "bg-gray-500 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
            onClick={() => setIsReportDialogOpen(true)}
          >
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              style={{ color: "#da1025" }}
              size="lg"
            />
            Report
          </button>
          <button
            disabled={ownerbuttonLoading}
            onClick={() => handleCampaign(campaign.id)}
            className={`px-4 py-2 rounded ${
              !ownerbuttonLoading
                ? "bg-blue-500 text-white hover:bg-blue-700"
                : "bg-gray-500 text-gray-400 cursor-not-allowed"
            }`}
          >
            {ownerbuttonLoading ? "Loading..." : "View Campaign Onwer"}
          </button>
        </div>
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl text-black font-bold mb-4">
            {campaign.title}
          </h1>
          <p className="text-gray-700 mb-4">{campaign.description}</p>
          <Image
            src={campaign.images}
            alt={campaign.title}
            className="rounded-t-lg"
            width={500}
            height={300}
            layout="responsive"
          />
          <div className="text-black mt-6">
            <h2 className="text-xl font-semibold mb-2">Current Milestone</h2>
            {currentMilestone ? (
              <div className="mb-4 text-black">
                <h3 className="font-bold">{currentMilestone.title}</h3>
                <p>{currentMilestone.milestonedescription}</p>
                <p>
                  <strong>Duration:</strong>{" "}
                  {formatDate(currentMilestone.startDate)} -{" "}
                  {formatDate(currentMilestone.endDate)}
                </p>
                <div className="relative mb-8 w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div
                    className="bg-green-500 h-4 rounded-full"
                    style={{
                      width: `${calculateMilestoneProgress(
                        currentMilestone.donationAmountCollected,
                        currentMilestone.targetAmt
                      )}%`,
                    }}
                  ></div>
                  <div className="absolute  left-0 text-left text-black text-xs p-1">
                    $
                    {parseFloat(
                      formatEther(currentMilestone.donationAmountCollected)
                    ).toFixed(2)}
                  </div>
                  <div className="absolute right-0 text-right text-black text-xs p-1">
                    $
                    {parseFloat(
                      formatEther(currentMilestone.targetAmt)
                    ).toFixed(2)}
                  </div>
                </div>

                {/* Donation form */}
                <input
                  className="outline outline-2 p-2 mr-4 rounded-xl"
                  type="number"
                  placeholder="0.01 (ETH)"
                  onChange={(e) => setDonationAmount(e.target.value)}
                />
                <button
                  className={`bg-blue-500 text-white p-2 rounded-xl ${
                    buttonLoading ||
                    !isLoggedIn ||
                    !walletAddress ||
                    !targetAchived
                      ? "bg-gray-500 cursor-not-allowed"
                      : "hover:bg-blue-700"
                  }`}
                  onClick={() => handleDonate(currentMilestone.id)}
                  disabled={
                    buttonLoading ||
                    !isLoggedIn ||
                    !walletAddress ||
                    !targetAchived
                  }
                >
                  {buttonLoading ? "Donating ..." : "Donate To This Milestone"}
                </button>
              </div>
            ) : (
              <p>No active milestone at the moment</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Donators</h2>
          <ul className="list-disc list-inside">
            {campaign.donators.map((donator: any, index: number) => (
              <li key={index} className="text-black">
                {donator}: ${Number(campaign.donations[index])}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-black mb-2">
            Milestones Details
          </h2>
          <ul className="list-disc list-inside">
            {milestones.map((milestone: any, index: number) => {
              const isCompleted =
                parseFloat(
                  formatEther(milestone.donationAmountCollected)
                ).toFixed(2) >=
                parseFloat(formatEther(milestone.targetAmt)).toFixed(2);
              const hasUploaded = uploadedMilestones.has(milestone.id);
              const isButtonDisabled =
                !isCompleted ||
                hasUploaded ||
                new Date() < new Date(currentMilestone.startDate) ||
                milestone.documentURL;

              return (
                <div key={index} className="mb-4 text-black">
                  <div className="flex flex-row justify-between">
                    <div>
                      <p>Stage {index + 1}</p>
                    </div>
                    {campaign &&
                      campaign.owner.trim().toLowerCase() ===
                        walletAddress.trim().toLowerCase() && (
                        <button
                          className={`px-4 py-2 rounded ${
                            isButtonDisabled
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-500 text-white hover:bg-blue-700"
                          }`}
                          onClick={() => handleOpenDialog(milestone.id)}
                          disabled={isButtonDisabled || milestone.fileUrl}
                        >
                          Upload Document
                        </button>
                      )}
                  </div>

                  <h3 className="font-bold">{milestone.title}</h3>
                  <p>{milestone.milestonedescription}</p>
                  <div>
                    <p>
                      <strong>Duration:</strong>{" "}
                      {formatDate(milestone.startDate)} -{" "}
                      {formatDate(milestone.endDate)}
                    </p>
                  </div>
                  <div className="relative mb-8 w-full bg-gray-200 rounded-full h-4 mb-4">
                    <div
                      className="bg-green-500 h-4 rounded-full"
                      style={{
                        width: `${calculateMilestoneProgress(
                          milestone.donationAmountCollected,
                          milestone.targetAmt
                        )}%`,
                      }}
                    ></div>
                    <div className="absolute left-0 text-left text-black text-xs p-1">
                      $
                      {parseFloat(
                        formatEther(milestone.donationAmountCollected)
                      ).toFixed(2)}
                    </div>
                    <div className="absolute right-0 text-right text-black text-xs p-1">
                      ${parseFloat(formatEther(milestone.targetAmt)).toFixed(2)}
                    </div>
                  </div>
                  <FileUploadDialog
                    isOpen={
                      isDialogOpen && selectedMilestoneId === milestone.id
                    }
                    onClose={handleCloseDialog}
                    onUpload={handleUpload}
                  />
                </div>
              );
            })}
          </ul>
        </div>
      </div>

      {isReportDialogOpen && (
        <ReportDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          onReport={handleReport}
        />
      )}
    </div>
  );
};

export default CampaignDetails;
