// SMeS API: a JSON Server that exposes the data in db.json as a REST API.
// Routes are generated automatically from the top-level keys in db.json:
//   /schools, /students, /restaurants, /coupons, /redemptions
const jsonServer = require("json-server");

const server = jsonServer.create();
const router = jsonServer.router("db.json");
// Default middlewares: logger, static files, CORS and no-cache headers.
const middlewares = jsonServer.defaults();
const port = process.env.PORT || 3000;

server.use(middlewares);
server.use(router);

server.listen(port, () => {
  console.log(`SMeS API running on port ${port}`);
});
