import isEqual from 'lodash/isEqual';
import { type DependencyList, type EffectCallback, useEffect, useRef, useState } from 'react';

const useDepEffect = (effect: EffectCallback, deps?: DependencyList) => {
  const [depChanged, setDepChanged] = useState(false);
  const isMounted = useRef(false);

  const depsRef = useRef(deps);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      if (depChanged) {
        return effect();
      }
    }
  }, [depChanged]);

  useEffect(() => {
    const changed = !isEqual(depsRef.current, deps);
    if (changed) {
      depsRef.current = deps;
    }
    setDepChanged(changed);
  }, [deps]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
};

export default useDepEffect;
