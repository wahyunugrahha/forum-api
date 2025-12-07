const ThreadRepositoryPostgres = require("../ThreadRepositoryPostgres");
const pool = require("../../database/postgres/pool");
const NewThread = require("../../../Domains/threads/entities/NewThread");
const AddedThread = require("../../../Domains/threads/entities/AddedThread");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const UserTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const GetThread = require("../../../Domains/threads/entities/GetThread");
const NotFoundError = require("../../../Commons/exceptions/NotFoundError");

describe("ThreadRepositoryPostgres", () => {
  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UserTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("add thread function", () => {
    it("should persist new thread and return added thread correctly", async () => {
      const owner = "user-123";
      await UserTableTestHelper.addUser({ id: owner });

      const newThread = new NewThread({
        title: "123",
        body: "this is testing data",
        owner: owner,
      });

      const fakeGenerator = () => "123";

      const threadRepository = new ThreadRepositoryPostgres(
        pool,
        fakeGenerator
      );

      const result = await threadRepository.addThread(newThread);
      expect(result).toStrictEqual(
        new AddedThread({
          id: "thread-123",
          title: "123",
          owner: "user-123",
        })
      );

      const expected = await ThreadsTableTestHelper.findThread("thread-123");
      expect(expected).toHaveLength(1);
    });
  });

  describe("verify thread function", () => {
    it("should throw error 404 when thread not found", async () => {
      const threadRepository = new ThreadRepositoryPostgres(pool, {});

      expect(threadRepository.verifyThread("thread-123")).rejects.toThrowError(
        NotFoundError
      );
    });

    it("should not throw error 404 when thread found", async () => {
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      await UserTableTestHelper.addUser({
        id: "user-123",
        username: "pokemon",
      });
      await ThreadsTableTestHelper.addThread({
        id: "thread-123",
        title: "dicoding testing",
        body: "cuman testing doang",
        owner: "user-123",
      });

      await expect(
        threadRepository.verifyThread("thread-123")
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe("find thread function", () => {
    it("should return correcly when thread found", async () => {
      const threadRepository = new ThreadRepositoryPostgres(pool, {});
      await UserTableTestHelper.addUser({
        id: "user-123",
        username: "pokemon",
      });

      await ThreadsTableTestHelper.addThread({
        id: "thread-123",
        title: "dicoding testing",
        body: "cuman testing doang",
        owner: "user-123",
      });

      const result = await threadRepository.findThread("thread-123");

      const expectedResult = new GetThread({
        id: "thread-123",
        title: "dicoding testing",
        body: "cuman testing doang",
        date: new Date("2024-10-26T00:00:00.000Z"),
        username: "pokemon",
        comments: [],
      });
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
