require("dotenv").config();
const dns = require("dns");
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
    console.error("Could not set DNS servers:", e.message);
}
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}
const http = require("http");
const app = require("./app");
const { initSocket, io } = require("./socket");
require("./jobs/storyCleanup");

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

initSocket(server);
global.io = io;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
