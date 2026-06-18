const { withPodfile } = require("@expo/config-plugins");

module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    const marker = "use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']";
    const addition = "\n  pod 'GoogleUtilities', :modular_headers => true\n  pod 'RecaptchaInterop', :modular_headers => true";

    if (!contents.includes("GoogleUtilities', :modular_headers")) {
      config.modResults.contents = contents.replace(marker, marker + addition);
    }
    return config;
  });
};
