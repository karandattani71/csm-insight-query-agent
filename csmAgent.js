require('dotenv').config();
const { MongoClient } = require("mongodb");
const readline = require("readline");
const { pipeline } = require("@xenova/transformers");
const { findSimilarDocuments } = require("./vectordatabase");

class CSMAgent {
  constructor() {
    this.MONGODB_URI = process.env.MONGODB_URI;
    this.DB_NAME = process.env.DB_NAME;
    this.COLLECTION_NAME = process.env.COLLECTION_NAME;
    this.TICKETS_COLLECTION = "support_tickets";
    this.EMBEDDING_MODEL = process.env.EMBEDDING_MODEL;
    this.client = null;
    this.featureExtractor = null;
  }

  async initialize() {
    this.featureExtractor = await pipeline(
      "feature-extraction",
      this.EMBEDDING_MODEL
    );
    this.client = new MongoClient(this.MONGODB_URI);
    await this.client.connect();
    console.log("Connected to MongoDB");
  }

  async searchInternal(query, k = 5) {
    const db = this.client.db(this.DB_NAME);
    const collection = db.collection(this.COLLECTION_NAME);
    const queryEmbedding = await this.featureExtractor(query, {
      pooling: "mean",
      normalize: true,
    });
    const queryVector = Array.from(queryEmbedding.data);
    return findSimilarDocuments(collection, queryVector, k, 0.5); 
  }

  externalApiSearch(query) {
    // Mock external API implementation
    return [
      {
        title: "External Report: " + query,
        description: "Sample external report description",
      },
    ];
  }


  generateProbingQuestions(query, reports = []) {
    const questions = new Set();
    const queryAnalysis = this.analyzeQuery(query);
    const reportAnalysis = this.analyzeReports(reports);

    // Contextual question generation
    if (!queryAnalysis.region && reportAnalysis.regions.size > 0) {
      questions.add(
        `Which region are you interested in? Available options: ${[
          ...reportAnalysis.regions,
        ].join(", ")}`
      );
    }

    if (!queryAnalysis.timeframe && reportAnalysis.timeframes.size > 0) {
      questions.add(
        `What time period should we focus on? Available options: ${[
          ...reportAnalysis.timeframes,
        ].join(", ")}`
      );
    }

    if (!queryAnalysis.product && reportAnalysis.products.size > 0) {
      questions.add(
        `Which product are you analyzing? Available options: ${[
          ...reportAnalysis.products,
        ].join(", ")}`
      );
    }

    if (reports.length > 0 && reports[0].similarity < 0.6) {
      questions.add(
        "Would you like to expand your search to related categories?"
      );
    }

    // Fallback questions if no specific context is found
    if (questions.size === 0) {
      questions.add(
        "Could you provide more details about your specific use case?"
      );
      questions.add("What business decision will this analysis support?");
    }

    return Array.from(questions);
  }
  analyzeQuery(query) {
    // Simple pattern matching for key entities
    const regions = ["North America", "Europe", "APAC", "Latin America"];
    const timeframes = ["Q1 2023", "Q2 2023", "Q3 2023", "Q4 2023"];
    const products = ["Product A", "Product B", "Product C"];

    // Handle partial timeframes (e.g., "Q3" -> "Q3 2023")
    const timeframeMatch = timeframes.find((t) => {
      const shortForm = t.split(" ")[0]; // Extract "Q3" from "Q3 2023"
      return query.includes(t) || query.includes(shortForm);
    });

    return {
      region: regions.find((r) => query.includes(r)),
      timeframe: timeframeMatch,
      product: products.find((p) => query.includes(p)),
      metrics: this.detectMetrics(query),
    };
  }
  analyzeReports(reports) {
    // Extract common patterns from retrieved reports
    const analysis = {
      regions: new Set(),
      timeframes: new Set(),
      products: new Set(),
      departments: new Set(),
    };

    reports.forEach((report) => {
      this.extractFromText(report.description, [
        "North America",
        "Europe",
        "APAC",
        "Latin America",
      ]).forEach((r) => analysis.regions.add(r));
      this.extractFromText(report.description, [
        "Q1 2023",
        "Q2 2023",
        "Q3 2023",
        "Q4 2023",
      ]).forEach((t) => analysis.timeframes.add(t));
      this.extractFromText(report.description, [
        "Product A",
        "Product B",
        "Product C",
      ]).forEach((p) => analysis.products.add(p));
      if (report.metadata?.department) {
        analysis.departments.add(report.metadata.department);
      }
    });

    return analysis;
  }

  extractFromText(text, options) {
    return options.filter((opt) => text.includes(opt));
  }

  detectMetrics(query) {
    // Simple metric detection
    const metrics = ["CAC", "MRR", "ROI", "conversion rate"];
    return metrics.filter((m) => query.toLowerCase().includes(m.toLowerCase()));
  }

  async logSupportTicket(query, suggestedReports, context) {
    const db = this.client.db(this.DB_NAME);
    const collection = db.collection(this.TICKETS_COLLECTION);

    const ticket = {
      timestamp: new Date().toISOString(),
      originalQuery: context.originalQuery,
      refinedQuery: context.refinedQuery,
      suggestedReports: suggestedReports.map((r) => ({
        title: r.title,
        description: r.description,
        similarity: r.similarity?.toFixed(3) || "N/A",
      })),
      userContext: {
        probingQuestions: Object.keys(context).filter(
          (k) => k !== "originalQuery"
        ),
        responses: Object.values(context).filter((v) => typeof v === "string"),
      },
      status: "escalated",
      priority: this.determinePriority(context),
      assignedTo: "Unassigned",
      lastUpdated: new Date().toISOString(),
    };

    await collection.insertOne(ticket);
    console.log(
      `\n🚨 Ticket escalated to human CSM. Reference ID: ${ticket._id}`
    );
    this.notifyCSMTeam(ticket);
  }

  determinePriority(context) {
    const urgencyKeywords = ["urgent", "critical", "immediate"];
    const hasUrgency = urgencyKeywords.some((word) =>
      context.originalQuery.toLowerCase().includes(word)
    );
    return hasUrgency ? "high" : "medium";
  }

  notifyCSMTeam(ticket) {
    console.log(`📨 Notification sent for ticket "${ticket.originalQuery}"`);
  }

  async processQuery(query) {
    let refinedQuery = query;
    let internalReports = [];
    let probingAttempts = 0;
    const maxProbingAttempts = 3;

    // Create a single readline interface for the entire process
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    while (probingAttempts < maxProbingAttempts) {
      // Stage 1: Internal Search
      internalReports = await this.searchInternal(refinedQuery);

      if (internalReports.length > 0) {
        console.log("\n=== Internal Reports Found ===");
        internalReports.forEach((r, i) => {
          console.log(`${i + 1}. ${r.title}`);
          console.log(`   ${r.description}\n`);
        });

        const answer = await this.getUserFeedback(
          rl,
          "Are these reports helpful? (y/n): "
        );
        if (answer === "y") {
          console.log("Process completed. Exiting...");
          rl.close(); // Close the readline interface
          return;
        }
      }

      // Stage 2: Probing Flow
      const questions = this.generateProbingQuestions(
        refinedQuery,
        internalReports
      );
      if (questions.length === 0) break; // No more probing questions

      const answer = await this.getUserFeedback(
        rl,
        `Probing: ${questions[0]} `
      );

      // Map partial timeframes (e.g., "Q3") to full timeframes (e.g., "Q3 2023")
      const reportAnalysis = this.analyzeReports(internalReports);
      const fullTimeframe =
        [...reportAnalysis.timeframes].find((t) => t.startsWith(answer)) ||
        answer;
      refinedQuery += ` ${fullTimeframe}`;

      probingAttempts++;

      // Only log refining search if we're not escalating
      if (probingAttempts < maxProbingAttempts) {
        console.log(`Refining search with: ${refinedQuery}`);
      }
    }

    // Stage 3: External API (if no internal reports found after probing)
    if (internalReports.length === 0) {
      const externalReports = this.externalApiSearch(refinedQuery);
      if (externalReports.length > 0) {
        console.log("\n=== External Reports Found ===");
        externalReports.forEach((r, i) => {
          console.log(`${i + 1}. ${r.title}`);
          console.log(`   ${r.description}\n`);
        });

        const answer = await this.getUserFeedback(
          rl,
          "Are these external reports helpful? (y/n): "
        );
        if (answer === "y") {
          console.log("Process completed. Exiting...");
          rl.close(); // Close the readline interface
          return;
        }
      }
    }

    // Stage 4: Escalation
    const context = {
      originalQuery: query,
      refinedQuery,
      probingAttempts,
      ...(await this.collectDiagnosticData(internalReports)),
    };
    await this.logSupportTicket(
      refinedQuery,
      [...internalReports, ...this.externalApiSearch(refinedQuery)],
      context
    );

    rl.close();
  }

  async collectDiagnosticData(reports) {
    return {
      topReportSimilarities: reports
        .slice(0, 3)
        .map((r) => r.similarity?.toFixed(3)),
      systemDiagnostics: {
        memoryUsage: process.memoryUsage().rss,
        processUptime: process.uptime(),
      },
    };
  }

  async getUserFeedback(rl, prompt) {
    return new Promise((resolve) => rl.question(prompt, resolve));
  }
}

// CLI Interface
async function main() {
  const agent = new CSMAgent();
  await agent.initialize();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const query = await new Promise((resolve) =>
      rl.question("\nEnter your analytics query (or 'exit'): ", resolve)
    );
    if (query.toLowerCase() === "exit") break;
    await agent.processQuery(query);
  }

  rl.close();
  await agent.client.close();
}

main().catch(console.error);
