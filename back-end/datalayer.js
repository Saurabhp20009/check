const puppeteer = require('puppeteer');

(async () => {
  // Launch a new browser instance
  const browser = await puppeteer.launch({ headless: false });
  
  // Open a new page
  const page = await browser.newPage();
  
  try {
    // Increase the navigation timeout to 60 seconds (60000 ms)
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for the page to load completely
    await page.waitForSelector('body');
    
    // Scroll down the page by 20%
    await page.evaluate(() => {
      const scrollHeight = document.body.scrollHeight;
      window.scrollBy(0, scrollHeight * 0.2);
    });

    console.log('Scrolled the page down by 20%');
    
    // Keep the browser open for a while to observe scrolling (for testing purposes)
    await new Promise(resolve => setTimeout(resolve, 10000));
  } catch (error) {
    console.error('Error during navigation:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
})();
