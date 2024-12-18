import React, { useState } from 'react';
import { FileText, Download, Loader } from 'lucide-react';

const FloorPlanButton = ({ chatHistory }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [dxfFile, setDxfFile] = useState(null);
  const [error, setError] = useState(null);

  const generateFloorPlan = async () => {
    setIsGenerating(true);
    setError(null);
    setAttemptCount(0);
    
    try {
      const userInputs = chatHistory
        .filter(msg => msg.sender === 'You')
        .map(msg => msg.content.text)
        .filter(Boolean)
        .join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Generate code which uses the ezdxf library to produce a DXF file based on the provided inputs, and specify coordinates for each piece of furniture.",
          context: userInputs,
          generateFloorPlan: true
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.attempts) {
        setAttemptCount(data.attempts);
      }

      if (data.executionResults?.[0]?.files?.[0]) {
        setDxfFile(data.executionResults[0].files[0]);
      } else {
        throw new Error('No floor plan was generated');
      }
    } catch (error) {
      console.error('Error generating floor plan:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <button
        onClick={generateFloorPlan}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 flex items-center space-x-2"
      >
        {isGenerating ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            <span>
              {attemptCount > 0 
                ? `Generating (Attempt ${attemptCount}/3)...` 
                : 'Generating...'}
            </span>
          </>
        ) : (
          <span>Generate Floor Plan</span>
        )}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm">
          Error: {error}
        </div>
      )}
      
      {dxfFile && (
        <div className="w-full max-w-xl bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <div>
                <div className="font-medium text-blue-700 dark:text-blue-300">
                  Floor Plan Generated
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {dxfFile.name} ({(dxfFile.size / 1024).toFixed(1)} KB)
                </div>
                {attemptCount > 1 && (
                  <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                    Generated successfully after {attemptCount} attempts
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([atob(dxfFile.data)], { type: 'application/dxf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = dxfFile.name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download DXF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanButton;