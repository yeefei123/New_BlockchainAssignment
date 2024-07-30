"use client";

import { faBackward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { ChangeEvent, useContext, useEffect, useState } from "react";
import { FormContext } from "../context/FormContext";
import { getAuthToken } from "../utils/auth";

export default function CreateCampaignPage() {
  const { campaignData, setCampaignData } = useContext(FormContext);
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<boolean>(false);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAccountLoggedIn, setIsAccountLoggedIn] = useState<boolean>(false);
  const [form, setForm] = useState(campaignData);
  const [errors, setErrors] = useState({
    title: "",
    desc: "",
    milestones: "",
    images: "",
  });
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    setForm(campaignData);
  }, [campaignData]);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      if (!token) {
        router.push("/");
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress("");
        setIsLoggedIn(false);
        setIsAccountLoggedIn(false);
        setLoading(true);
        router.push("/");
        setLoading(false);
      } else {
        setWalletAddress(accounts[0]);
        setIsLoggedIn(true);
        console.log(accounts);
      }
    };

    const fetchWalletAddress = async () => {
      setLoading(true);
      if (typeof window.ethereum === "undefined") {
        console.error("MetaMask is not installed. Please install MetaMask.");
        setLoading(false);
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsLoggedIn(true);
        } else {
          setWalletAddress("");
          setIsLoggedIn(false);
        }

        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } catch (error) {
        console.error("Error fetching wallet address:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletAddress();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  const handleFormFieldChange = (
    fieldName: string,
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    const updatedForm = { ...form, [fieldName]: newValue };
    setForm(updatedForm);
    setErrors({ ...errors, [fieldName]: "" });
    setCampaignData(updatedForm);
    validateForm(updatedForm);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

        if (data.secure_url) {
          const updatedForm = { ...form, images: data.secure_url };
          setForm(updatedForm);
          setErrors({ ...errors, images: "" });
          setCampaignData(updatedForm);
          validateForm(updatedForm);
        } else {
          throw new Error("Failed to upload image");
        }
      } catch (error) {
        console.error("Failed to upload image:", error);
        setErrors({ ...errors, images: "Failed to upload image" });
      }
    }
  };

  const validateForm = (formData: any) => {
    let valid = true;
    const newErrors = {
      title: "",
      desc: "",
      milestones: "",
      images: "",
    };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      valid = false;
    }
    if (!formData.desc.trim()) {
      newErrors.desc = "Description is required";
      valid = false;
    }
    if (
      !formData.milestones.trim() ||
      isNaN(Number(formData.milestones)) ||
      !Number.isInteger(Number(formData.milestones)) ||
      Number(formData.milestones) <= 0
    ) {
      newErrors.milestones =
        "Valid whole number of milestones is required and must be greater than 0";
      valid = false;
    }
    if (Number(formData.milestones) > 5) {
      newErrors.milestones = "Maximum number of milestones is 5";
      valid = false;
    }
    if (!formData.images) {
      newErrors.images = "Image is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm(form)) {
      alert("Please fill up all the fields to create campaign");
      return;
    }

    setLoading(true);

    setCampaignData(form);

    router.push("/create-milestones");
    setLoading(false);
  };

  const handleMilestonesChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Extract value and ensure it's a valid whole number
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      handleFormFieldChange("milestones", e);
    }
  };

  const handleMilestonesKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Allow only number keys and backspace/delete
    if (
      !(
        (e.key >= "0" && e.key <= "9") ||
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <div className="campaigns-container flex flex-col justify-center items-center">
      <div className="w-full h-12 mb-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline"
        >
          <FontAwesomeIcon icon={faBackward} className="mr-contr" />
          Back
        </button>
      </div>
      <div className="w-full items-center justify-center bg-gray-500 rounded-xl flex flex-col h-full">
        <h1 className="text-4xl font-bold mb-6 text-white">Create Campaign</h1>
        <form
          title="Create Campaign"
          onSubmit={handleSubmit}
          className="flex flex-col w-3/4 bg-black shadow-md rounded px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <label htmlFor="title" className="block text-white font-bold mb-2">
              Campaign Title
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={form.title}
              onChange={(e) => handleFormFieldChange("title", e)}
              placeholder="Enter your campaign title here..."
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.title && "border-red-500"
              }`}
            />
            {errors.title && (
              <p className="text-red-500 text-xs italic">{errors.title}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="desc" className="block text-white font-bold mb-2">
              Campaign Description
            </label>
            <textarea
              name="desc"
              id="desc"
              value={form.desc}
              onChange={(e) => handleFormFieldChange("desc", e)}
              placeholder="Enter your campaign description here..."
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.desc && "border-red-500"
              }`}
            />
            {errors.desc && (
              <p className="text-red-500 text-xs italic">{errors.desc}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="milestones"
              className="block text-white font-bold mb-2"
            >
              Number of Milestones
            </label>
            <input
              type="number"
              name="milestones"
              id="milestones"
              value={form.milestones}
              onChange={handleMilestonesChange}
              onKeyDown={handleMilestonesKeyDown}
              placeholder="Enter your number of milestones here..."
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.milestones && "border-red-500"
              }`}
              step="1"
              min="1"
              max="5"
            />
            {errors.milestones && (
              <p className="text-red-500 text-xs italic">{errors.milestones}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="images" className="block text-white font-bold mb-2">
              Image File
            </label>
            <input
              type="file"
              name="images"
              id="images"
              onChange={handleFileChange}
              accept="image/*"
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                errors.images && "border-red-500"
              }`}
            />
            {errors.images && (
              <p className="text-red-500 text-xs italic">{errors.images}</p>
            )}
          </div>

          <button
            type="submit"
            className={`mt-2 bg-green-500 hover:bg-gray-700 text-white font-bold py-4 px-4 rounded-xl focus:outline-none focus:shadow-outline ${
              !isFormValid && "opacity-50 cursor-not-allowed"
            }`}
            disabled={!isFormValid}
          >
            {loading ? (
              <div className="flex mb-5 justify-center items-center">
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
              "Next"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
