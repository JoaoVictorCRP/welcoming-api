import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;
const throttleTableName = process.env.THROTTLE_TABLE_NAME;

export const handler = async (event, context) => {
  const ip = event.requestContext.identity.sourceIp;

  const mustBeThrottled = await throttler(ip);

  if (mustBeThrottled) {
    return {
      statusCode: 429,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Too Many Requests! >:(" }),
    };
  }

  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        id: "perfil"
      },
      UpdateExpression: "SET api_hits = if_not_exists(api_hits, :zero) + :inc",
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
      visitor_number: attrs.api_hits,
      contact: {
        linkedin: "https://www.linkedin.com/in/jo%C3%A3o-victor-carrijo-pereira-651074266/",
        github: "https://github.com/JoaoVictorCRP"
      }
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

const throttler = async (ip) => {
  const now = Math.floor(Date.now() / 1000);

  try {
    const checkParams = new GetCommand({
        TableName: throttleTableName,
        Key: { id: `ip#${ip}` }
    });

    const { Item } = await docClient.send(checkParams);

    if (Item && Item.ttl > now) {
      return true;
    }

    await docClient.send(new PutCommand({
      TableName: throttleTableName,
      Item: {
        id: `ip#${ip}`,
        ttl: Math.floor(Date.now() / 1000) + 60 // 1 minute
      }
    }))

    return false;
  } catch (err) {
    console.log("Error while throttling:", err);
    return false;
  }
}