"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCampaignById } from "../utils/campaigns";

const FraudCampaign = () => {
  const [fraudCampaigns, setFraudCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFraudCampaigns = async () => {
      setLoading(true);

      try {
        const response = await fetch(`/api/userReports?status=resolved`);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched fraud campaigns data:", data);

          if (Array.isArray(data)) {
            const detailedCampaigns = await Promise.all(
              data.map(async (campaign: any) => {
                console.log("Processing campaign:", campaign);

                if (
                  campaign.campaign_id !== undefined &&
                  campaign.campaign_id !== null
                ) {
                  const detailedCampaign = await getCampaignById(
                    campaign.campaign_id
                  );
                  return detailedCampaign
                    ? { ...campaign, ...detailedCampaign }
                    : campaign;
                } else {
                  console.warn(
                    `Campaign ID is missing or invalid for campaign:`,
                    campaign
                  );
                  return campaign;
                }
              })
            );
            console.log(detailedCampaigns);
            setFraudCampaigns(detailedCampaigns);
          } else {
            setFraudCampaigns([]);
          }
        } else {
          console.error("Failed to fetch fraud campaigns");
          setFraudCampaigns([]);
        }
      } catch (error) {
        console.error("Error fetching fraud campaigns:", error);
        setFraudCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFraudCampaigns();
  }, []);

  const handleCreateCampaign = () => {
    router.push("/create-campaign");
  };

  return (
    <div className="flex flex-col mt-5 justify-center items-center min-h-screen pt-5">
      <h1 className="text-4xl font-bold mb-6">Fraud Campaigns</h1>
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
      ) : (
        <>
          {fraudCampaigns.length > 0 ? (
            <div className="bg-white p-4 text-black rounded shadow mb-4 max-w-3xl w-full">
              <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {fraudCampaigns.map((campaign) => (
                  <div
                    className="border bg-opacity-75 bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out"
                    key={campaign.campaign_id}
                  >
                    <p className="truncate">
                      <strong>Owner:</strong> {campaign.campaign_owner}
                    </p>
                    <img
                      src={campaign[6] || "default-image.png"} // Default image if URL is null
                      alt={campaign.campaign_title}
                      className="rounded-t-lg hover:scale-105 transition-transform duration-300 ease-in-out"
                    />
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-2">
                        {campaign.campaign_title}
                      </h2>
                      <h2 className="text-xl font-bold mb-2">Funds raised:</h2>
                      <p className="text-gray-600">
                        {campaign.funds_raised} ETH
                      </p>
                    </div>
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-2">Issue Type:</h2>
                      <p className="text-gray-600">{campaign.issue_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white p-4 text-black rounded shadow mb-4 max-w-3xl w-full">
              <p>No fraud campaigns found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FraudCampaign;
