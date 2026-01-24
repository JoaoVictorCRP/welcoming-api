import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;

export const handler = async (event, context ) => {
  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        id: "perfil"
      },
      UpdateExpression: "SET hits = if_not_exists(hits, :zero) + :inc",
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0
      },
      ReturnValues: "ALL_NEW"
    });

    const response = await docClient.send(command);
    const attrs = response.Attributes;

    const body = {
      name: "Joao Victor Carrijo",
      role: "DevOps Engineer",
      location: "Franca, Sao Paulo, Brasil",
      current_focus: "Learning Kubernetes and Cloud Native Technologies",
      message: "Thanks for visiting my profile!",
      visitor_number: attrs.hits,
      contact: {
        linkedin: "https://www.linkedin.com/in/jo%C3%A3o-victor-carrijo-pereira-651074266/",
        github: "https://github.com/JoaoVictorCRP"
      },
      api_powered_by: ["Node.js", "AWS SAM", "API Gateway", "AWS Lambda", "DynamoDB"],
    }
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.error("Unexpected error while processing request:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Internal Server Error! :(" }),
    };
  }
}