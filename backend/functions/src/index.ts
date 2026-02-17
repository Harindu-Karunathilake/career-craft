import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();

// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/chat", require("./routes/chat").default);
app.use("/contact", require("./routes/contact").default);
app.use("/interview", require("./routes/interview").default);
app.use("/jobs", require("./routes/jobs").default);
app.use("/job-recommendations", require("./routes/job-recommendations").default);
app.use("/recommendations", require("./routes/recommendations").default);
app.use("/resumes", require("./routes/resumes").default);
app.use("/validate-role", require("./routes/validate-role").default);

// Export the Express app as a Firebase Cloud Function
export const api = functions.https.onRequest(app);

