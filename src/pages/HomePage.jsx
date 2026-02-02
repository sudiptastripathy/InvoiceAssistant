import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadZone from '../components/UploadZone';
import Button from '../components/Button';

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (fileData) => {
    console.log('🏠 HomePage: File selected callback received');
    console.log('   - Has file:', !!fileData.file);
    console.log('   - Has preview:', !!fileData.preview);
    console.log('   - Has base64:', !!fileData.base64);
    console.log('   - Base64 length:', fileData.base64?.length);
    setUploadedFile(fileData);
  };

  const handleProcess = () => {
    if (!uploadedFile) return;
    
    console.log('🏠 HomePage: Processing document');
    console.log('   - Image data length:', uploadedFile.base64?.length);
    console.log('   - File name:', uploadedFile.file.name);
    
    // Navigate to processing page with file data
    navigate('/processing', { 
      state: { 
        imageData: uploadedFile.base64,
        fileName: uploadedFile.file.name,
        preview: uploadedFile.preview
      } 
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Process Financial Documents Instantly
        </h1>
        <p className="text-lg text-gray-600">
          Upload your invoice, receipt, or bill and we'll extract, validate, and format the data automatically
        </p>
      </div>

      {/* Upload Section */}
      <div className="space-y-6">
        <UploadZone onFileSelect={handleFileSelect} />

        {uploadedFile && (
          <div className="flex justify-center">
            <Button onClick={handleProcess}>
              Process Document
            </Button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 mt-16">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">AI Extraction</h3>
          <p className="text-sm text-gray-600">
            Claude AI reads your invoice and extracts all key fields
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Smart Validation</h3>
          <p className="text-sm text-gray-600">
            Automatic checks ensure data quality and accuracy
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Instant Format</h3>
          <p className="text-sm text-gray-600">
            Ready-to-use data formatted for payment forms
          </p>
        </div>
      </div>
    </div>
  );
}
