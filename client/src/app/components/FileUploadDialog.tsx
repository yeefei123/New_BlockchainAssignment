import React, { useRef, useState } from "react";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>; // Changed to return a Promise
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setIsLoading(true);
      try {
        await onUpload(selectedFile);
      } finally {
        setSelectedFile(null);
        setIsLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-black">
          Upload Document
        </h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="text-black"
        />
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 mr-2 bg-gray-500 text-white rounded hover:bg-gray-700 focus:outline-none"
            onClick={handleCancel}
            disabled={isLoading} // Disable cancel button during upload
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 text-white rounded focus:outline-none ${
              isLoading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-700"
            }`}
            onClick={handleUpload}
            disabled={isLoading}
          >
            {isLoading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUploadDialog;
