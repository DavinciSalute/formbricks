import React, { useState } from "react";
import TestIframeComponent from "./TestIframeComponent";

const TestIframeContainer: React.FC = () => {
  const [url, setUrl] = useState<string>("http://localhost:3000/s/cm03xyp2k000o1i2eqgucnf1s");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Inserisci un URL per caricare l'iframe
      </h1>
      <input
        type="text"
        value={url}
        onChange={handleInputChange}
        placeholder="Inserisci un URL"
        style={{ width: "100%", padding: "8px", marginBottom: "16px" }}
      />
      {url && <TestIframeComponent url={url} />}
    </div>
  );
};

export default TestIframeContainer;
