const express = require("express");
const userRouter = require("./routes/userRoutes");

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Utthan API running",
  });
});

app.use("/api/users", userRouter);

module.exports = app;
