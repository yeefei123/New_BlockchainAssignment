import React, { useState } from "react";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReport: (issue: string) => void;
}

const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  onReport,
}) => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const issues = [
    "Incomplete Milestone",
    "Inappropriate Content",
    "Duplicate Campaign",
    "Fraudulent Activity",
    "Other",
  ];

  const handleReport = () => {
    if (selectedIssue) {
      onReport(selectedIssue);
      onClose();
    } else {
      alert("Please select an issue to report.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0  text-black bg-gray-500 bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Report Issue</h2>
        <div>
          {issues.map((issue, index) => (
            <div key={index} className="mb-2">
              <input
                type="radio"
                id={`issue-${index}`}
                name="issue"
                value={issue}
                onChange={(e) => setSelectedIssue(e.target.value)}
              />
              <label htmlFor={`issue-${index}`} className="ml-2">
                {issue}
              </label>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            onClick={handleReport}
          >
            Report
          </button>
          <button
            className="px-4 py-2 bg-gray-400 text-white rounded ml-2 hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDialog;
