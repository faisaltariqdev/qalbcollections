/**
 * Production HTTP entry for cPanel / Phusion Passenger.
 *
 * cPanel "Setup Node.js App" does not run `next start`. Point the
 * Application startup file at this script instead.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  if (typeof PhusionPassenger !== "undefined") {
    PhusionPassenger.configure({ autoInstall: false });
    server.listen("passenger");
    return;
  }

  server.listen(port, () => {
    console.log(`Qalb Collections ready on port ${port}`);
  });
});
