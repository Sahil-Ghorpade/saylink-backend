require("dotenv").config();
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
