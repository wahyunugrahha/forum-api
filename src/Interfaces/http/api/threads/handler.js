const AddThreadUseCase = require("../../../../Applications/use_case/AddThreadUseCase");

class ThreadsHandler {
  constructor(container) {
    this._container = container;

    this.postAddThreadHandler = this.postAddThreadHandler.bind(this);
    this.getThreadHandler = this.getThreadHandler.bind(this);
  }

  async postAddThreadHandler({ payload, auth }, h) {
    const useCasePayload = {
      title: payload.title,
      body: payload.body,
      owner: auth.credentials.id,
    };

    const addThreadUseCase = this._container.getInstance(AddThreadUseCase.name);
    const addedThread = await addThreadUseCase.execute(useCasePayload);

    const response = h.response({
      status: "success",
      message: "SUCCESS_ADDED_NEW_THREAD",
      data: {
        addedThread,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = ThreadsHandler;
