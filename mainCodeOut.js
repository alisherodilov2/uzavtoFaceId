const puppeteer = require("puppeteer");
const connectDB = require("./connect");
const { User, sequelize } = require("./models");
const moment = require("moment");

// Custom delay function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const login = async (page, username, password) => {
  console.log("User Model:", User);
  const usernameSelector = "#username";
  const passwordSelector = "#password"; // Ensure this selector is correct
  const submitButtonSelector = "button.btn.btn-primary.login-btn";

  await page.waitForSelector(usernameSelector, { timeout: 5000 });
  await page.waitForSelector(passwordSelector, { timeout: 5000 });
  await page.waitForSelector(submitButtonSelector, { timeout: 5000 });

  await page.type(usernameSelector, username);
  await page.type(passwordSelector, password);
  await page.click(submitButtonSelector);

  await page.waitForNavigation({ waitUntil: "networkidle2" });
};

const extractTableData = async (page) => {
  await page.waitForSelector(".smart-table");
  await page.waitForFunction(
    () => {
      const tbody = document.querySelector(".smart-table tbody");
      return tbody && tbody.children.length > 0;
    },
    { timeout: 10000 }
  );

  const rows = await page.evaluate(() => {
    const table = document.querySelector(".smart-table");
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    return rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      const personId = cells[0]?.innerText.trim() || "";
      const name = cells[2]?.innerText.trim() || "";
      const cardNo = cells[1]?.innerText.trim() || "";
      const eventType = cells[4]?.innerText.trim() || "";
      const time = cells[5]?.innerText.trim() || "";

      return { personId, name, cardNo, eventType, time };
    });
  });
  for (const row of rows) {
    try {
      // Create the user record
      if (row.eventType == "Authenticated via Face") {
        const date = moment(row.time, "YYYY-MM-DD HH:mm:ss Z").toDate();

        await User.create({
          fullname: row.name,
          cardNo: row.cardNo,
          event: row.eventType,
          type: 0,
          time: date,
        });
      console.log("User created:", row);
        
      }

     
    } catch (err) {
      console.error("Error creating user:", err);
    }
  }

  return rows
    .map(
      (row) =>
        `${row.personId}, ${row.name}, ${row.cardNo}, ${row.eventType}, ${row.time}`
    )
    .join("\n");
};

const isNextPageDisabled = async (page) => {
  return await page.evaluate(() => {
    const nextPageButton = document.querySelector('li[ng-click="nextPage()"]');
    return nextPageButton && nextPageButton.classList.contains("disabled");
  });
};

const scrapeData = async (loginUrl, dataUrl, username, password) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(loginUrl, { waitUntil: "networkidle2" });
    await login(page, username, password);
    await page.goto(dataUrl, { waitUntil: "networkidle2" });

    let allTableData = "";

    while (true) {
      const tableData = await extractTableData(page);
      allTableData += tableData + "\n";

      if (await isNextPageDisabled(page)) {
        break;
      }

      await page.click('li[ng-click="nextPage()"] span');
      await delay(2000); // Wait for the next page to load
    }
    console.log("done");

    // console.log('Table Data:\n', allTableData);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeData };
