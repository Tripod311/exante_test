import crypto from "crypto";
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import AgentManager from "./agents/manager.js";
import createProvider from "./providers/factory.js";
class API {
    config;
    instance;
    providers = {};
    server;
    constructor(config) {
        this.config = config;
        this.instance = express();
        this.attachHandlers();
        this.createProviders();
    }
    attachHandlers() {
        this.instance.use(cors());
        this.instance.use(express.json({ limit: "1mb" }));
        this.instance.get("/api/agents", this.listAgents.bind(this));
        this.instance.post("/api/agent/:type/spawn", this.spawnAgent.bind(this));
        this.instance.post("/api/chat/:id/start", this.startDialog.bind(this));
        this.instance.post("/api/chat/:id/finish", this.finishDialog.bind(this));
        this.instance.get("/api/chat/:id/state", this.loadState.bind(this));
        this.instance.post("/api/chat/:id/message", this.processMessage.bind(this));
        this.instance.get("/api/chat/:id/report", this.getReport.bind(this));
        this.instance.use(express.static(this.config.client_dir));
        this.instance.use((req, res) => {
            const client_dir = path.resolve(this.config.client_dir);
            res.sendFile(path.join(client_dir, "index.html"));
        });
    }
    createProviders() {
        for (const name in this.config.providers) {
            this.providers[name] = createProvider(name, this.config.providers[name]);
        }
    }
    start() {
        const server = this.instance.listen(this.config.port, () => {
            console.log(`Listening on ${this.config.port}`);
        });
    }
    async stop() {
        if (!this.server)
            return;
        const server = this.server;
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                server.closeAllConnections();
            }, 5000);
            server.close(err => {
                clearTimeout(timeout);
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
            server.closeIdleConnections();
        });
    }
    // API
    async listAgents(req, res) {
        try {
            res.json({
                error: false,
                data: await AgentManager.listAgents()
            });
        }
        catch (err) {
            res.json({
                error: true,
                details: err.toString()
            });
        }
    }
    async spawnAgent(req, res) {
        try {
            const id = await AgentManager.spawnAgent(this.providers, req.params.type);
            res.json({
                error: false,
                data: id
            });
        }
        catch (err) {
            res.json({
                error: true,
                details: err
            });
        }
    }
    startDialog(req, res) {
        try {
            AgentManager.startDialog(req.params.id);
            res.json({ error: false });
        }
        catch (err) {
            res.json({
                error: true,
                details: err.toString()
            });
        }
    }
    finishDialog(req, res) {
        try {
            AgentManager.finishDialog(req.params.id);
            res.json({ error: false });
        }
        catch (err) {
            res.json({
                error: true,
                details: err.toString()
            });
        }
    }
    loadState(req, res) {
        try {
            res.json({
                error: false,
                data: AgentManager.loadState(req.params.id)
            });
        }
        catch (err) {
            res.json({
                error: true,
                details: err.toString()
            });
        }
    }
    async processMessage(req, res) {
        try {
            res.json({
                error: false,
                data: await AgentManager.processMessage(req.params.id, req.body.message)
            });
        }
        catch (err) {
            console.log(`Chat ${req.params.id}, message processing error: ${err}`);
            res.json({
                error: true,
                details: err.toString()
            });
        }
    }
    async getReport(req, res) {
    }
}
let config;
try {
    const file = fs.readFileSync("./configuration.json", "utf-8");
    config = JSON.parse(file);
}
catch (err) {
    console.error(`Startup error: ${err}`);
    process.exit(1);
}
const api = new API(config);
let shuttingDown = false;
async function shutdown() {
    if (shuttingDown)
        return;
    shuttingDown = true;
    try {
        await api.stop();
        process.exit(0);
    }
    catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
    }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
AgentManager.setup(config.reports_dir, config.agents_dir).then(() => {
    api.start();
}, (err) => {
    console.error(`Agent manager couldn't start: ${err}`);
    process.exit(1);
});
//# sourceMappingURL=main.js.map