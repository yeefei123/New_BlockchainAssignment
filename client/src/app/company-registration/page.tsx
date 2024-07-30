"use client";

import { faBackward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken } from "../utils/auth";

const CompanyRegistrationPage = (props: any) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [icImage, setIcImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [icImageUrl, setIcImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userExists, setUserExists] = useState(false);
  const [userStatus, setUserStatus] = useState("");
  const router = useRouter();

  const [errors, setErrors] = useState({
    name: "",
    password: "",
    icNumber: "",
    email: "",
    phoneNumber: "",
    address: "",
    profileImage: "",
    icImage: "",
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileImageUrl(imageUrl);
    }
  };

  const handleIcImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIcImage(file);
      const imageUrl = URL.createObjectURL(file);
      setIcImageUrl(imageUrl);
    }
  };

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

    setLoading(false);
  };

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
    if (typeof window !== "undefined") {
      checkMetaMaskConnection();

      if (window.ethereum) {
        window.ethereum.on("accountsChanged", async () => {
          await checkMetaMaskConnection();
        });

        window.ethereum.on("chainChanged", async () => {
          await checkMetaMaskConnection();
        });
      }

      return () => {
        if (window.ethereum) {
          window.ethereum.removeAllListeners("accountsChanged");
          window.ethereum.removeAllListeners("chainChanged");
        }
      };
    }
  }, []);

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      password: "",
      email: "",
      icNumber: "",
      phoneNumber: "",
      address: "",
      profileImage: "",
      icImage: "",
    };

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email =
        "Valid email is required. The format should be something like user@example.com";
      valid = false;
    }
    if (!icNumber.trim()) {
      newErrors.icNumber = "IC Number is required";
      valid = false;
    }
    if (!profileImage) {
      newErrors.profileImage = "Profile Image is required";
      valid = false;
    }
    if (!icImage) {
      newErrors.icImage = "IC Image is required";
      valid = false;
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone Number is required";
      valid = false;
    }
    if (!address.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    setErrors(newErrors);
    setIsFormValid(valid);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fill up all the fields to register your company.");
      return;
    }

    setLoading(true);

    try {
      const uploadedImages: Record<string, string> = {};

      if (profileImage) {
        const profileData = new FormData();
        profileData.append("file", profileImage);
        profileData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_UPLOAD_PRESET || ""
        );

        const profileResponse = await fetch(
          process.env.NEXT_PUBLIC_CLOUDINARY_URL || "",
          {
            method: "POST",
            body: profileData,
          }
        );

        const profileJson = await profileResponse.json();
        if (profileJson.secure_url) {
          uploadedImages.profileImageUrl = profileJson.secure_url;
        } else {
          console.error("Failed to upload profile image:", profileJson);
        }
      }

      if (icImage) {
        const icData = new FormData();
        icData.append("file", icImage);
        icData.append(
          "upload_preset",
          process.env.NEXT_PUBLIC_UPLOAD_PRESET || ""
        );

        const icResponse = await fetch(
          process.env.NEXT_PUBLIC_CLOUDINARY_URL || "",
          {
            method: "POST",
            body: icData,
          }
        );

        const icJson = await icResponse.json();
        if (icJson.secure_url) {
          uploadedImages.icImageUrl = icJson.secure_url;
        } else {
          console.error("Failed to upload IC image:", icJson);
        }
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const formData = {
        name,
        password,
        walletAddress,
        icNumber,
        email,
        phoneNumber,
        address,
        ...uploadedImages,
      };

      console.log(formData);
      const response = await fetch("/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          "Registration successful. Please wait for admin to approve your registration. Thank you."
        );
        router.push("/");
        setLoading(false);
      } else {
        alert("Registration failed:" + response.statusText);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error registering:", error);
      setLoading(false);
    }
  };

  const fetchUserReports = async (ownerAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/data?wallet_address=${ownerAddress}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exist()) {
          setUserExists(true);
          // if (data.status === "Pending") {
          //   setUserStatus("Pending");
          // } else if (data.status === "Accepted") {
          //   setUserStatus("Accepted");
          // } else {
          //   setUserStatus("Rejected");
          // }
          // console.log(userStatus);
          return true;
        } else {
          setUserExists(false);
          return false;
        }
      } else {
        throw new Error("Failed to fetch user reports");
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
      return false;
    }
  };

  useEffect(() => {
    validateForm();
    fetchUserReports;
  }, [
    name,
    password,
    email,
    icNumber,
    phoneNumber,
    address,
    profileImage,
    icImage,
  ]);

  return (
    <div>
      {isLoggedIn ? (
        <>
          {userExists ? (
            <>
              <div className="w-full h-12 mb-4">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faBackward}
                    onClick={() => router.push("/")}
                    className="cursor-pointer"
                  />
                  <h1 className="text-lg font-semibold">
                    Company Registration
                  </h1>
                </div>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col w-full max-w-md mx-auto"
              >
                {/* Form fields */}
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>
                {/* Add other form fields similarly */}
                <div className="mb-4">
                  <label
                    htmlFor="profileImage"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Profile Image
                  </label>
                  <input
                    type="file"
                    id="profileImage"
                    onChange={handleProfileImageChange}
                    className="mt-1 block w-full"
                  />
                  {profileImageUrl && (
                    <Image
                      src={profileImageUrl}
                      alt="Profile Preview"
                      width={100}
                      height={100}
                      className="mt-2"
                    />
                  )}
                  {errors.profileImage && (
                    <p className="text-red-500 text-sm">
                      {errors.profileImage}
                    </p>
                  )}
                </div>
                {/* Similarly, add fields for IC image, etc. */}
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </form>
            </>
          ) : (
            <div className="w-full h-screen flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold mb-6">Registration</h1>
              <br />
              <h2 className="text-xl text-red-500">
                Please check your application status under application history
                page.
              </h2>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-screen flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-6">Registration</h1>
          <br />
          <h2 className="text-xl text-red-500">
            Please connect to MetaMask to proceed.
          </h2>
        </div>
      )}
    </div>
  );
};

export default CompanyRegistrationPage;
