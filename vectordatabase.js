const fs = require("fs");
const { pipeline } = require("@xenova/transformers");
const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "csm_vector_db";
const COLLECTION_NAME = "analytics_reports";

async function createVectorDatabase() {
  let client;
  try {
    console.log("🔄 Initializing vector database...");
    console.log("📡 Loading embedding model...");
    const featureExtractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

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
      const documents = await Promise.all(batch.map(async (report) => {
        const embedding = await featureExtractor(report.description, { pooling: "mean", normalize: true });
        return { ...report, embedding: Array.from(embedding.data) };
      }));

      await collection.insertMany(documents);
      console.log(`✅ Processed batch ${i / batchSize + 1}/${Math.ceil(reports.length / batchSize)}`);
    }

    console.log("✅ Vector database created successfully!");
  } catch (error) {
    console.error("❌ Error processing vector database:", error);
  } finally {
    if (client) await client.close();
  }
}

async function findSimilarDocuments(collection, queryEmbedding, limit = 5, similarityThreshold = 0.5) {
  const results = await collection.find({ "metadata.category": { $exists: true } }).toArray();

  const similarities = results.map(doc => ({
    ...doc,
    similarity: calculateCosineSimilarity(queryEmbedding, doc.embedding),
  })).filter(doc => doc.similarity >= similarityThreshold);

  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}

function calculateCosineSimilarity(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

module.exports = { createVectorDatabase, findSimilarDocuments, calculateCosineSimilarity };

// createVectorDatabase();
