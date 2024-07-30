"use client";
import React, { ReactNode, createContext, useState } from "react";

interface FormContextType {
  campaignData: CampaignData;
  milestonesData: MilestoneData[];
  setCampaignData: React.Dispatch<React.SetStateAction<CampaignData>>;
  setMilestonesData: React.Dispatch<React.SetStateAction<MilestoneData[]>>;
}

interface CampaignData {
  title: string;
  desc: string;
  milestones: string;
  images: string;
}

interface MilestoneData {
  title: string;
  description: string;
  amount: string;
  startDate: string;
  endDate: string;
}

const initialCampaignData = {
  title: "",
  desc: "",
  milestones: "",
  images: "",
};

const initialMilestonesData: MilestoneData[] = [];

export const FormContext = createContext<FormContextType>({
  campaignData: initialCampaignData,
  milestonesData: initialMilestonesData,
  setCampaignData: () => {},
  setMilestonesData: () => {},
});

export const FormProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [campaignData, setCampaignData] =
    useState<CampaignData>(initialCampaignData);
  const [milestonesData, setMilestonesData] = useState<MilestoneData[]>(
    initialMilestonesData
  );

  return (
    <FormContext.Provider
      value={{
        campaignData,
        milestonesData,
        setCampaignData,
        setMilestonesData,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};
