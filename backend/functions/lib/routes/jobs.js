"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const node_fetch_1 = require("node-fetch");
const router = (0, express_1.Router)();
router.get("/", async (req, res) => {
    try {
        const { search, location, sort_by, page, remote } = req.query;
        const apiKey = process.env.FINDWORK_API_KEY;
        if (!apiKey) {
            res.status(500).json({ error: "Server Configuration Error: Missing Jobs API Key" });
            return;
        }
        const apiUrl = new URL("https://findwork.dev/api/jobs/");
        if (search)
            apiUrl.searchParams.set("search", String(search));
        if (location)
            apiUrl.searchParams.set("location", String(location));
        if (sort_by)
            apiUrl.searchParams.set("sort_by", String(sort_by));
        if (page)
            apiUrl.searchParams.set("page", String(page));
        if (remote === "true")
            apiUrl.searchParams.set("remote", "true");
        const response = await (0, node_fetch_1.default)(apiUrl.toString(), {
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Jobs API Error:", response.status, errorText);
            res.status(response.status).json({ error: `External API Error: ${response.statusText}` });
            return;
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error("Jobs Proxy Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map