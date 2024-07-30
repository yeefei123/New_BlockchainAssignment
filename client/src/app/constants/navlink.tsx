interface NavLink {
  name: string;
  link: string;
  imgUrl: string;
  disabled?: boolean;
}

export const navlinks: NavLink[] = [
  {
    name: "dashboard",
    link: "/",
    imgUrl: "/assets/dashboard.svg",
  },
  {
    name: "expiredCampaign",
    link: "/expired-campaign",
    imgUrl: "/assets/menu.svg",
  },
  {
    name: "fraudCampaign",
    link: "/fraud-campaign",
    imgUrl: "/assets/withdraw.svg",
  },
  {
    name: "create",
    link: "/registration-history",
    imgUrl: "/assets/create-campaign.svg",
  },
  {
    name: "donationHistory",
    link: "/donation-history",
    imgUrl: "/assets/history.svg",
  },
];
