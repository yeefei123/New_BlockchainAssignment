interface NavLink {
  name: string;
  link: string;
  imgUrl: string;
  disabled?: boolean;
}

export const navlinks: NavLink[] = [
  {
    name: "All Campaigns",
    link: "/",
    imgUrl: "/assets/dashboard.svg",
  },
  {
    name: "Expired Campaign",
    link: "/expired-campaign",
    imgUrl: "/assets/menu.svg",
  },
  {
    name: "Fraud Campaign",
    link: "/fraud-campaign",
    imgUrl: "/assets/withdraw.svg",
  },
  {
    name: "Campaign History",
    link: "/campaign-history",
    imgUrl: "/assets/create-campaign.svg",
  },
  {
    name: "Donation History",
    link: "/donation-history",
    imgUrl: "/assets/history.svg",
  },
];
