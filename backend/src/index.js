import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./backend/.env",
});

const port = process.env.PORT || 8001;

connectDB()
  .then(() => {
    app.on("error", (error) => console.error(error));
    app.listen(port, () => {
      console.log(`App is Listening to ${port}`);
    });
  })
  .catch();
