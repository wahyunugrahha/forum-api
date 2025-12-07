class GetDetailThreadUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    await this._threadRepository.verifyThread(useCasePayload.thread_id);
    const threadData = await this._threadRepository.findThread(
      useCasePayload.thread_id
    );
    const commentData = await this._commentRepository.getThreadComments(
      useCasePayload.thread_id
    );
    const replyData = await this._replyRepository.getThreadReplies(
      useCasePayload.thread_id
    );

    threadData.comments = commentData.map((comment) => {
      const commentReplies = replyData
        .filter((reply) => reply.comment_id === comment.id)
        .map((reply) => ({
          id: reply.id,
          username: reply.username,
          date: reply.date,
          content: reply.is_deleted
            ? "**balasan telah dihapus**"
            : reply.content,
        }));

      return {
        id: comment.id,
        username: comment.username,
        date: comment.date,
        content: comment.is_deleted
          ? "**komentar telah dihapus**"
          : comment.content,
        replies: commentReplies,
      };
    });

    return threadData;
  }
}

module.exports = GetDetailThreadUseCase;
