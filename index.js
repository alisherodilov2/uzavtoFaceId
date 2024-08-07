const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Replace with the actual login URL
  const loginUrl = 'http://172.16.0.134/index.asp#/login';

  // Navigate to the login page
  await page.goto(loginUrl, { waitUntil: 'networkidle2' });

  // Replace with the actual selectors for username, password, and submit button
  const usernameSelector = '#username';
  const passwordSelector = '#password'; // Ensure this selector is correct
  const submitButtonSelector = 'button.btn.btn-primary.login-btn';

  // Custom delay function
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // Wait for the username input to be available
    await page.waitForSelector(usernameSelector, { timeout: 5000 });
    await page.waitForSelector(passwordSelector, { timeout: 5000 });
    await page.waitForSelector(submitButtonSelector, { timeout: 5000 });

    // Replace with your actual username and password
    const username = 'admin';
    const password = '1234567a';

    // Enter username and password
    await page.type(usernameSelector, username);
    await page.type(passwordSelector, password);

    // Click the login button
    await page.click(submitButtonSelector);

    // Wait for navigation to complete after login
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Login successful');

    // Replace with the actual URL to access the desired data
    const dataUrl = 'http://172.16.0.134/index.asp#/home/eventSearch';

    // Navigate to the data page
    await page.goto(dataUrl, { waitUntil: 'networkidle2' });

    // Function to extract data from the current page
    const extractTableData = async () => {
      await page.waitForSelector('.smart-table');
      await page.waitForFunction(() => {
        const tbody = document.querySelector('.smart-table tbody');
        return tbody && tbody.children.length > 0;
      }, { timeout: 10000 });

      return await page.evaluate(() => {
        const table = document.querySelector('.smart-table');
        if (!table) return 'Table not found';
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          // get the data from the td
          const personId = cells[0]?.innerText.trim() || '';
          const name = cells[1]?.innerText.trim() || '';
          const cardNo = cells[2]?.innerText.trim() || '';
          const eventType = cells[3]?.innerText.trim() || '';
          const time = cells[4]?.innerText.trim() || '';
          return `${personId}, ${name}, ${cardNo}, ${eventType}, ${time}`;
        }).join('\n');  
      });
    };

    // Function to check if the "Next Page" button is disabled
    const isNextPageDisabled = async () => {
      return await page.evaluate(() => {
        const nextPageButton = document.querySelector('li[ng-click="nextPage()"]');
        return nextPageButton && nextPageButton.classList.contains('disabled');
      });
    };

    let allTableData = '';

    // Extract data from all pages
    while (true) {
      const tableData = await extractTableData();
      allTableData += tableData + '\n';

      if (await isNextPageDisabled()) {
        break;
      }

      // Click the "Next Page" button
      await page.click('li[ng-click="nextPage()"] span');
      await delay(2000); // Wait for the next page to load
    }

    // console.log('Table Data:\n', allTableData);

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
    await browser.close();
  }
})();
