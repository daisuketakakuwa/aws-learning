import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";

const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  return {
    statusCode: 200,
    body: "HELLO WORLD.",
  };
};

export default handler;
