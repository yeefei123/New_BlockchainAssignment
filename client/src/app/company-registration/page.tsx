"use client";

import bcrypt from "bcryptjs";
import { ethers } from "ethers";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  // useEffect(() => {
  //   const checkAuth = () => {
  //     const token = getAuthToken();
  //     if (!token) {
  //       router.push("/");
  //     } else {
  //       setLoading(false);
  //     }
  //   };

  //   checkAuth();
  // }, [router]);

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
      const hashedPassword = await bcrypt.hash(password, 10);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();

      const formData = {
        name,
        password: hashedPassword,
        walletAddress,
        icNumber,
        email,
        phoneNumber,
        address,
        ...uploadedImages,
      };

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
          if (data.user["status"] === "Pending") {
            setUserStatus("Pending");
          } else if (data.user["status"] === "Accepted") {
            setUserStatus("Accepted");
          } else {
            setUserStatus("Rejected");
          }
          console.log(userStatus);
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
          {!userExists && userStatus === "Approved" ? (
            <>
              <div className="campaigns-container flex flex-col justify-center items-center">
                <h1 className="text-4xl font-bold mb-6">Registration</h1>
                <form
                  className="w-full bg-gray-500 item-center flex justify-center shadow-md rounded px-8 pt-6 pb-8 mb-4"
                  onSubmit={handleSubmit}
                >
                  <div className="flex flex-col w-3/4 bg-black shadow-md rounded px-8 pt-6 pb-8 mb-4">
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Full Name:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.name && "border-red-500"
                        }`}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs italic">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Password:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.password && "border-red-500"
                        }`}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {errors.password && (
                        <p className="text-red-500 text-xs italic">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Email:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.email && "border-red-500"
                        }`}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs italic">
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        IC Number:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.icNumber && "border-red-500"
                        }`}
                        type="text"
                        value={icNumber}
                        onChange={(e) => setIcNumber(e.target.value)}
                      />
                      {errors.icNumber && (
                        <p className="text-red-500 text-xs italic">
                          {errors.icNumber}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Phone Number:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.phoneNumber && "border-red-500"
                        }`}
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-xs italic">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Address:
                      </label>
                      <textarea
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.address && "border-red-500"
                        }`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      {errors.address && (
                        <p className="text-red-500 text-xs italic">
                          {errors.address}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        Profile Image:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.profileImage && "border-red-500"
                        }`}
                        type="file"
                        onChange={handleProfileImageChange}
                      />
                      {profileImage && (
                        <Image
                          className="w-24 h-24 mt-2 rounded-full"
                          src={profileImageUrl}
                          alt="Profile"
                          width={100}
                          height={100}
                        />
                      )}
                      {errors.profileImage && (
                        <p className="text-red-500 text-xs italic">
                          {errors.profileImage}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-white text-sm font-bold mb-2">
                        IC Image:
                      </label>
                      <input
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                          errors.icImage && "border-red-500"
                        }`}
                        type="file"
                        onChange={handleIcImageChange}
                      />
                      {icImage && (
                        <Image
                          className="w-24 h-24 mt-2 rounded-full"
                          src={icImageUrl}
                          alt="IC"
                          width={100}
                          height={100}
                        />
                      )}
                      {errors.icImage && (
                        <p className="text-red-500 text-xs italic">
                          {errors.icImage}
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <button
                        className={`bg-blue-500 w-full hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                          loading ||
                          (!isFormValid && "opacity-50 cursor-not-allowed")
                        }`}
                        type="submit"
                        disabled={loading || !isFormValid}
                      >
                        {loading ? "Loading..." : "Register"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
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
