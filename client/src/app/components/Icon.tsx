import React from "react";

type IconProps = {
  styles?: string;
  name: string;
  imgUrl: string;
  isActive?: boolean;
  disabled?: boolean;
  handleClick?: () => void;
};

const Icon: React.FC<IconProps> = ({
  styles,
  name,
  imgUrl,
  isActive,
  disabled,
  handleClick,
}) => (
  <div
    className={`w-[48px] h-[48px] rounded-[10px] ${
      isActive ? "bg-[#2c2f32]" : ""
    } flex justify-center items-center ${
      !disabled ? "cursor-pointer" : ""
    } ${styles}`}
    onClick={handleClick}
  >
    <img
      src={imgUrl}
      alt={`${name}_icon`}
      className={`w-1/2 h-1/2 ${isActive ? "grayscale" : ""}`}
    />
  </div>
);

export default Icon;
