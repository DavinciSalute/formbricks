import { getApiKeyDataOrFail, handleErrorResponse } from "@/app/api/v1/auth";
import { responses } from "@/app/lib/api/response";
import { transformErrorToDetails } from "@/app/lib/api/validator";
import { z } from "zod";
import { WEBAPP_URL } from "@formbricks/lib/constants";
import { createToken } from "@formbricks/lib/jwt";
import { getOrCreateAdminUserForOrganization } from "@formbricks/lib/user/service";
import { AuthenticationError, ValidationError, ValidationErrorWithDetails } from "@formbricks/types/errors";
import { fetchAndAuthorizeSurvey } from "../fetchAndAuthorizeSurvey";

const getValidatedInput = async (request: Request) => {
  let jsonInput;
  try {
    jsonInput = await request.json();
  } catch (error) {
    jsonInput = {};
  }

  const inputValidation = z
    .object({
      email: z
        .string()
        .min(1, { message: "This field has to be filled." })
        .email("This is not a valid email."),
    })
    .safeParse(jsonInput);

  if (!inputValidation.success) {
    throw new ValidationErrorWithDetails(
      "Fields are missing or incorrectly formatted",
      transformErrorToDetails(inputValidation.error)
    );
  }

  return inputValidation.data;
};

export const POST = async (
  request: Request,
  { params }: { params: { surveyId: string } }
): Promise<Response> => {
  try {
    const apiKeyData = await getApiKeyDataOrFail(request);
    const organizationId = apiKeyData.environment.product.organizationId;

    const inputData = await getValidatedInput(request);

    const survey = await fetchAndAuthorizeSurvey(apiKeyData, params.surveyId);
    if (!survey) {
      return responses.notFoundResponse("Survey", params.surveyId);
    }

    const user = await getOrCreateAdminUserForOrganization(inputData, organizationId);
    if (!user) {
      return responses.internalServerErrorResponse(
        `Failed to get or create admin user for organization with ID: ${organizationId}. ` +
          `Input data: ${JSON.stringify(inputData)}. Please verify the input and try again.`
      );
    }

    const authToken = createToken(user.id, user.email);
    const iframeEditUrl = `${WEBAPP_URL}/admin-iframe/${apiKeyData.environmentId}/surveys/${survey.id}/edit?token=${encodeURIComponent(authToken)}`;
    const iframePreviewUrl = `${WEBAPP_URL}/admin-iframe/${apiKeyData.environmentId}/surveys/${survey.id}/preview?token=${encodeURIComponent(authToken)}`;
    const iframeSummaryUrl = `${WEBAPP_URL}/admin-iframe/${apiKeyData.environmentId}/surveys/${survey.id}/summary?token=${encodeURIComponent(authToken)}`;

    const data = {
      iframeEditUrl,
      iframeSummaryUrl,
      iframePreviewUrl,
    };

    return responses.successResponse(data);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return responses.notAuthenticatedResponse();
    }
    if (error instanceof ValidationErrorWithDetails) {
      return responses.badRequestResponse(error.message, error.details, true);
    }

    if (error instanceof ValidationError) {
      return responses.badRequestResponse(error.message, undefined, true);
    }
    return handleErrorResponse(error);
  }
};
