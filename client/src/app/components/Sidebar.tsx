"use client";
import Link from "next/link";
import { useState } from "react";
import { navlinks } from "../constants/navlink";
import Icon from "./Icon";

const Sidebar: React.FC = () => {
  const [isActive, setIsActive] = useState("dashboard");

  return (
    <div className="flex justify-between items-center flex-col sticky top-5 h-[93vh]">
      <Link href="/" passHref>
        <img
          className="w-[auto] h-[70px] bg-white rounded-xl"
          src="/img/logo.png"
          alt="logo"
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between items-center bg-[#1c1c24] rounded-[20px] w-[76px] py-4 mt-12">
        <div className="flex flex-col justify-center items-center gap-3">
          {navlinks.map((link) => (
            <Link key={link.name} href={link.link} passHref>
              <Icon
                name={link.name}
                imgUrl={link.imgUrl}
                isActive={isActive === link.name}
                disabled={link.disabled}
                handleClick={() => {
                  if (!link.disabled) {
                    setIsActive(link.name);
                  }
                }}
              />
            </Link>
          ))}
        </div>

        <Link href="/campaign-history" passHref>
          <img
            className="bg-[#1c1c24] shadow-secondary"
            src="/assets/profile.svg"
            alt="profile"
          />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
