const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/generate_instructions', upload.array('screenshots'), async (req, res) => {
  try {
    console.log('Received request:', req.body);
    console.log('Files:', req.files);

    const { context } = req.body;
    const imageFiles = req.files;

    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Step 1: Read image files
    const imageContents = await Promise.all(
      imageFiles.map(async (file) => {
        const content = await fs.readFile(file.path);
        return {
          inlineData: {
            data: content.toString('base64'),
            mimeType: file.mimetype
          }
        };
      })
    );

    // Step 2: Prepare the prompt with the image data
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = [
      { text: `Generate detailed testing instructions for a digital product with the following format for each Output should describe a detailed, step-by-step guide on how to test each functionality. Each test case should include:
      Description: What the test case is about.
      Pre-conditions: What needs to be set up or ensured before testing.
      Testing Steps: Clear, step-by-step instructions on how to perform the test.
      Expected Result: What should happen if the feature works correctly. limit each prompt to 4 test cases each, based on the following context and images: Context: ${context}` },
      ...imageContents
    ];

    console.log('Sending prompt to Gemini:', JSON.stringify(prompt, null, 2));

    // Step 3: Call the model to generate content with the prompt
    const result = await model.generateContent(prompt);
    const generatedContent = await result.response;

    // Step 4: Return the generated content as a response
    res.json({
      instructions: generatedContent.text()
    });

    // Clean up: Remove uploaded files
    await Promise.all(imageFiles.map(file => fs.unlink(file.path)));

  } catch (error) {
    console.error('Error in generate_instructions:', error);
    res.status(500).json({ error: 'Error generating testing instructions: ' + error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});