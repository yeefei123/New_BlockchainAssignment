// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Crowdfunding2 {
    enum Stage { Init, RegOpen, Reg, Vote, Done }

    struct Campaign {
        uint256 id;
        address owner;
        string title;
        string description;
        uint256 target;
        uint256 amountCollected;
        string images;
        uint256[] milestoneIds;
        address[] donators;
        uint256[] donations;
        Transactions[] transactions;
    }

    struct Transactions {
        address donator;
        uint256 amount;
        uint256 timestamp;
        uint256 milestoneId;
    }

    struct Milestone {
        uint256 id;
        uint256 campaignId;
        string milestonetitle;
        string milestonedescription;
        uint256 donationAmountCollected;
        uint256 targetAmt;
        uint256 startDate;
        uint256 endDate;
        string status;
        bool isFraud;
        string documentURL; // Reference to the uploaded document
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => Milestone) public milestones;
    uint256 public numberOfCampaigns = 0;
    uint256 public numberOfMilestones = 0;

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        string memory _images,
        Milestone[] memory _milestones 
    ) public returns (uint256) {
        Campaign storage campaign = campaigns[numberOfCampaigns];
        
        campaign.id = numberOfCampaigns;
        campaign.owner = msg.sender;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.amountCollected = 0;
        campaign.images = _images;
        
        for (uint256 i = 0; i < _milestones.length; i++) {
            Milestone storage milestone = milestones[numberOfMilestones];
            milestone.id = numberOfMilestones;
            milestone.campaignId = numberOfCampaigns;
            milestone.milestonetitle = _milestones[i].milestonetitle;
            milestone.milestonedescription = _milestones[i].milestonedescription;
            milestone.targetAmt = _milestones[i].targetAmt;
            milestone.startDate = _milestones[i].startDate;
            milestone.endDate = _milestones[i].endDate;
            milestone.donationAmountCollected = _milestones[i].donationAmountCollected;
            milestone.status = _milestones[i].status;
            milestone.isFraud = _milestones[i].isFraud;
            milestone.documentURL = _milestones[i].documentURL; // Initialize document URL
            campaign.milestoneIds.push(numberOfMilestones);
            numberOfMilestones++;
        }

        numberOfCampaigns++;
        
        return numberOfCampaigns - 1;
    }

    function donateToMilestone(uint256 _campaignId, uint256 _milestoneId, uint256 _customTimestamp) public payable {
        require(_campaignId < numberOfCampaigns, "Campaign does not exist");
        require(_milestoneId < numberOfMilestones, "Milestone does not exist");
        require(msg.value > 0, "Donation amount must be greater than zero");

        Campaign storage campaign = campaigns[_campaignId];
        Milestone storage milestone = milestones[_milestoneId];
        
        require(milestone.campaignId == _campaignId, "Milestone does not belong to the campaign");

        uint256 currentTimeStamp = (_customTimestamp == 0) ? block.timestamp : _customTimestamp;

        campaign.amountCollected += msg.value;
        milestone.donationAmountCollected += msg.value;

        if (milestone.donationAmountCollected >= milestone.targetAmt) {
            milestone.status = "pending";
        }

        campaign.transactions.push(Transactions(msg.sender, msg.value, currentTimeStamp, _milestoneId));
        
        campaign.donators.push(msg.sender);
        campaign.donations.push(msg.value);
    }

    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            Campaign storage item = campaigns[i];
            allCampaigns[i] = item;
        }

        return allCampaigns;
    }

    function getMilestones(uint256 _campaignId) public view returns (Milestone[] memory) {
        uint256[] memory milestoneIds = campaigns[_campaignId].milestoneIds;
        Milestone[] memory allMilestones = new Milestone[](milestoneIds.length);

        for (uint256 i = 0; i < milestoneIds.length; i++) {
            Milestone storage milestone = milestones[milestoneIds[i]];
            allMilestones[i] = milestone;
        }

        return allMilestones;
    }

    event MilestoneDocumentUpdated(uint256 milestoneId, string documentURL, string status);

    function updateMilestoneDocument(uint256 _milestoneId, string memory _documentURL) public {
        require(_milestoneId < numberOfMilestones, "Milestone does not exist");
        require(milestones[_milestoneId].campaignId < numberOfCampaigns, "Campaign does not exist");
        require(msg.sender == campaigns[milestones[_milestoneId].campaignId].owner, "Only campaign owner can update milestone");

        Milestone storage milestone = milestones[_milestoneId];
        milestone.documentURL = _documentURL;

        if (keccak256(bytes(milestone.status)) != keccak256(bytes("completed"))) {
            milestone.status = "completed";
        }

        emit MilestoneDocumentUpdated(_milestoneId, _documentURL, milestone.status);
    }
}
