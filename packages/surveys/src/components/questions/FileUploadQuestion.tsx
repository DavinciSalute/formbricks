import { SubmitButton } from "@/components/buttons/SubmitButton";
import { Headline } from "@/components/general/Headline";
import { QuestionMedia } from "@/components/general/QuestionMedia";
import { ScrollableContainer } from "@/components/wrappers/ScrollableContainer";
import { t } from "@/lib/translate";
import { getUpdatedTtc, useTtc } from "@/lib/ttc";
import { useEffect, useState } from "preact/hooks";
import { getLocalizedValue } from "@formbricks/lib/i18n/utils";
import { TResponseData, TResponseTtc } from "@formbricks/types/responses";
import { TUploadFileConfig } from "@formbricks/types/storage";
import type { TSurveyFileUploadQuestion } from "@formbricks/types/surveys";
import { BackButton } from "../buttons/BackButton";
import { FileInput } from "../general/FileInput";
import { Subheader } from "../general/Subheader";

interface FileUploadQuestionProps {
  question: TSurveyFileUploadQuestion;
  value: string[];
  onChange: (responseData: TResponseData) => void;
  onSubmit: (data: TResponseData, ttc: TResponseTtc) => void;
  onBack: () => void;
  onFileUpload: (file: File, config?: TUploadFileConfig) => Promise<string>;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  surveyId: string;
  languageCode: string;
  ttc: TResponseTtc;
  setTtc: (ttc: TResponseTtc) => void;
  isInIframe: boolean;
  currentQuestionId: string;
}

export const FileUploadQuestion = ({
  question,
  value,
  onChange,
  onSubmit,
  onBack,
  isFirstQuestion,
  isLastQuestion,
  surveyId,
  onFileUpload,
  languageCode,
  ttc,
  setTtc,
  currentQuestionId,
}: FileUploadQuestionProps) => {
  const [startTime, setStartTime] = useState(performance.now());
  const isMediaAvailable = question.imageUrl || question.videoUrl;
  useTtc(question.id, ttc, setTtc, startTime, setStartTime, question.id === currentQuestionId);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (value && value.length > 0) {
      setError(null);
    }
  }, [value]);

  return (
    <form
      key={question.id}
      onSubmit={(e) => {
        e.preventDefault();
        const updatedTtcObj = getUpdatedTtc(ttc, question.id, performance.now() - startTime);
        setTtc(updatedTtcObj);
        if (question.required) {
          if (value && value.length > 0) {
            onSubmit({ [question.id]: value }, updatedTtcObj);
          } else {
            setError(t("question_input.error_file_required", languageCode));
          }
        } else {
          if (value) {
            onSubmit({ [question.id]: value }, updatedTtcObj);
          } else {
            onSubmit({ [question.id]: "skipped" }, updatedTtcObj);
          }
        }
      }}
      className="w-full ">
      <ScrollableContainer>
        <div>
          {isMediaAvailable && <QuestionMedia imgUrl={question.imageUrl} videoUrl={question.videoUrl} />}
          <Headline
            headline={getLocalizedValue(question.headline, languageCode)}
            questionId={question.id}
            required={question.required}
          />
          <Subheader
            subheader={question.subheader ? getLocalizedValue(question.subheader, languageCode) : ""}
            questionId={question.id}
          />
          <FileInput
            htmlFor={question.id}
            surveyId={surveyId}
            languageCode={languageCode}
            onError={setError}
            onFileUpload={onFileUpload}
            onUploadCallback={(urls: string[]) => {
              if (urls) {
                onChange({ [question.id]: urls });
              } else {
                onChange({ [question.id]: "skipped" });
              }
            }}
            fileUrls={value as string[]}
            allowMultipleFiles={question.allowMultipleFiles}
            {...(!!question.allowedFileExtensions
              ? { allowedFileExtensions: question.allowedFileExtensions }
              : {})}
            {...(!!question.maxSizeInMB ? { maxSizeInMB: question.maxSizeInMB } : {})}
          />
        </div>
      </ScrollableContainer>
      {error && <div className="mt-1 px-5 text-sm text-red-500">{error}</div>}
      <div className="flex w-full justify-between px-6 py-4">
        {!isFirstQuestion && (
          <BackButton
            backButtonLabel={getLocalizedValue(question.backButtonLabel, languageCode)}
            onClick={() => {
              onBack();
            }}
          />
        )}
        <div></div>
        <SubmitButton
          buttonLabel={getLocalizedValue(question.buttonLabel, languageCode)}
          isLastQuestion={isLastQuestion}
        />
      </div>
    </form>
  );
};
