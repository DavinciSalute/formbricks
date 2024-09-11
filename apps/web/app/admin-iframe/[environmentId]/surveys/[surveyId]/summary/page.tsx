import { SummaryPage } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SummaryPage";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { getAttributeClasses } from "@formbricks/lib/attributeClass/service";
import { authOptions } from "@formbricks/lib/authOptions";
import { WEBAPP_URL } from "@formbricks/lib/constants";
import { getEnvironment } from "@formbricks/lib/environment/service";
import { getOrganizationByEnvironmentId } from "@formbricks/lib/organization/service";
import { getProductByEnvironmentId } from "@formbricks/lib/product/service";
import { getResponseCountBySurveyId } from "@formbricks/lib/response/service";
import { getSurvey } from "@formbricks/lib/survey/service";
import { getUser } from "@formbricks/lib/user/service";
import { PageContentWrapper } from "@formbricks/ui/PageContentWrapper";

const Page = async ({ params }) => {
  const session = await getServerSession(authOptions);
  if (!session) {
    throw new Error("Unauthorized");
  }

  const surveyId = params.surveyId;

  if (!surveyId) {
    return notFound();
  }

  const [survey, environment, attributeClasses] = await Promise.all([
    getSurvey(params.surveyId),
    getEnvironment(params.environmentId),
    getAttributeClasses(params.environmentId),
  ]);
  if (!environment) {
    throw new Error("Environment not found");
  }
  if (!survey) {
    throw new Error("Survey not found");
  }

  const product = await getProductByEnvironmentId(environment.id);
  if (!product) {
    throw new Error("Product not found");
  }

  const user = await getUser(session.user.id);
  if (!user) {
    throw new Error("User not found");
  }

  const organization = await getOrganizationByEnvironmentId(params.environmentId);

  if (!organization) {
    throw new Error("Organization not found");
  }
  const totalResponseCount = await getResponseCountBySurveyId(params.surveyId);

  return (
    <PageContentWrapper>
      <SummaryPage
        environment={environment}
        survey={survey}
        surveyId={params.surveyId}
        webAppUrl={WEBAPP_URL}
        user={user}
        totalResponseCount={totalResponseCount}
        attributeClasses={attributeClasses}
      />
    </PageContentWrapper>
  );
};

export default Page;