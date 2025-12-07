const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const AuthenticationsTableTestHelper = require("../../../../tests/AuthenticationsTableTestHelper");
const createServer = require("../createServer");
const container = require("../../container");
const ServerTestHelper = require("../../../../tests/ServerTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const pool = require("../../database/postgres/pool");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");

describe("/threads endpoints", () => {
  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when POST /threads", () => {
    it("should response 401 when not authenticated", async () => {
      const payload = {
        title: "123",
        body: "123",
      };

      const server = await createServer(container);

      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: payload,
      });

      expect(response.statusCode).toEqual(401);

      const result = JSON.parse(response.payload);
      expect(result.error).toEqual("Unauthorized");
      expect(result.message).toEqual("Missing authentication");
    });

    if (
      ("should response 400 when not meet property requirement",
      async () => {
        const payload = {
          title: "123",
        };

        const server = await createServer(container);

        const { token } = await ServerTestHelper.getCredential(server);

        const response = await server.inject({
          method: "POST",
          url: "/threads",
          payload: payload,
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toEqual(400);

        const result = JSON.parse(response.payload);
        expect(result.status).toEqual("fail");
        expect(result.message).toEqual(
          "unable to create new thread due to uncomplete property"
        );
      })
    );

    if (
      ("should response 400 when not meet data type requirement",
      async () => {
        const payload = {
          title: "123",
          body: 9.0,
        };

        const server = await createServer(container);

        const { token } = await ServerTestHelper.getCredential(server);

        const response = await server.inject({
          method: "POST",
          url: "/threads",
          payload: payload,
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        expect(response.statusCode).toEqual(400);

        const result = JSON.parse(response.payload);
        expect(result.status).toEqual("fail");
        expect(result.message).toEqual(
          "unable to create new thread due to invalid data type"
        );
      })
    );

    it("should response 201 when meet all requirement and persist thread data", async () => {
      const payload = {
        title: "123",
        body: "1234567890",
      };

      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(201);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("success");
      expect(result.message).toEqual("SUCCESS_ADDED_NEW_THREAD");
      expect(result.data.addedThread).toBeDefined();
    });
  });

  describe("when GET /threads/{thread_id}", () => {
    it("should response 404 when thread not found", async () => {
      const server = await createServer(container);

      const response = await server.inject({
        method: "GET",
        url: "/threads/thread-123469",
      });

      expect(response.statusCode).toEqual(404);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual("Thread not found");
    });

    it("should response 200 and return thread when not logged in", async () => {
      const server = await createServer(container);

      await UsersTableTestHelper.addUser({
        id: "user-919",
        username: "Okarun",
      });
      await ThreadsTableTestHelper.addThread({
        id: "thread-123",
        owner: "user-919",
      });

      const response = await server.inject({
        method: "GET",
        url: "/threads/thread-123",
      });

      expect(response.statusCode).toEqual(200);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("success");
      expect(result.data.thread).toBeDefined();
    });

    it("should response 200 and return thread and the details", async () => {
      const server = await createServer(container);

      await UsersTableTestHelper.addUser({
        id: "user-99",
        username: "ayase momo",
      });
      await ThreadsTableTestHelper.addThread({
        id: "thread-169",
        owner: "user-99",
      });
      await CommentsTableTestHelper.addComment({
        id: "comment-1",
        thread_id: "thread-169",
        owner: "user-99",
      });

      const response = await server.inject({
        method: "GET",
        url: "/threads/thread-169",
      });

      expect(response.statusCode).toEqual(200);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("success");
      expect(result.data.thread).toBeDefined();
      expect(result.data.thread.comments).toBeDefined();
    });
  });
});
