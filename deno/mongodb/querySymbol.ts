import { configAsync } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Bson, MongoClient } from "https://deno.land/x/mongo@v0.29.2/mod.ts";
import { timeAgo } from "https://deno.land/x/time_ago@v1/mod.ts";

// Load .env file
const shellenv: any = Deno.env.toObject();
const configOptions: any = {
  safe: true,
}
if (shellenv.ENV_PATH) {
  configOptions.path = shellenv.ENV_PATH;
}
const env = await configAsync(configOptions);

// Connecting to a local Mongo Database
const MONGO_URI = Deno.env.get("MONGO_URI") ?? env.MONGO_URI;

if (!MONGO_URI && (!env.MONGO_HOST || !env.MONGO_USER || !env.MONGO_PASSWORD)) throw new Error("MONGO_URI not found");

const deploymentTime = Date.now();
const client = new MongoClient();

// Connecting to a Mongo Atlas Database
let options = MONGO_URI ?? {
  db: env.MONGO_DB ?? "Cluster0",
  tls: true,
  servers: [
    {
      host: env.MONGO_HOST2 ?? env.MONGO_HOST,
      port: env.MONGO_PORT ?? 27017,
    },
    {
      host: env.MONGO_HOST1 ?? env.MONGO_HOST,
      port: env.MONGO_PORT ?? 27017,
    },
    {
      host: env.MONGO_HOST3 ?? env.MONGO_HOST,
      port: env.MONGO_PORT ?? 27017,
    },
  ],
  credential: {
    username: env.MONGO_USER,
    password: env.MONGO_PASSWORD,
    db: env.MONGO_DB ?? "Cluster0",
    mechanism: env.MONGO_AUTH ?? "SCRAM-SHA-1",
  },
};

try {
  console.log("Connecting to MongoDB...");
  await client.connect(options);
} catch (err) {
  console.error("Error connecting to MongoDB", err);
  throw err;
}

interface Symbol {
  _id: Bson.ObjectId;
  code: string;
  name: string;
}

const collection = client.database().collection<Symbol>("symbols");

const getSymbols = async () => {
  try {
    const symbols = await collection
      .find({}, { noCursorTimeout: false })
      .sort({
        _id: -1,
      })
      .map((symbol) => ({
        ...symbol,
        timeAgo: timeAgo(symbol._id.getTimestamp()),
      }));
    return symbols;
  } catch (err) {
    console.error("Error on find", Date.now() - deploymentTime, err);
    throw err;
  }
}

const findByCode = async (code: string) => {
  try {
    return await collection.findOne({ code: code });
  } catch (err) {
    console.error("Error on insert", Date.now() - deploymentTime, err);
    throw err;
  }
}

const createSymbol = async (symbol: Symbol) => {
  try {
    await collection.insertOne(symbol);
  } catch (err) {
    console.error("Error on insert", Date.now() - deploymentTime, err);
    throw err;
  }
}

let symbol: Symbol|undefined = await findByCode("SHOP.TO");
if (!symbol) {
  symbol = {
    _id: new Bson.ObjectId(),
    code: "SHOP.TO",
    name: "Shopify Inc."
  };
  await createSymbol(symbol);
}

symbol = await findByCode("TAIG.TO");
if (!symbol) {
  symbol = {
    _id: new Bson.ObjectId(),
    code: "TAIG.TO",
    name: "Taiga Motors Corp."
  };
  await createSymbol(symbol);
}

const result = await getSymbols();
console.log(`symbols=` + JSON.stringify(result));
