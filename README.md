# Vector Database and CSM Agent

This project involves creating a vector database using MongoDB and a Customer Success Management (CSM) agent that interacts with the database to find similar documents based on embeddings.

## Project Structure

- **createVectorDatabase.js**: Script to initialize and populate the vector database with embeddings.
- **csmAgent.js**: Implements a CSM agent that processes queries, searches for similar documents, and handles user interactions.
- **vectordatabase.js**: Contains functions for finding similar documents and calculating cosine similarity.
- **generateReports.js**: Generates synthetic reports for testing purposes.
- **synthetic_reports.json**: JSON file containing synthetic reports data.
- **.env**: Environment variables configuration file.

## Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/karandattani71/csm-insight-query-agent

   cd csm-insight-query-agent
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create a `.env` file**:
   Create a `.env` file in the root directory with the following content:

   ```
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=csm_vector_db
   COLLECTION_NAME=analytics_reports
   EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
   ```

4. **Generate synthetic reports**:
   Run the following command to generate synthetic reports:

   ```bash
   node generateReports.js
   ```

5. **Create the vector database**:
   Initialize and populate the vector database by running:
   ```bash
   node createVectorDatabase.js
   ```

## Usage

- **Run the CSM Agent**:
  Start the CSM agent to process queries and interact with the vector database:

  ```bash
  node csmAgent.js
  ```

- **Search for Similar Documents**:
  The CSM agent will prompt you to enter queries and will search for similar documents based on the embeddings stored in the database.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
