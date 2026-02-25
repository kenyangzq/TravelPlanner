import { useState, useEffect } from "react";

interface VersionResponse {
  version: string;
}

export function useVersion() {
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    fetch("/api/version")
      .then((res) => res.json())
      .then((data: VersionResponse) => setVersion(data.version))
      .catch(() => setVersion(""));
  }, []);

  return version;
}
