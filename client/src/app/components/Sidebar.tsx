"use client";
import Link from "next/link";
import { useState } from "react";
import { navlinks } from "../constants/navlink";
import Icon from "./Icon";
import styles from "./Sidebar.module.css"; // Import the CSS module

const Sidebar: React.FC = () => {
  const [isActive, setIsActive] = useState("dashboard");
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${styles.sidebar} ${isHovered ? styles.hovered : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href="/" passHref>
        <img
          className="w-[auto] h-[70px] bg-white rounded-xl"
          src="/img/logo.png"
          alt="logo"
        />
      </Link>

      <div className="flex-1 flex flex-col justify-between items-center bg-[#1c1c24] rounded-[20px] py-4 mt-12">
        <div className="flex flex-col justify-center items-center gap-3 w-full">
          {navlinks.map((link) => (
            <Link key={link.name} href={link.link} passHref>
              <div
                className={`${styles.linkContainer} ${
                  isActive === link.name ? styles.active : ""
                }`}
                onClick={() => {
                  if (!link.disabled) {
                    setIsActive(link.name);
                  }
                }}
              >
                <Icon
                  name={link.name}
                  imgUrl={link.imgUrl}
                  isActive={isActive === link.name}
                  disabled={link.disabled}
                />
                {isHovered && !link.disabled && (
                  <span className={styles.linkName}>{link.name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>

        <Link href="/registration-history" passHref>
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
