"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setAuthToken } from "./utils/auth";

const AdminPage = (props: any) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        name: "Name is required",
      }));
      return;
    }

    if (!password.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: "Password is required",
      }));
      return;
    }
    setErrors({ name: "", password: "" });

    // Simulate a successful login
    if (name === "admin" && password === "12345") {
      setAuthToken("admin_auth_token");
      router.push("/admin-main");
      // const urlOrPath = `/admin-main`;
      // window.location.href = urlOrPath;
    } else {
      if (name !== "admin") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          name: "Incorrect username.",
          password: "",
        }));
      }
      if (password !== "12345") {
        setErrors((prevErrors) => ({
          ...prevErrors,
          name: "",
          password: "Incorrect password.",
        }));
      }
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-no-repeat bg-center"
      style={{
        backgroundImage: `url('/img/images.jpeg')`,
        backgroundSize: "cover",
      }}
    >
      <div className="text-white max-w-md w-full p-6 rounded-lg bg-opacity-75 bg-white">
        <div className="flex justify-center">
          <Image src={"/img/logo.png"} alt="logo" width={300} height={300} />
        </div>
        <h1 className="text-4xl font-bold text-black text-center mb-6">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm text-black font-bold mb-2"
            >
              Name:
            </label>
            <input
              id="name"
              type="text"
              className={`w-full px-3 py-2 rounded border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:border-blue-500 text-black`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  name: "",
                }));
              }}
            />
            {errors.name && (
              <p className="text-red-500 text-xs italic">{errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="password"
              className="block text-black text-sm font-bold mb-2"
            >
              Password:
            </label>
            <input
              id="password"
              type="password"
              className={`w-full px-3 py-2 rounded border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:border-blue-500 text-black`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  password: "",
                }));
              }}
            />
            {errors.password && (
              <p className="text-red-500 text-xs italic">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;
