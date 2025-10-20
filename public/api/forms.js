export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    console.log('Form submission received:', {
      endpoint: req.url,
      timestamp: new Date().toISOString(),
      data: formData,
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
