const CommentRepository = require("../../../Domains/comments/CommentRepository");
const GetComment = require("../../../Domains/comments/entities/GetComment");
const GetReply = require("../../../Domains/replies/entities/GetReply");
const ReplyRepository = require("../../../Domains/replies/ReplyRepository");
const GetThread = require("../../../Domains/threads/entities/GetThread");
const ThreadRepository = require("../../../Domains/threads/ThreadRepository");
const comments = require("../../../Interfaces/http/api/comments");
const GetDetailThreadUseCase = require("../GetDetailThreadUseCase");

describe("GetDetailThreadUseCase", () => {
  it("should orchestrating the get thread detail action correctly", async () => {
    const payload = {
      thread_id: "thread-123",
    };

    const mockThreadRepository = new ThreadRepository();
    mockThreadRepository.verifyThread = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockThreadRepository.findThread = jest.fn().mockImplementation(() => {
      return new GetThread({
        id: "thread-123",
        title: "thread 123",
        body: "contect of thread 123",
        date: new Date("2024-10-26T00:00:00Z"),
        username: "jono",
        comments: [],
      });
    });

    const mockCommentRepository = new CommentRepository();
    mockCommentRepository.getThreadComments = jest
      .fn()
      .mockImplementation(() => {
        return [
          new GetComment({
            id: "comment-123",
            content: "123 comment",
            username: "pokemon",
            date: new Date("2024-10-26T00:00:00Z"),
            is_deleted: true,
          }),
          new GetComment({
            id: "comment-231",
            content: "231 comment",
            username: "digimon",
            date: new Date("2024-10-26T00:00:00Z"),
            is_deleted: false,
          }),
        ];
      });

    const mockReplyRepository = new ReplyRepository();
    mockReplyRepository.getThreadReplies = jest.fn().mockImplementation(() => {
      return [
        new GetReply({
          id: "reply-123",
          comment_id: "comment-231",
          content: "123 reply",
          username: "pokemon",
          date: new Date("2024-10-26T00:00:00Z"),
          is_deleted: true,
        }),
        new GetReply({
          id: "reply-693",
          comment_id: "comment-231",
          content: "693 reply",
          username: "pokemon2",
          date: new Date("2024-10-26T00:00:00Z"),
          is_deleted: false,
        }),
      ];
    });

    const getDetailThreadUseCase = new GetDetailThreadUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    const result = await getDetailThreadUseCase.execute(payload);

    expect(result).toEqual(
      new GetThread({
        id: "thread-123",
        title: "thread 123",
        body: "contect of thread 123",
        date: new Date("2024-10-26T00:00:00Z"),
        username: "jono",
        comments: [
          {
            id: "comment-123",
            username: "pokemon",
            date: new Date("2024-10-26T00:00:00Z"),
            content: "**komentar telah dihapus**",
            replies: [],
          },
          {
            id: "comment-231",
            username: "digimon",
            date: new Date("2024-10-26T00:00:00Z"),
            content: "231 comment",
            replies: [
              {
                id: "reply-123",
                username: "pokemon",
                date: new Date("2024-10-26T00:00:00Z"),
                content: "**balasan telah dihapus**",
              },
              {
                id: "reply-693",
                username: "pokemon2",
                date: new Date("2024-10-26T00:00:00Z"),
                content: "693 reply",
              },
            ],
          },
        ],
      })
    );

    expect(mockThreadRepository.verifyThread).toBeCalledWith(payload.thread_id);
    expect(mockThreadRepository.findThread).toBeCalledWith(payload.thread_id);
    expect(mockCommentRepository.getThreadComments).toBeCalledWith(
      payload.thread_id
    );
    expect(mockReplyRepository.getThreadReplies).toBeCalledWith(
      payload.thread_id
    );
  });
});
