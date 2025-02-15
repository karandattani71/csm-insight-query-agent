require('dotenv').config();
const fs = require("fs");
const { pipeline } = require("@xenova/transformers");
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

async function createVectorDatabase() {
  let client;
  try {
    console.log("🔄 Initializing vector database...");
    console.log("📡 Loading embedding model...");
    const featureExtractor = await pipeline(
      "feature-extraction",
      process.env.EMBEDDING_MODEL
    );

    console.log("🔗 Connecting to MongoDB...");
    client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    console.log("✅ Connected to MongoDB successfully");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    console.log("🗑 Clearing existing data...");
    await collection.deleteMany({});

    console.log("🛠 Creating indexes...");
    await collection.createIndex({ "metadata.category": 1 });

    console.log("📂 Loading reports...");
    const reports = JSON.parse(fs.readFileSync("synthetic_reports.json"));

    console.log("🚀 Generating embeddings...");
    const batchSize = 10;

    for (let i = 0; i < reports.length; i += batchSize) {
      const batch = reports.slice(i, i + batchSize);
      const documents = await Promise.all(
        batch.map(async (report) => {
          const embedding = await featureExtractor(report.description, {
            pooling: "mean",
            normalize: true,
          });
          return { ...report, embedding: Array.from(embedding.data) };
        })
      );

      await collection.insertMany(documents);
      console.log(
        `✅ Processed batch ${i / batchSize + 1}/${Math.ceil(
          reports.length / batchSize
        )}`
      );
    }

    console.log("✅ Vector database created successfully!");
  } catch (error) {
    console.error("❌ Error processing vector database:", error);
  } finally {
    if (client) await client.close();
  }
}

if (require.main === module) {
  createVectorDatabase();
}
