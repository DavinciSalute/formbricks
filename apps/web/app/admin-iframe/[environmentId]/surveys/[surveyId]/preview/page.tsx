import { getServerSession } from "next-auth";
import { getActionClasses } from "@formbricks/lib/actionClass/service";
import { getAttributeClasses } from "@formbricks/lib/attributeClass/service";
import { authOptions } from "@formbricks/lib/authOptions";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getOrganizationByEnvironmentId } from "@formbricks/lib/organization/service";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getSurvey } from "@formbricks/lib/survey/service";
import { ErrorComponent } from "@formbricks/ui/ErrorComponent";
import { PreviewSurvey } from "@formbricks/ui/PreviewSurvey";

export const generateMetadata = async ({ params }) => {
  const survey = await getSurvey(params.surveyId);
  return {
    title: survey?.name ? `${survey?.name} | Editor` : "Editor",
  };
};

const Page = async ({ params }) => {
  const [survey, product, environment, actionClasses, attributeClasses, organization, session] =
    await Promise.all([
      getSurvey(params.surveyId),
      getProductByEnvironmentId(params.environmentId),
      getEnvironment(params.environmentId),
      getActionClasses(params.environmentId),
      getAttributeClasses(params.environmentId),
      getOrganizationByEnvironmentId(params.environmentId),
      getServerSession(authOptions),
    ]);

  if (!session) {
    throw new Error("Session not found");
  }

  if (!organization) {
    throw new Error("Organization not found");
  }

  if (!survey || !environment || !actionClasses || !attributeClasses || !product) {
    return <ErrorComponent />;
  }

  return (
    <>
      <PreviewSurvey
        survey={survey}
        questionId={null}
        product={product}
        environment={environment}
        previewType={survey.type === "app" || survey.type === "website" ? "modal" : "fullwidth"}
        languageCode={"default"}
        disableEditLogo
      />
    </>
  );
};

export default Page;
