// src/app/api/chat/route.js
import { generateChatResponse } from '../../../lib/llama';
import { pythonExecutor } from '../../../lib/codeExecutor';
import { NextResponse } from 'next/server';

const MAX_RETRIES = 3;

async function generateValidCode(context, previousError = null, attemptCount = 0) {
  // Create a detailed prompt that ensures DXF file creation in temp directory
  let prompt = `Based on these requirements:\n${context}\n\n
Generate Python code that creates a DXF file following these exact steps:
1. Import required libraries:
   - import ezdxf
   - import os

2. Get the output directory from environment variable:
   output_dir = os.environ.get('OUTPUT_DIR')
   if not output_dir:
       raise ValueError('OUTPUT_DIR environment variable is required')

3. Create a new DXF document:
   doc = ezdxf.new()
   msp = doc.modelspace()

4. Add entities to modelspace (walls, doors, windows, furniture)

5. Save the file to the temporary directory:
   output_path = os.path.join(output_dir, 'floorplan.dxf')
   doc.saveas(output_path)

Here's the required code structure:
\`\`\`python
import ezdxf
import os

# Get output directory from environment variable
output_dir = os.environ.get('OUTPUT_DIR')
if not output_dir:
    raise ValueError('OUTPUT_DIR environment variable is required')

# Create new DXF document
doc = ezdxf.new()

# Get modelspace
msp = doc.modelspace()

# Add entities to modelspace
# [Your implementation here]

# Save the file to the temporary directory
output_path = os.path.join(output_dir, 'floorplan.dxf')
doc.saveas(output_path)
\`\`\`

Generate the complete code implementing the floor plan based on the requirements. Include all the code between the above template. Make sure to save the file in the provided OUTPUT_DIR directory.`;

  // If there was an error in the previous attempt, add it to the prompt
  if (previousError) {
    prompt = `The previous code generated resulted in the following error:\n${previousError}\n\n
Please fix the code to address this error. Make sure to include all these required elements:
1. Import ezdxf and os modules
2. Get OUTPUT_DIR from environment variables with error checking
3. Create new DXF document with ezdxf.new()
4. Get modelspace with doc.modelspace()
5. Add walls, doors, windows, and furniture
6. Save the file using doc.saveas(os.path.join(output_dir, 'floorplan.dxf'))

Original requirements:\n${context}

Generate the corrected Python code. The file must be saved to the OUTPUT_DIR directory.`;
  }

  // Get code from Llama model
  const response = await generateChatResponse(prompt);
  
  // Extract Python code
  const codeBlock = response.match(/```python\n([\s\S]*?)```/)?.[1];
  if (!codeBlock) {
    throw new Error('No valid Python code generated');
  }

  // Verify the code includes critical components
  const code = codeBlock.trim();
  const requiredComponents = [
    'import ezdxf',
    'import os',
    'os.environ.get(\'OUTPUT_DIR\')',
    'doc.saveas'
  ];

  const missingComponents = requiredComponents.filter(component => !code.includes(component));
  if (missingComponents.length > 0) {
    throw new Error(`Generated code is missing required components: ${missingComponents.join(', ')}`);
  }

  return code;
}

export async function POST(request) {
  try {
    const { message, context, generateFloorPlan, file } = await request.json();
    
    if (generateFloorPlan) {
      // Install ezdxf first
      await pythonExecutor.execute('import sys, subprocess\nsubprocess.check_call([sys.executable, "-m", "pip", "install", "ezdxf"])');
      
      let attemptCount = 0;
      let lastError = null;
      let result = null;

      while (attemptCount < MAX_RETRIES) {
          // Generate code with previous error feedback if any
          const code = await generateValidCode(context, lastError, attemptCount);
          console.log('Generated code:', code); // Debug log
          
          // Execute the code
          result = await pythonExecutor.execute(code);
          console.log('Execution result:', result); // Debug log
          
          // Check if a DXF file was actually generated
          const hasDxfFile = result.files?.some(f => f.name.toLowerCase().endsWith('.dxf'));
          console.log('DXF file generated:', hasDxfFile); // Debug log
          
          if (result.success && hasDxfFile) {
            break;
          }
          else {
            if (result.success) {
              lastError = "Code executed successfully but no DXF file was generated. Ensure the code saves to the OUTPUT_DIR directory.";
            }
            else {
              lastError = result.output;
            }
            console.log(`Attempt ${attemptCount + 1} failed:`, lastError);
          }
        
        attemptCount++;
        
        if (attemptCount === MAX_RETRIES && (!result?.success || !result.files?.some(f => f.name.toLowerCase().endsWith('.dxf')))) {
          throw new Error(`Failed to generate valid DXF file after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
        }
      }

      return NextResponse.json({ 
        executionResults: [result],
        attempts: attemptCount + 1
      });
    }
    
    // Regular chat message handling
    const response = await generateChatResponse(message, file);
    return NextResponse.json({ response });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}