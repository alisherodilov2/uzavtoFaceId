const puppeteer = require("puppeteer");
const { User } = require("./models");
const moment = require("moment");

const enterScarperData = async (loginUrl) => {
  const allTableData = [];
  let hasNextPage = true;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 20,
    args: ["--ignore-certificate-errors"],
  });

  try {
    const page = await browser.newPage();

    // Navigate to the login page
    console.log(
      "Navigating to:",
      loginUrl
    );
    await page.goto(loginUrl, {
      waitUntil: "networkidle2",
    });

    // Login process
    await page.type('input[placeholder="User Name"]', "admin");
    await page.type('input[placeholder="Password"]', "1234567a");
    await page.click("button.login-btn");

    // Wait for the dashboard to load
    await page.waitForSelector("#app", { timeout: 8000 });

    // Wait for the "Event Search" navigation item to be rendered
    await page.waitForSelector('li[title="Event Search"]', { timeout: 8000 });

    // Click the "Event Search" navigation item
    await page.click('li[title="Event Search"]');

    // Wait for the table to load
    await page.waitForSelector("table.el-table__body", { timeout: 8000 });

    while (hasNextPage) {
      // Extract data from the current page
      const pageData = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll("table.el-table__body tbody tr")
        );
        return rows.map((row) => {
          const columns = Array.from(row.querySelectorAll("td"));
          return {
            id: columns[0]?.innerText.trim() || "",
            codeId: columns[1]?.innerText.trim() || "",
            name: columns[2]?.innerText.trim() || "",
            nom: columns[3]?.innerText.trim() || "",
            event: columns[4]?.innerText.trim() || "",
            created: columns[5]?.innerText.trim() || "",
          };
        });
      });

      allTableData.push(...pageData);

      // Save data to the database
      for (const data of pageData) {
          if (data.event == "Authenticated via Face") {
            const date = moment(data.created, "YYYY-MM-DD HH:mm:ss").toDate();
          await User.create({
            fullname: data.name,
            cardNo: data.codeId,
            event: data.event,
            type: 1,
            time: date,
          });
        }
      }

      // Check if there's a next page
      const nextButton = await page.$("button.btn-next");

      if (nextButton) {
        const isNextButtonDisabled = await page.evaluate(
          (button) => button.classList.contains("disabled"),
          nextButton
        );

        if (isNextButtonDisabled) {
          hasNextPage = false;
        } else {
          await nextButton.click();
          await wait(3000);
        }
      } else {
        hasNextPage = false;
      }
    }

    return allTableData;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  } finally {
    await browser.close();
  }
};

module.exports = { enterScarperData };
