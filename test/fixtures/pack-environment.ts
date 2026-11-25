export function packEnvironment(): NodeJS.ProcessEnv {
  // A publish dry run can export these settings to the tests it starts.
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/^(npm_config_dry_run|npm_lifecycle_.*)$/i.test(name))
  );
}
