const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // react-hooks/immutability (new in eslint-plugin-react-hooks v7, part of
    // the React Compiler-era ruleset) flags `sharedValue.value = x` as an
    // illegal hook-return mutation. That's Reanimated's actual public API
    // for driving animations, not a bug — this is a confirmed false positive
    // (see facebook/react#35167, #35158, #34776), so it's off project-wide
    // rather than working around correct Reanimated code.
    rules: {
      "react-hooks/immutability": "off",
    },
  },
];
