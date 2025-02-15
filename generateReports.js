// const fs = require("fs");
// const { faker } = require("@faker-js/faker");

// const reportTemplates = [
//   {
//     title: "Win/Loss Ratio Across {region} Sales Territories",
//     description: "Analyzes competitive performance in {region} regions for the past {time_period}.",
//     metadataTemplate: {
//       category: "Sales Performance",
//       department: "Sales",
//       tags: ["win-loss", "sales-territories", "{region}"],
//       keywords: ["competitive analysis", "regional performance"]
//     }
//   },
//   {
//     title: "Customer Acquisition Cost by {channel}",
//     description: "Breaks down customer acquisition costs for {channel} over the last {time_period}.",
//     metadataTemplate: {
//       category: "Marketing Analytics",
//       department: "Marketing",
//       tags: ["customer-acquisition", "channel-cost", "{channel}"],
//       keywords: ["cost breakdown", "channel efficiency"]
//     }
//   },
//   {
//     title: "Monthly Recurring Revenue Breakdown for {product}",
//     description: "Provides a detailed breakdown of MRR for {product} across {region}.",
//     metadataTemplate: {
//       category: "Financial Analysis",
//       department: "Finance",
//       tags: ["mrr", "revenue", "{product}"],
//       keywords: ["revenue analysis", "product performance"]
//     }
//   }
// ];

// const generateReports = (numReports = 100) => {
//   const reports = [];
//   for (let i = 0; i < numReports; i++) {
//     const template = faker.helpers.arrayElement(reportTemplates);
//     const region = faker.helpers.arrayElement(["North America", "Europe", "APAC", "Latin America"]);
//     const timePeriod = faker.helpers.arrayElement(["Q1 2023", "Q2 2023", "Q3 2023"]);
//     const channel = faker.helpers.arrayElement(["Email", "Social Media", "Paid Ads"]);
//     const product = faker.helpers.arrayElement(["Product A", "Product B", "Product C"]);

//     // Generate title and description
//     const title = template.title
//       .replace("{region}", region)
//       .replace("{channel}", channel)
//       .replace("{product}", product);
//     const description = template.description
//       .replace("{region}", region)
//       .replace("{time_period}", timePeriod)
//       .replace("{channel}", channel)
//       .replace("{product}", product);

//     // Generate metadata
//     const metadata = { ...template.metadataTemplate };
//     metadata.tags = metadata.tags.map(tag => 
//       tag.replace("{region}", region)
//          .replace("{channel}", channel)
//          .replace("{product}", product)
//     );
//     metadata.timeframe = timePeriod; // Add timeframe
//     metadata.keywords = [...metadata.keywords, faker.word.sample()]; // Add random keyword

//     reports.push({ title, description, metadata });
//   }

//   fs.writeFileSync("synthetic_reports.json", JSON.stringify(reports, null, 2));
//   console.log("Synthetic reports with metadata generated.");
// };

// generateReports(100);
const fs = require("fs");
const { faker } = require("@faker-js/faker");

const reportTemplates = [
  {
    title: "Win/Loss Ratio Across {region} Sales Territories",
    description: "Analyzes competitive performance in {region} regions for the past {time_period}.",
    metadataTemplate: {
      category: "Sales Performance",
      department: "Sales",
      tags: ["win-loss", "sales-territories", "{region}"],
      keywords: ["competitive analysis", "regional performance"],
    },
  },
  {
    title: "Customer Acquisition Cost by {channel}",
    description: "Breaks down customer acquisition costs for {channel} over the last {time_period}.",
    metadataTemplate: {
      category: "Marketing Analytics",
      department: "Marketing",
      tags: ["customer-acquisition", "channel-cost", "{channel}"],
      keywords: ["cost breakdown", "channel efficiency"],
    },
  },
  {
    title: "Monthly Recurring Revenue Breakdown for {product}",
    description: "Provides a detailed breakdown of MRR for {product} across {region}.",
    metadataTemplate: {
      category: "Financial Analysis",
      department: "Finance",
      tags: ["mrr", "revenue", "{product}"],
      keywords: ["revenue analysis", "product performance"],
    },
  },
];

const generateReports = (numReports = 100) => {
  const reports = [];
  for (let i = 0; i < numReports; i++) {
    const template = faker.helpers.arrayElement(reportTemplates);
    const region = faker.helpers.arrayElement(["North America", "Europe", "APAC", "Latin America"]);
    const timePeriod = faker.helpers.arrayElement(["Q1 2023", "Q2 2023", "Q3 2023"]);
    const channel = faker.helpers.arrayElement(["Email", "Social Media", "Paid Ads"]);
    const product = faker.helpers.arrayElement(["Product A", "Product B", "Product C"]);

    // Generate title and description
    const title = template.title
      .replace("{region}", region)
      .replace("{channel}", channel)
      .replace("{product}", product);
    const description = template.description
      .replace("{region}", region)
      .replace("{time_period}", timePeriod)
      .replace("{channel}", channel)
      .replace("{product}", product);

    // Generate metadata
    const metadata = { ...template.metadataTemplate };
    metadata.tags = metadata.tags.map((tag) =>
      tag.replace("{region}", region).replace("{channel}", channel).replace("{product}", product)
    );
    metadata.timeframe = timePeriod; // Add timeframe
    metadata.keywords = [...metadata.keywords, faker.word.sample()]; // Add random keyword

    reports.push({ title, description, metadata });
  }

  fs.writeFileSync("synthetic_reports.json", JSON.stringify(reports, null, 2));
  console.log("Synthetic reports with metadata generated.");
};

generateReports(100);