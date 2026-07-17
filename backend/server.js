const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PWD);
mongoose
  .connect(DB)
  .then(() => {
    console.log("DB Connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

const port = process.env.PORT || 8001;
const server = app.listen(port, () => {
  console.log(`App running on port ${port} `);
});
