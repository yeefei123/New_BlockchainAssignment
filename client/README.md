This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

cd client

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## database configuration (if haven't configure before)

1. Download MySql Workbench
2. Create database
3. Import query below:

use mydb;

SET SQL_SAFE_UPDATES = 0;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    wallet_address TEXT NOT NULL,
    ic_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    profile_image_url TEXT, 
    ic_image_url TEXT,
    status VARCHAR(50) NOT NULL
);

CREATE TABLE UserReports (
  report_id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  campaign_title VARCHAR(255) NOT NULL,
  campaign_owner VARCHAR(255) NOT NULL,
  funds_raised DECIMAL(15, 2) NOT NULL,
  file_url VARCHAR(255),
  issue_type VARCHAR(255),
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


## Cloudinary
All the files and images are uploaded onto cloud before submitting to cloud

API for the cloudinary:
https://api.cloudinary.com/v1_1/dt6twx3ee/image/upload

## Small description for the system
- the system is using both centralize and decentralize database: kyc using sql server and blockchain
- the system has review team for the company registration and fraud case
- the system is donation based crowdfunding platform
- the system is using DAO pricinple for the fraud case voting
- the system is using custom smart contract for this blockchain system

For milestone, the user only able to upload document if they are:
- the campaign owner (Based on the wallet address connected)
- document Url is first time upload for this milestone
- today's date is greater than milestone start date
- the previous milestone should uploaded the document to continue

Active campaign only show the campaign that are not reported as fraud
Inactive campaign included all the campaign that dont have current milestone
The campaign still can continue even if the target amount for the previous milestone not achieve but have uploaded proof of documents

Donation is only allowed if
- the current donation amount is smaller than the target amount
- the user has connected to MetaMask
- the donation amount is not empty
- the donation amount + the current donation collected is smaller than the target amount