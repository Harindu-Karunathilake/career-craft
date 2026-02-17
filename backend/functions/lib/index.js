"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const auth_1 = require("./routes/auth");
dotenv.config();
const app = express();
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());
// Routes
app.use("/auth", auth_1.default);
app.use("/chat", require("./routes/chat").default);
app.use("/contact", require("./routes/contact").default);
app.use("/interview", require("./routes/interview").default);
app.use("/jobs", require("./routes/jobs").default);
app.use("/job-recommendations", require("./routes/job-recommendations").default);
app.use("/recommendations", require("./routes/recommendations").default);
app.use("/resumes", require("./routes/resumes").default);
app.use("/validate-role", require("./routes/validate-role").default);
// Export the Express app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map