"use client";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthToken, removeAuthToken } from "../utils/auth";

const AdminMainPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    const authToken = getAuthToken();
    if (!authToken) {
      router.replace("/admin");
      setAuth(false);
    } else {
      setAuth(true);
      if (activeTab === "pending") {
        fetchData();
      } else {
        fetchFraudCase();
      }
    }
  }, [activeTab]);

  const fetchFraudCase = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/userReports?status=resolved", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      } else {
        alert("Failed to fetch data");
      }
    } catch (error) {
      alert("Error fetching data: " + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      } else {
        alert("Failed to fetch data");
      }
    } catch (error) {
      alert("Error fetching data: " + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApproval = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/userReports", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const jsonData = await response.json();
        console.log(jsonData);
        setData(jsonData);
      } else {
        alert("Failed to fetch data");
      }
    } catch (error) {
      alert("Error fetching data: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push("/admin");
  };

  return (
    <div>
      {auth ? (
        <div
          className="flex flex-col text-black items-center pt-5 bg-cover h-full min-h-screen bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/img/images.jpeg')`,
            backgroundSize: "cover",
          }}
        >
          <div className="flex justify-end items-center w-full px-6">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
          <h1 className="text-4xl font-bold text-black text-center mb-6">
            Admin System
          </h1>
          <div className="w-4/5 bg-white rounded-lg shadow-md">
            <div className="flex border-b">
              <TabButton
                label="Company Registration"
                active={activeTab === "pending"}
                onClick={() => handleTabClick("pending")}
              />
              <TabButton
                label="Report Case"
                active={activeTab === "fraud"}
                onClick={() => handleTabClick("fraud")}
              />
            </div>
            <div className="p-4">
              {activeTab === "pending" && (
                <PendingCompanyRegistration
                  data={data}
                  loading={loading}
                  fetchData={fetchData}
                />
              )}
              {activeTab === "fraud" && (
                <FraudCase
                  data={data}
                  loading={loading}
                  fetchData={fetchApproval}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const TabButton = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={`py-2 px-4 ${
        active ? "border-b-2 border-blue-500" : ""
      } focus:outline-none`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

const PendingCompanyRegistration = ({
  data,
  loading,
  fetchData,
}: {
  data: any[];
  loading: boolean;
  fetchData: () => void;
}) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/company/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert("Application rejected");
      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to reject company");
      }
    } catch (error) {
      console.error("Error rejecting company:", error);
      alert("Error rejecting company");
    }
  };

  const handleApproval = async (id: number) => {
    try {
      const response = await fetch(`/api/company/${id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert("Application accepted");
      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to accept company");
      }
    } catch (error) {
      console.error("Error accepting company:", error);
      alert("Error accepting company");
    }
  };

  return (
    <div>
      {loading && (
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
      )}
      {!loading && data.length === 0 && (
        <div className="text-center text-gray-500 font-bold">
          No data available
        </div>
      )}
      {!loading && data.length > 0 && (
        <div>
          <h1 className="text-4xl font-bold mb-6">Company Registration</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Phone Number</th>
                  <th className="text-left py-2 px-4">Address</th>
                  <th className="text-left py-2 px-4">Profile Image</th>
                  <th className="text-left py-2 px-4">IC Image</th>
                  <th className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-4">{item.name}</td>
                    <td className="py-2 px-4">{item.email}</td>
                    <td className="py-2 px-4">{item.phone_number}</td>
                    <td className="py-2 px-4">{item.address}</td>
                    <td className="py-2 px-4">
                      <img
                        src={item.profile_image_url}
                        alt="profile image"
                        width={100}
                        height={100}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <img
                        src={item.ic_image_url}
                        alt="ic image"
                        width={100}
                        height={100}
                      />
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-row justify-between">
                        <button
                          className="bg-red-500 rounded-full p-3"
                          onClick={() => handleReject(item.id)}
                        >
                          <FontAwesomeIcon icon={faTimes} color="#fff" />
                        </button>
                        <button
                          className="bg-green-500 rounded-full p-3"
                          onClick={() => handleApproval(item.id)}
                        >
                          <FontAwesomeIcon icon={faCheck} color="#fff" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const FraudCase = ({
  data,
  loading,
  fetchData,
}: {
  data: any[];
  loading: boolean;
  fetchData: () => void;
}) => {
  if (loading) {
    return <div>Loading...</div>;
  }

  const handleReject = async (id: number) => {
    try {
      const response = await fetch(`/api/userReports/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert("Application rejected");
      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to reject company");
      }
    } catch (error) {
      console.error("Error rejecting company:", error);
      alert("Error rejecting company");
    }
  };

  const handleApproval = async (id: number) => {
    try {
      const response = await fetch(`/api/userReports/${id}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });
      alert("Application accepted");
      if (response.ok) {
        fetchData();
      } else {
        alert("Failed to accept company");
      }
    } catch (error) {
      console.error("Error accepting company:", error);
      alert("Error accepting company");
    }
  };

  return (
    <div>
      {loading && (
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
      )}
      {!loading && data.length === 0 && (
        <div className="text-center text-gray-500 font-bold">
          No data available
        </div>
      )}
      {!loading && data.length > 0 && (
        <div>
          <h1 className="text-4xl font-bold mb-6">Report Cases</h1>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="text-left py-2 px-4">Title</th>
                  <th className="text-left py-2 px-4">Campaign Title</th>
                  <th className="text-left py-2 px-4">File Url</th>
                  <th className="text-left py-2 px-4">Campaign Owner</th>
                  <th className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-4">{item.issue_type}</td>
                    <td
                      className="py-2 px-4"
                      style={{
                        maxWidth: "50px",
                        wordWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.campaign_title}
                    </td>
                    <td
                      className="py-2 px-4"
                      style={{
                        maxWidth: "200px",
                        wordWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.file_url ? item.file_url : "-"}
                    </td>
                    <td
                      className="py-2 px-4"
                      style={{
                        maxWidth: "100px",
                        wordWrap: "break-word",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.campaign_owner ? item.campaign_owner : "-"}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-row justify-between">
                        <button
                          className="bg-red-500 rounded-full p-3"
                          onClick={() => handleReject(item.report_id)}
                        >
                          <FontAwesomeIcon icon={faTimes} color="#fff" />
                        </button>
                        <button
                          className="bg-green-500 rounded-full p-3"
                          onClick={() => handleApproval(item.campaign_id)}
                        >
                          <FontAwesomeIcon icon={faCheck} color="#fff" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMainPage;
