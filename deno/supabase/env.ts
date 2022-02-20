import { configAsync } from "./deps.ts";

// Only defined after first call to loadEnv() function in entry point
var env: any = null;

export async function loadEnv() {
  if (env) {
    return env;
  }

  const shellenv: any = Deno.env.toObject();
  const options: any = {
    safe: true,
  }

  // Support overriding the location of the .env file via environment variable
  if (shellenv.ENV_PATH) {
    options.path = shellenv.ENV_PATH;
    //console.log(`Loading .env from "${options.path}" ...`);
  }
  env = await configAsync(options);

  // Support overriding/setting key values from environment variable
  if (shellenv.LOGGING_LEVEL) {
    env['LOGGING_LEVEL'] = shellenv.LOGGING_LEVEL;
  }

  if (shellenv.DB_HOST) {
    env['DB_HOST'] = shellenv.DB_HOST;
  }
  
  if (shellenv.DB_PASSWORD) {
    env['DB_PASSWORD'] = shellenv.DB_PASSWORD;
  }

  if (shellenv.DB_PORT) {
    env['DB_PORT'] = shellenv.DB_PORT;
  }

  if (shellenv.DB_CERT) {
    env['DB_CERT'] = shellenv.DB_CERT;
  }

  console.log(env);

  //console.log(shellenv);
  // e.g. with Deno Deploy (along w/ any defined environment variables)
  //DENO_DEPLOYMENT_ID: "5wh3330ngcy0",
  //DENO_REGION: "northamerica-northeast2"

  return env;
}