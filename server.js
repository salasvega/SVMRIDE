import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/forms/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const formData = req.body;

    console.log(`\n=== Form Submission: ${type} ===`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Data:', JSON.stringify(formData, null, 2));
    console.log('=================================\n');

    await new Promise(resolve => setTimeout(resolve, 800));

    res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
      type,
    });
  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Form API server running on http://localhost:${PORT}`);
  console.log('Ready to receive form submissions...\n');
});
