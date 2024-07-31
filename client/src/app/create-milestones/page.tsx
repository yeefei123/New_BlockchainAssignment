"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { FormContext } from "../context/FormContext";

interface MilestoneData {
  title: string;
  description: string;
  amount: string;
  startDate: string;
  endDate: string;
}

const CreateMilestonesPage = () => {
  const router = useRouter();
  const { milestonesData, setMilestonesData, campaignData } =
    useContext(FormContext);
  const [currentStep, setCurrentStep] = useState(0);
  const milestonesCount = parseInt(campaignData.milestones, 10);

  const [errors, setErrors] = useState<
    Partial<Record<keyof MilestoneData, string>>
  >({
    title: "",
    description: "",
    amount: "",
    startDate: "",
    endDate: "",
  });

  const [localMilestones, setLocalMilestones] = useState<MilestoneData[]>(() =>
    milestonesData.length > 0
      ? milestonesData
      : Array.from({ length: milestonesCount }, () => ({
          title: "",
          description: "",
          amount: "",
          startDate: "",
          endDate: "",
        }))
  );

  useEffect(() => {
    if (milestonesData.length > 0) {
      setLocalMilestones(milestonesData);
    } else if (localMilestones.length < milestonesCount) {
      setLocalMilestones(
        Array.from(
          { length: milestonesCount },
          (_, i) =>
            localMilestones[i] || {
              title: "",
              description: "",
              amount: "",
              startDate: "",
              endDate: "",
            }
        )
      );
    }
  }, [milestonesCount, milestonesData, localMilestones]);

  const handleFormFieldChange = (
    fieldName: keyof MilestoneData,
    value: string
  ) => {
    const newMilestones = [...localMilestones];
    if (newMilestones[currentStep]) {
      newMilestones[currentStep][fieldName] = value;
      setLocalMilestones(newMilestones);
    }
  };

  const getTodayDate = () => {
    const now = new Date();
    now.setSeconds(0, 0); // Remove seconds and milliseconds
    return now.toISOString().slice(0, 16);
  };

  const addDays = (dateString: string, days: number) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 16);
  };

  const getMinStartDate = (index: number) => {
    if (index === 0) return getTodayDate();
    const prevEndDate = localMilestones[index - 1]?.endDate;
    return prevEndDate ? addDays(prevEndDate, 3) : getTodayDate();
  };

  const validateStep = () => {
    const milestone = localMilestones[currentStep];
    const errors: Partial<MilestoneData> = {
      title: "",
      description: "",
      amount: "",
      startDate: "",
      endDate: "",
    };
    let valid = true;

    const today = getTodayDate();

    if (!milestone?.title?.trim()) {
      errors.title = "Milestone Title is required";
      valid = false;
    }
    if (!milestone?.description?.trim()) {
      errors.description = "Milestone Description is required";
      valid = false;
    }
    if (!milestone?.amount?.trim() || isNaN(Number(milestone.amount))) {
      errors.amount = "Valid Target Amount (in ETH) is required";
      valid = false;
    }
    if (!milestone?.startDate?.trim()) {
      errors.startDate = "Start Date is required";
      valid = false;
    } else if (milestone.startDate < today) {
      errors.startDate = "Start Date cannot be before today";
      valid = false;
    } else if (
      currentStep > 0 &&
      milestone.startDate < localMilestones[currentStep - 1].endDate
    ) {
      errors.startDate =
        "Start Date cannot be before the previous milestone's End Date";
      valid = false;
    }
    if (!milestone?.endDate?.trim()) {
      errors.endDate = "End Date is required";
      valid = false;
    } else if (milestone.endDate < milestone.startDate) {
      errors.endDate = "End Date cannot be before Start Date";
      valid = false;
    }

    setErrors(errors);
    return { valid, errors };
  };

  const handleNext = () => {
    const { valid } = validateStep();
    if (!valid) {
      console.log(errors);
      return;
    }
    if (currentStep < milestonesCount - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setMilestonesData(localMilestones);
      router.push("/summary");
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBack = () => {
    setMilestonesData(localMilestones);
    router.push("/create-campaign");
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleBack}
        className="mt-2 ml-5 mb-5 bg-blue-500 hover:bg-gray-700 w-100 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:shadow-outline"
      >
        Back
      </button>
      <div className="items-center bg-gray-500 rounded-xl flex flex-col min-h-screen">
        <h1 className="text-4xl font-bold mb-6 text-white">
          Create Milestones
        </h1>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col w-3/4 bg-black shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <label htmlFor="title" className="block text-white font-bold mb-2">
              Milestone Title {currentStep + 1}
            </label>
            <input
              type="text"
              id="title"
              value={localMilestones[currentStep]?.title || ""}
              onChange={(e) => handleFormFieldChange("title", e.target.value)}
              placeholder="Enter milestone title"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.title && "border-red-500"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs italic">{errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-white font-bold mb-2"
            >
              Milestone Description
            </label>
            <textarea
              id="description"
              value={localMilestones[currentStep]?.description || ""}
              onChange={(e) =>
                handleFormFieldChange("description", e.target.value)
              }
              rows={6}
              placeholder="Enter milestone description"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.description && "border-red-500"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-xs italic">
                {errors.description}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="amount" className="block text-white font-bold mb-2">
              Target Amount (in ETH)
            </label>
            <input
              type="number"
              id="amount"
              value={localMilestones[currentStep]?.amount || ""}
              onChange={(e) => handleFormFieldChange("amount", e.target.value)}
              placeholder="Enter target amount"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.amount && "border-red-500"
              }`}
            />
            {errors.amount && (
              <p className="text-red-500 text-xs italic">{errors.amount}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="startDate"
              className="block text-white font-bold mb-2"
            >
              Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={localMilestones[currentStep]?.startDate || ""}
              min={getMinStartDate(currentStep)}
              onChange={(e) =>
                handleFormFieldChange("startDate", e.target.value)
              }
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.startDate && "border-red-500"
              }`}
            />
            {errors.startDate && (
              <p className="text-red-500 text-xs italic">{errors.startDate}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="endDate"
              className="block text-white font-bold mb-2"
            >
              End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={localMilestones[currentStep]?.endDate || ""}
              min={localMilestones[currentStep]?.startDate || getTodayDate()}
              onChange={(e) => handleFormFieldChange("endDate", e.target.value)}
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.endDate && "border-red-500"
              }`}
            />
            {errors.endDate && (
              <p className="text-red-500 text-xs italic">{errors.endDate}</p>
            )}
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrev}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={currentStep === 0}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {currentStep === milestonesCount - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMilestonesPage;
