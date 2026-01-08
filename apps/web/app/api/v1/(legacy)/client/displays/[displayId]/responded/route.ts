import { responses } from "@/app/lib/api/response";
import { markDisplayRespondedLegacy } from "@formbricks/lib/display/service";

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse({}, true);
};

export const POST = async (
  _: Request,
  { params: asyncParams }: { params: Promise<{ displayId: string }> }
): Promise<Response> => {
  const params = await asyncParams;
  const { displayId } = params;

  if (!displayId) {
    return responses.badRequestResponse("Missing displayId");
  }

  try {
    await markDisplayRespondedLegacy(displayId);
    return responses.successResponse({}, true);
  } catch (error) {
    return responses.internalServerErrorResponse(error.message);
  }
};
