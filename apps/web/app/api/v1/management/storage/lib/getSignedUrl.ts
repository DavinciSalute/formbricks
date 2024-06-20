import { responses } from "@/app/lib/api/response";
import { getUploadSignedUrl } from "@formbricks/lib/storage/service";

export const getSignedUrlForPublicFile = async (
  fileName: string,
  environmentId: string,
  fileType: string
) => {
  const accessType = "public"; // public files are accessible by anyone

  // if s3 is not configured, we'll upload to a local folder named uploads

  try {
    const signedUrlResponse = await getUploadSignedUrl(fileName, environmentId, fileType, accessType);

    console.log(`getSignedUrlForPublicFile OK:${JSON.stringify(signedUrlResponse)}`);

    return responses.successResponse({
      ...signedUrlResponse,
    });
  } catch (err) {
    console.log("getSignedUrlForPublicFile error");
    console.log(err);
    console.log(JSON.stringify(err));
    return responses.internalServerErrorResponse("Internal server error");
  }
};
