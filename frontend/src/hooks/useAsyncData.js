import { useEffect, useState } from "react";

export const useAsyncData = (loader, dependencies = []) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let active = true;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    loader()
      .then((data) => {
        if (active) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: null, loading: false, error });
        }
      });

    return () => {
      active = false;
    };
  }, dependencies);

  return state;
};
