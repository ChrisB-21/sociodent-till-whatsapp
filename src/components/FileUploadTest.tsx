import React, { useState } from 'react';
import { uploadFileToStorage, validateFile } from '@/utils/fileUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const FileUploadTest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validation = validateFile(selectedFile);
      
      if (!validation.isValid) {
        toast({
          title: "Invalid File",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      toast({
        title: "File Selected",
        description: `${selectedFile.name} is ready to upload`,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setUploading(true);
      const testUserId = 'test-user-' + Date.now();
      
      const result = await uploadFileToStorage(file, testUserId, 'reports');
      setUploadResult(result);
      
      toast({
        title: "Upload Successful",
        description: "File uploaded successfully to Firebase Storage",
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">File Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <Input 
            type="file" 
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>
        
        {file && (
          <div className="p-3 bg-gray-50 rounded">
            <p><strong>File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)}MB</p>
            <p><strong>Type:</strong> {file.type}</p>
          </div>
        )}
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
        
        {uploadResult && (
          <div className="p-3 bg-green-50 rounded">
            <h3 className="font-bold text-green-800 mb-2">Upload Result:</h3>
            <p><strong>URL:</strong> <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">{uploadResult.url}</a></p>
            <p><strong>Path:</strong> {uploadResult.filePath}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadTest;
