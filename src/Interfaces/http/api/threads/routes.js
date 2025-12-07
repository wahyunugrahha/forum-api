const routes = (handler) => [
  {
    method: "POST",
    path: "/threads",
    handler: handler.postAddThreadHandler,
    options: {
      auth: "forumapi_jwt",
    },
  },
];

module.exports = routes;
