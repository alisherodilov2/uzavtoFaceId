const express = require("express");
const app = express();
const { scrapeData } = require("./mainCodeOut");
const { enterScarperData } = require("./enterMainCode");
const port = 4000;
const { User } = require("./models"); // Adjust if you have `models/index.js` exporting User
const { Sequelize, Op } = require("sequelize");
app.use(express.json());

app.get("/items", async (req, res) => {
  const loginUrlFirst = "http://172.16.0.134/index.asp#/login";
  const loginUrlSecond = "http://172.16.0.135/index.asp#/login";

  // Replace with the actual URL to access the desired data
  const dataUrlFirst = "http://172.16.0.134/index.asp#/home/eventSearch";
  const dataUrlSecond = "http://172.16.0.135/index.asp#/home/eventSearch";

  // Replace with your actual username and password
  const username = "admin";
  const password = "1234567a";
  try {
    await enterScarperData("https://172.16.0.133/doc/index.html#/portal/login");
    await enterScarperData("https://172.16.0.132/doc/index.html#/portal/login");

    scrapeData(loginUrlFirst, dataUrlFirst, username, password);
    scrapeData(loginUrlSecond, dataUrlSecond, username, password);
    res.status(200).json({ message: "Data scraped successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/users", async (req, res) => {
  try {
    const latestUsers = await User.findAll({
      attributes: [
        "fullname",
        [Sequelize.fn("MAX", Sequelize.col("time")), "latestTime"],
      ],
      group: ["fullname"],
    });
    const latestTimes = latestUsers.map((user) => ({
      fullname: user.fullname,
      time: user.dataValues.latestTime,
    }));
    const users = await User.findAll({
      where: {
        [Op.or]: latestTimes.map((lt) => ({
          fullname: lt.fullname,
          time: lt.time,
        })),
      },
      order: [["time", "DESC"]],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/user/:id", async (req, res) => {
  const userId = req.params.id;
  const user = await User.findAll({
    where: {
      fullname: userId,
    },
  });
  res.send(user);
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
