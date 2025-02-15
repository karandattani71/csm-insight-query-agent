async function findSimilarDocuments(
  collection,
  queryEmbedding,
  limit = 5,
  similarityThreshold = 0.5
) {
  const results = await collection
    .find({ "metadata.category": { $exists: true } })
    .toArray();

  const similarities = results
    .map((doc) => ({
      ...doc,
      similarity: calculateCosineSimilarity(queryEmbedding, doc.embedding),
    }))
    .filter((doc) => doc.similarity >= similarityThreshold);

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function calculateCosineSimilarity(vectorA, vectorB) {
  const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

module.exports = {
  findSimilarDocuments,
  calculateCosineSimilarity,
};
