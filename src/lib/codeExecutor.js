// src/lib/codeExecutor.js
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';

class PythonExecutor {
  async createTempFile(code) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'buildbot-'));
    const filePath = path.join(tmpDir, `${uuidv4()}.py`);
    await fs.writeFile(filePath, code);
    return { filePath, tmpDir };
  }

  async execute(code) {
    const { filePath, tmpDir } = await this.createTempFile(code);
    let output = [];
    
    try {
      const result = await new Promise((resolve, reject) => {
        const python = spawn('python3', [filePath], {
          env: { ...process.env, OUTPUT_DIR: tmpDir }
        });
        let outputData = '';
        let errorData = '';

        python.stdout.on('data', (data) => {
          const message = data.toString();
          outputData += message;
          output.push({ type: 'log', message });
        });

        python.stderr.on('data', (data) => {
          const message = data.toString();
          errorData += message;
          output.push({ type: 'error', message });
        });

        python.on('close', async (code) => {
          if (code === 0) {
            try {
              const files = await fs.readdir(tmpDir);
              console.log(files);
              const generatedFiles = await Promise.all(
                files
                  .filter(file => file !== path.basename(filePath))
                  .map(async (file) => {
                    const filePath = path.join(tmpDir, file);
                    const stats = await fs.stat(filePath);
                    const fileContent = await fs.readFile(filePath);
                    const fileType = path.extname(file).toLowerCase();
                    const isImage = ['.png', '.jpg', '.jpeg', '.gif'].includes(fileType);
                    
                    // Convert buffer to base64 string
                    const base64Data = fileContent.toString('base64');
                    console.log(filePath);
                    return {
                      name: file,
                      type: fileType,
                      size: stats.size,
                      data: base64Data,
                      isImage: isImage,
                      mimeType: isImage ? `image/${fileType.slice(1)}` : 'text/plain'
                    };
                  })
              );
              console.log(generatedFiles);

              resolve({
                stdout: outputData,
                files: generatedFiles
              });
            } catch (error) {
              reject(new Error(`Error processing generated files: ${error.message}`));
            }
          } else {
            reject(new Error(errorData || 'Python execution failed'));
          }
        });
      });

      return {
        success: true,
        result: result.stdout.trim(),
        files: result.files,
        output
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        output
      };
    } finally {
      // Clean up temporary directory and all files
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(console.error);
    }
  }
}

export const pythonExecutor = new PythonExecutor();