import { useEffect, useState } from "react";
import formbricks from "@formbricks/js/website";
import { SurveySwitch } from "../../components/SurveySwitch";
import TestIframeContainer from "../../components/TestIframeContainer";

declare const window: any;

const TestIframePage = ({}) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="h-screen bg-white px-12 py-6 dark:bg-slate-800">
      <div className="flex flex-col items-center justify-between md:flex-row">
        <div className="flex items-center gap-2">
          <SurveySwitch value="website" formbricks={formbricks} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Formbricks Website Survey Demo App
            </h1>
            <p className="text-slate-700 dark:text-slate-300">
              This app helps you test your app surveys. You can create and test user actions, create and
              update user attributes, etc.
            </p>
          </div>
        </div>

        <button
          className="mt-2 rounded-lg bg-slate-200 px-6 py-1 dark:bg-slate-700 dark:text-slate-100"
          onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
        </button>
      </div>

      <TestIframeContainer />
    </div>
  );
};

export default TestIframePage;
