import { TResponseUpdate } from "@formbricks/types/responses";

export class SurveyState {
  responseId: string | null = null;
  displayId: string | null = null;
  userId: string | null = null;
  surveyId: string;
  responseAcc: TResponseUpdate = { finished: false, data: {}, ttc: {} };
  singleUseId: string | null;

  constructor(
    surveyId: string,
    singleUseId?: string | null,
    responseId?: string | null,
    userId?: string | null
  ) {
    this.surveyId = surveyId;
    this.userId = userId ?? null;
    this.singleUseId = singleUseId ?? null;
    this.responseId = responseId ?? null;
  }

  /**
   * Set the current survey ID
   * @param id - The survey ID
   */
  setSurveyId(id: string) {
    window.parent.postMessage({ type: "SurveyState.setSurveyId", data: { id } }, "*");
    this.surveyId = id;
    this.clear(); // Reset the state when setting a new surveyId
  }
  /**
   * Get a copy of the current state
   */
  copy() {
    const copyInstance = new SurveyState(
      this.surveyId,
      this.singleUseId ?? undefined,
      this.responseId ?? undefined,
      this.userId ?? undefined
    );
    copyInstance.responseId = this.responseId;
    copyInstance.responseAcc = this.responseAcc;
    return copyInstance;
  }

  /**
   * Update the response ID after a successful response creation
   * @param id - The response ID
   */
  updateResponseId(id: string) {
    window.parent.postMessage({ type: "SurveyState.updateResponseId", data: { id } }, "*");
    this.responseId = id;
  }

  /**
   * Update the response ID after a successful response creation
   * @param id - The response ID
   */
  updateDisplayId(id: string) {
    window.parent.postMessage({ type: "SurveyState.updateDisplayId", data: { id } }, "*");
    this.displayId = id;
  }

  /**
   * Update the user ID
   * @param id - The user ID
   */
  updateUserId(id: string) {
    window.parent.postMessage({ type: "SurveyState.updateUserId", data: { id } }, "*");
    this.userId = id;
  }

  /**
   * Accumulate the responses
   * @param responseUpdate - The new response data to add
   */
  accumulateResponse(responseUpdate: TResponseUpdate) {
    this.responseAcc = {
      finished: responseUpdate.finished,
      ttc: responseUpdate.ttc,
      data: { ...this.responseAcc.data, ...responseUpdate.data },
    };

    window.parent.postMessage(
      {
        type: "SurveyState.accumulateResponse",
        data: { responseId: this.responseId, responses: this.responseAcc },
      },
      "*"
    );
  }

  /**
   * Check if the current accumulated response is finished
   */
  isResponseFinished() {
    return this.responseAcc.finished;
  }

  /**
   * Clear the current state
   */
  clear() {
    window.parent.postMessage({ type: "SurveyState.clear" }, "*");
    this.responseId = null;
    this.responseAcc = { finished: false, data: {}, ttc: {} };
  }
}
