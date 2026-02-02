// test-function.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple test image (1x1 pixel red JPEG in base64)
const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';

async function testExtractFunction() {
  console.log('Testing claude-extract function...\n');
  
  try {
    // Import the function
    const modulePath = join(__dirname, 'netlify', 'functions', 'claude-extract.js');
    const { default: handler } = await import(modulePath);
    
    // Create a mock request
    const mockRequest = {
      method: 'POST',
      json: async () => ({
        imageBase64: testImageBase64
      })
    };
    
    const mockContext = {};
    
    console.log('Calling extract function...');
    const response = await handler(mockRequest, mockContext);
    
    console.log('Status:', response.status);
    
    const bodyText = await response.text();
    console.log('Response body:', bodyText);
    
    if (response.status === 200) {
      const data = JSON.parse(bodyText);
      if (data.success) {
        console.log('\n✅ SUCCESS! Function is working correctly');
        console.log('Extracted data:', JSON.stringify(data.data, null, 2));
        console.log('Usage:', JSON.stringify(data.usage, null, 2));
      } else {
        console.log('\n❌ Function returned success=false');
      }
    } else {
      console.log('\n❌ Function returned error status');
    }
    
  } catch (error) {
    console.error('\n❌ Error testing function:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testExtractFunction();
