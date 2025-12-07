const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const AuthenticationsTableTestHelper = require("../../../../tests/AuthenticationsTableTestHelper");
const createServer = require("../createServer");
const container = require("../../container");
const ServerTestHelper = require("../../../../tests/ServerTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const pool = require("../../database/postgres/pool");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const RepliesTableTestHelper = require("../../../../tests/RepliesTableTestHelper");

describe("/replies endpoints", () => {
  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await RepliesTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when POST /threads/{thread_id}/comments/{comment_id}/replies", () => {
    it("should response 401 when not authenticated", async () => {
      const payload = {
        content: "123",
      };

      const server = await createServer(container);

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-123/comments/comment-123/replies",
        payload: payload,
      });

      expect(response.statusCode).toEqual(401);

      const result = JSON.parse(response.payload);
      expect(result.error).toEqual("Unauthorized");
      expect(result.message).toEqual("Missing authentication");
    });

    it("should response 400 when not meet property requirement", async () => {
      const payload = {};

      const server = await createServer(container);

      const { token } = await ServerTestHelper.getCredential(server);

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-123/comments/comment-123/replies",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(400);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual(
        "unable to post new reply due to uncomplete property"
      );
    });

    it("should response 400 when not meet data type requirement", async () => {
      const payload = {
        content: 9.0,
      };

      const server = await createServer(container);

      const { token } = await ServerTestHelper.getCredential(server);

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-8810/comments/comment-123/replies",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(400);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual(
        "unable to post new reply due to invalid data type"
      );
    });

    it("should response 404 when given invalid thread", async () => {
      const payload = {
        content: "1234567890",
      };

      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-123/comments/comment-123/replies",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(404);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual("Thread not found");
    });

    it("should response 404 when given invalid comment", async () => {
      const payload = {
        content: "1234567890",
      };

      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      await UsersTableTestHelper.addUser({
        id: "user-16989",
        username: "wellplay",
      });
      await ThreadsTableTestHelper.addThread({
        id: "thread-12",
        owner: "user-16989",
      });

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-12/comments/comment-123/replies",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(404);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual("Comment not found in this thread!");
    });

    it("should response 201 when meet all requirement and persist comment data", async () => {
      const payload = {
        content: "1234567890",
      };

      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      await UsersTableTestHelper.addUser({
        id: "user-6969",
        username: "test",
      });
      await ThreadsTableTestHelper.addThread({
        id: "thread-123",
        title: "test",
        owner: "user-6969",
      });
      await CommentsTableTestHelper.addComment({
        id: "comment-124",
        thread_id: "thread-123",
        owner: "user-6969",
      });

      const response = await server.inject({
        method: "POST",
        url: "/threads/thread-123/comments/comment-124/replies",
        payload: payload,
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(201);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("success");
      expect(result.message).toEqual("SUCCESS_ADDED_NEW_REPLY");
      expect(result.data.addedReply).toBeDefined();
    });
  });

  describe("when DELETE /threads/{thread_id}/comments/{comment_id}/replies/{reply_id}", () => {
    it("should response 403 when non owner try to delete", async () => {
      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      await CommentsTableTestHelper.addComment({
        id: "comment-6868",
        owner: "user-6969",
        thread_id: "thread-123",
        content: "ini adalah test",
      });

      await RepliesTableTestHelper.addReply({
        id: "reply-6868",
        owner: "user-6969",
        comment_id: "comment-6868",
        content: "ini adalah test",
        thread_id: "thread-123",
      });

      const response = await server.inject({
        method: "DELETE",
        url: "/threads/thread-123/comments/comment-6868/replies/reply-6868",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(403);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
      expect(result.message).toEqual("Your are not the owner of this reply!");
    });

    it("should response 404 when the comment or thread not valid", async () => {
      const server = await createServer(container);
      const { token } = await ServerTestHelper.getCredential(server);

      const response = await server.inject({
        method: "DELETE",
        url: "/threads/thread-123/comments/comment-12390/replies/reply-123",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(404);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("fail");
    });

    it("should response 200 when the comment successfully deleted", async () => {
      const server = await createServer(container);
      const { token, user_id } = await ServerTestHelper.getCredential(server);

      await CommentsTableTestHelper.addComment({
        id: "comment-169",
        owner: user_id,
        thread_id: "thread-123",
        content: "ini adalah test",
      });

      await RepliesTableTestHelper.addReply({
        id: "reply-1009",
        owner: user_id,
        comment_id: "comment-169",
        content: "ini adalah test",
        thread_id: "thread-123", 
      });

      const response = await server.inject({
        method: "DELETE",
        url: "/threads/thread-123/comments/comment-169/replies/reply-1009",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toEqual(200);

      const result = JSON.parse(response.payload);
      expect(result.status).toEqual("success");
    });
  });
});
